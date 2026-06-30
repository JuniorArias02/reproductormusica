import { create } from 'zustand';
import { audioService } from '../infrastructure/AudioService';
import { extraerMetadatosMP3 } from '../services/extraerMetadatos';

// ─── Utilidad para IndexedDB (Guardar Handle de Carpeta) ───────────────
const IDB_DB_NAME = 'ReproductorDB';
const IDB_STORE_NAME = 'handles';

const initDB = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(IDB_DB_NAME, 1);
  request.onupgradeneeded = (e) => e.target.result.createObjectStore(IDB_STORE_NAME);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const saveHandle = async (handle) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    tx.objectStore(IDB_STORE_NAME).put(handle, 'musicFolderHandle');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getHandle = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readonly');
    const req = tx.objectStore(IDB_STORE_NAME).get('musicFolderHandle');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(tx.error);
  });
};

// ─── Leer archivos estáticos (igual que en tu hook anterior) ───────────
const modulosArchivos = import.meta.glob('../../../assets/media/*.{mp3,mp4}', { eager: true });

const extraerTitulo = (nombre) => {
  const sinExt = nombre.replace(/\.[^/.]+$/, '');
  return sinExt.charAt(0).toUpperCase() + sinExt.slice(1);
};

const cancionesEstaticas = Object.keys(modulosArchivos).map((ruta, index) => {
  const nombreArchivo = ruta.split('/').pop();
  return {
    id: index.toString(),
    titulo: extraerTitulo(nombreArchivo),
    artista: 'Artista Local',
    archivo: modulosArchivos[ruta].default,
    esVideo: nombreArchivo.endsWith('.mp4'),
    portada: null,
  };
});

