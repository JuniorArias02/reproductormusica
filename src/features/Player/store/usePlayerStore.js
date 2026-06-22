import { create } from 'zustand';
import { audioService } from '../infrastructure/AudioService';
import { extraerMetadatosMP3 } from '../services/extraerMetadatos';

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

    cargarCancion: (cancion) => {
      audioService.play(cancion.archivo);
      set({ cancionActual: cancion, estaReproduciendo: true, progreso: 0 });
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
              };
            } catch(e) { return c; }
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
        
        if (!esVideo) {
          try {
            const meta = await extraerMetadatosMP3(objectUrl, titulo);
            portada = meta.portada;
            if (meta.artista !== 'Artista Local') artista = meta.artista;
            if (meta.tituloMetadatos) titulo = meta.tituloMetadatos;
          } catch(e) {}
        }
        
        nuevasCanciones.push({
          id, titulo, artista, portada, archivo: objectUrl, esVideo
        });
      }
      
      if (nuevasCanciones.length > 0) {
        set((state) => ({ listaCanciones: [...state.listaCanciones, ...nuevasCanciones] }));
      }
    }
  };
});