export const usePlayerStore = create((set, get) => {
  
  // Sincronizar volumen inicial con el servicio
  const volGuardado = localStorage.getItem('reproductor_volumen');
  const volumenInicial = volGuardado !== null ? parseFloat(volGuardado) : 1;
  audioService.setVolume(volumenInicial);

  const likedGuardado = localStorage.getItem('reproductor_liked');
  const likedInicial = likedGuardado ? new Set(JSON.parse(likedGuardado)) : new Set();

  // Suscriptores al servicio nativo
  audioService.onTimeUpdate((time) => set({ progreso: time }));
  audioService.onDurationChange((duration) => set({ duracion: duration }));
  audioService.onEnded(() => {
    get().siguienteCancion();
  });

  return {
    // ─── Referencias al DOM (Para los Canvas visuales) ───
    refElemento: { current: audioService.getMediaElement() },

    // ─── Estado ───
    estaReproduciendo: false,
    progreso: 0,
    duracion: 0,
    volumen: volumenInicial,
    cancionActual: null,
    mapaMusical: null,      // JSON con drops, beats, onsets y vocals devuelto por Node.js
    analizandoIA: false,    // Indicador visual si Python está procesando
    mezclando: false,
    repitiendo: false,
    listaLiked: likedInicial,
    listaCanciones: cancionesEstaticas,
    panelExpandido: false,
    sidebarExpandido: true,

    // ─── Acciones ───
    abrirPanel: () => set({ panelExpandido: true }),
    cerrarPanel: () => set({ panelExpandido: false }),
    alternarSidebar: () => set((state) => ({ sidebarExpandido: !state.sidebarExpandido })),

    cargarCancion: async (cancion) => {
      // Detenemos la reproducción anterior y mostramos que estamos analizando
      audioService.pause();
      set({ cancionActual: cancion, estaReproduciendo: false, progreso: 0, mapaMusical: null, analizandoIA: true });

      // Hacer petición al JSON estático local (precalculado)
      try {
        const filename = encodeURIComponent(cancion.titulo + '.json');
        console.log(`[AI] Buscando mapa musical estático → /mapas/${filename}`);
        
        const response = await fetch(`/mapas/${filename}`);
        
        if (response.ok) {
          const mapa = await response.json();
          set({ mapaMusical: mapa, analizandoIA: false });
          console.log(`[AI] Mapa Musical cargado exitosamente para: ${cancion.titulo}`);
        } else {
          set({ analizandoIA: false });
          console.warn(`[AI] No hay JSON precalculado para ${cancion.titulo}. Reproduciendo en modo normal (Fallback).`);
        }
      } catch (err) {
        set({ analizandoIA: false });
        console.warn("[AI] Error al intentar leer el JSON local.");
      }

      // ── Una vez que la IA termine (con éxito o error), RECIÉN reproducimos el audio ──
      audioService.play(cancion.archivo);
      set({ estaReproduciendo: true });
    },

    reproducir: () => {
      const { cancionActual } = get();
      if (!cancionActual) return;
      audioService.play();
      set({ estaReproduciendo: true });
    },

    pausar: () => {
      audioService.pause();
      set({ estaReproduciendo: false });
    },

    alternarReproduccion: () => {
      if (get().estaReproduciendo) get().pausar();
      else get().reproducir();
    },

    cambiarTiempo: (tiempo) => {
      audioService.seek(tiempo);
      set({ progreso: tiempo });
    },

    cambiarVolumen: (nuevoVolumen) => {
      audioService.setVolume(nuevoVolumen);
      localStorage.setItem('reproductor_volumen', nuevoVolumen.toString());
      set({ volumen: nuevoVolumen });
    },

    alternarMezcla: () => set((state) => ({ mezclando: !state.mezclando })),
    
    alternarRepeticion: () => {
      const repite = !get().repitiendo;
      audioService.setLoop(repite);
      set({ repitiendo: repite });
    },

    siguienteCancion: () => {
      const { cancionActual, listaCanciones, mezclando, cargarCancion } = get();
      if (!cancionActual || listaCanciones.length === 0) return;
      
      if (mezclando) {
        let randomIndex = Math.floor(Math.random() * listaCanciones.length);
        if (listaCanciones.length > 1) {
          while (listaCanciones[randomIndex].id === cancionActual.id) {
            randomIndex = Math.floor(Math.random() * listaCanciones.length);
          }
        }
        cargarCancion(listaCanciones[randomIndex]);
      } else {
        const indexActual = listaCanciones.findIndex(c => c.id === cancionActual.id);
        const siguienteIndex = (indexActual + 1) % listaCanciones.length;
        cargarCancion(listaCanciones[siguienteIndex]);
      }
    },

    cancionAnterior: () => {
      const { cancionActual, listaCanciones, progreso, cambiarTiempo, cargarCancion } = get();
      if (!cancionActual || listaCanciones.length === 0) return;

      if (progreso > 3) {
        cambiarTiempo(0);
        return;
      }
      
      const indexActual = listaCanciones.findIndex(c => c.id === cancionActual.id);
      const anteriorIndex = indexActual === 0 ? listaCanciones.length - 1 : indexActual - 1;
      cargarCancion(listaCanciones[anteriorIndex]);
    },

    alternarLike: (id) => {
      set((state) => {
        const nuevo = new Set(state.listaLiked);
        if (nuevo.has(id)) nuevo.delete(id);
        else nuevo.add(id);
        localStorage.setItem('reproductor_liked', JSON.stringify(Array.from(nuevo)));
        return { listaLiked: nuevo };
      });
    },

    limpiarLikes: () => {
      localStorage.removeItem('reproductor_liked');
      set({ listaLiked: new Set() });
    },

    estaEnLiked: (id) => get().listaLiked.has(id),

    obtenerFrecuencias: () => {
      return audioService.getFrequencies();
    },

    obtenerBandas: () => {
      return audioService.getBands();
    },

    // ─── Funciones asíncronas para inicialización ───
    iniciarMetadatosEstaticos: async () => {
      const { listaCanciones } = get();
      const actualizadas = await Promise.all(
        listaCanciones.map(async (c) => {
          if (!c.esVideo && !c.portada) {
            try {
              const meta = await extraerMetadatosMP3(c.archivo, c.titulo);
              return {
                ...c,
                portada: meta.portada,
                artista: meta.artista !== 'Artista Local' ? meta.artista : c.artista,
                titulo: meta.tituloMetadatos ? meta.tituloMetadatos : c.titulo,
                duracion: meta.duracion || 0
              };
            } catch(e) { return { ...c, duracion: 0 }; }
          } else if (c.esVideo) {
             const dur = await new Promise(resolve => {
                const v = document.createElement('video');
                v.src = c.archivo;
                v.onloadedmetadata = () => resolve(v.duration);
                v.onerror = () => resolve(0);
             });
             return { ...c, duracion: dur };
          }
          return c;
        })
      );
      set({ listaCanciones: actualizadas });
    },

    importarCancionesLocales: async (archivos) => {
      if (!archivos || archivos.length === 0) return;
      
      const nuevasCanciones = [];
      for (const archivo of archivos) {
        if (!archivo.type.startsWith('audio/') && !archivo.type.startsWith('video/')) continue;
        
        const objectUrl = URL.createObjectURL(archivo);
        const esVideo = archivo.type.startsWith('video/');
        const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        let portada = null;
        let artista = 'Artista Desconocido';
        let titulo = archivo.name.replace(/\.[^/.]+$/, "");
        let duracion = 0;
        
        if (!esVideo) {
          try {
            const meta = await extraerMetadatosMP3(objectUrl, titulo);
            portada = meta.portada;
            if (meta.artista !== 'Artista Local') artista = meta.artista;
            if (meta.tituloMetadatos) titulo = meta.tituloMetadatos;
            duracion = meta.duracion || 0;
          } catch(e) {}
        } else {
          duracion = await new Promise(resolve => {
            const v = document.createElement('video');
            v.src = objectUrl;
            v.onloadedmetadata = () => resolve(v.duration);
            v.onerror = () => resolve(0);
          });
        }
        
        nuevasCanciones.push({
          id, titulo, artista, portada, archivo: objectUrl, esVideo, duracion
        });
      }
      
      if (nuevasCanciones.length > 0) {
        set((state) => ({ listaCanciones: [...state.listaCanciones, ...nuevasCanciones] }));
      }
    },

    // ─── Nuevas funciones para vincular carpeta local (File System Access API) ───
    vincularCarpetaLocal: async () => {
      try {
        if (!('showDirectoryPicker' in window)) {
          alert('Tu navegador no soporta la vinculación de carpetas. Te recomendamos usar Google Chrome o Microsoft Edge en PC.');
          return;
        }

        const handle = await window.showDirectoryPicker({
          id: 'music-folder',
          mode: 'read',
          startIn: 'music'
        });
        
        await saveHandle(handle);
        await get().cargarDirectorio(handle);
      } catch (err) {
        console.error('Error al vincular carpeta o selección cancelada:', err);
      }
    },

    restaurarCarpetaVinculada: async () => {
      try {
        const handle = await getHandle();
        if (handle) {
          // Verificar permiso
          const options = { mode: 'read' };
          if ((await handle.queryPermission(options)) !== 'granted') {
            const permission = await handle.requestPermission(options);
            if (permission !== 'granted') return;
          }
          await get().cargarDirectorio(handle);
        }
      } catch (err) {
        console.error('Error al restaurar la carpeta vinculada:', err);
      }
    },

    cargarDirectorio: async (dirHandle) => {
      const nuevasCanciones = [];
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && (entry.name.endsWith('.mp3') || entry.name.endsWith('.mp4'))) {
          const file = await entry.getFile();
          
          const objectUrl = URL.createObjectURL(file);
          const esVideo = file.type.startsWith('video/') || entry.name.endsWith('.mp4');
          const id = `local_dir_${entry.name}`;
          
          let portada = null;
          let artista = 'Artista Desconocido';
          let titulo = file.name.replace(/\.[^/.]+$/, "");
          let duracion = 0;
          
          if (!esVideo) {
            try {
              const meta = await extraerMetadatosMP3(objectUrl, titulo);
              portada = meta.portada;
              if (meta.artista !== 'Artista Local') artista = meta.artista;
              if (meta.tituloMetadatos) titulo = meta.tituloMetadatos;
              duracion = meta.duracion || 0;
            } catch(e) {}
          } else {
            duracion = await new Promise(resolve => {
              const v = document.createElement('video');
              v.src = objectUrl;
              v.onloadedmetadata = () => resolve(v.duration);
              v.onerror = () => resolve(0);
            });
          }
          
          nuevasCanciones.push({
            id, titulo, artista, portada, archivo: objectUrl, esVideo, duracion
          });
        }
      }
      
      if (nuevasCanciones.length > 0) {
        set((state) => {
          const idsExistentes = new Set(state.listaCanciones.map(c => c.id));
          const cancionesFiltradas = nuevasCanciones.filter(c => !idsExistentes.has(c.id));
          return { listaCanciones: [...state.listaCanciones, ...cancionesFiltradas] };
        });
      }
    }
  };
});
