import { useState, useRef, useEffect, useCallback } from 'react';
import { extraerMetadatosMP3 } from '../services/extraerMetadatos';

// ─── Leer archivos del directorio media con Vite Glob ───────────
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

export function useReproductorMultimedia() {
  const refElemento = useRef(null);
  const [estaReproduciendo, setEstaReproduciendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [volumen, setVolumen] = useState(() => {
    const volGuardado = localStorage.getItem('reproductor_volumen');
    return volGuardado !== null ? parseFloat(volGuardado) : 1;
  });
  const [cancionActual, setCancionActual] = useState(null);
  const [mezclando, setMezclando] = useState(false);
  const [repitiendo, setRepitiendo] = useState(false);
  const [listaLiked, setListaLiked] = useState(() => {
    const likedGuardado = localStorage.getItem('reproductor_liked');
    return likedGuardado ? new Set(JSON.parse(likedGuardado)) : new Set();
  });
  const [listaCanciones, setListaCanciones] = useState(cancionesEstaticas);
  
  // Estado global del panel lateral Now Playing
  const [panelExpandido, setPanelExpandido] = useState(false);
  const abrirPanel = useCallback(() => setPanelExpandido(true), []);
  const cerrarPanel = useCallback(() => setPanelExpandido(false), []);

  // Cargar metadatos asincrónicamente
  useEffect(() => {
    let montado = true;
    const cargarMetadatos = async () => {
      const actualizadas = await Promise.all(
        cancionesEstaticas.map(async (c) => {
          if (!c.esVideo) {
            const meta = await extraerMetadatosMP3(c.archivo, c.titulo);
            return {
              ...c,
              portada: meta.portada,
              artista: meta.artista !== 'Artista Local' ? meta.artista : c.artista,
              titulo: meta.tituloMetadatos ? meta.tituloMetadatos : c.titulo,
            };
          }
          return c;
        })
      );
      if (montado) {
        setListaCanciones(actualizadas);
      }
    };
    cargarMetadatos();
    return () => { montado = false; };
  }, []);

  const reproducir = useCallback(async () => {
    if (refElemento.current) {
      try {
        if (refAudioCtx.current && refAudioCtx.current.state === 'suspended') {
          await refAudioCtx.current.resume();
        }
        await refElemento.current.play();
        setEstaReproduciendo(true);
      } catch (e) {
        console.error('Error al reproducir', e);
      }
    }
  }, []);

  const pausar = useCallback(() => {
    if (refElemento.current) {
      refElemento.current.pause();
      setEstaReproduciendo(false);
    }
  }, []);

  const alternarReproduccion = useCallback(() => {
    if (estaReproduciendo) pausar();
    else reproducir();
  }, [estaReproduciendo, pausar, reproducir]);

  const manejarActualizacionTiempo = useCallback(() => {
    if (refElemento.current) setProgreso(refElemento.current.currentTime);
  }, []);

  const manejarMetadatosCargados = useCallback(() => {
    if (refElemento.current) setDuracion(refElemento.current.duration);
  }, []);

  const cambiarTiempo = useCallback((tiempo) => {
    if (refElemento.current) {
      refElemento.current.currentTime = tiempo;
      setProgreso(tiempo);
    }
  }, []);

  const cambiarVolumen = useCallback((nuevoVolumen) => {
    if (refElemento.current) {
      refElemento.current.volume = nuevoVolumen;
      setVolumen(nuevoVolumen);
      localStorage.setItem('reproductor_volumen', nuevoVolumen.toString());
    }
  }, []);

  const cargarCancion = useCallback((cancion) => {
    setCancionActual(cancion);
  }, []);

  const alternarMezcla = useCallback(() => {
    setMezclando((prev) => !prev);
  }, []);

  const alternarRepeticion = useCallback(() => {
    setRepitiendo((prev) => !prev);
  }, []);

  const siguienteCancion = useCallback(() => {
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
  }, [cancionActual, listaCanciones, mezclando, cargarCancion]);

  const cancionAnterior = useCallback(() => {
    if (!cancionActual || listaCanciones.length === 0) return;

    // Si la canción lleva más de 3 segundos sonando, reiniciar en vez de saltar atrás
    if (progreso > 3) {
      cambiarTiempo(0);
      return;
    }
    
    const indexActual = listaCanciones.findIndex(c => c.id === cancionActual.id);
    const anteriorIndex = indexActual === 0 ? listaCanciones.length - 1 : indexActual - 1;
    cargarCancion(listaCanciones[anteriorIndex]);
  }, [cancionActual, listaCanciones, progreso, cambiarTiempo, cargarCancion]);

  const alternarLike = useCallback((id) => {
    setListaLiked((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      
      // Persistir de inmediato convirtiendo a Array
      localStorage.setItem('reproductor_liked', JSON.stringify(Array.from(nuevo)));
      
      return nuevo;
    });
  }, []);

  const limpiarLikes = useCallback(() => {
    setListaLiked(new Set());
    localStorage.removeItem('reproductor_liked');
  }, []);

  const estaEnLiked = useCallback((id) => listaLiked.has(id), [listaLiked]);

  useEffect(() => {
    if (cancionActual && refElemento.current) {
      refElemento.current.src = cancionActual.archivo;
      refElemento.current.load();
      reproducir();
    }
  }, [cancionActual, reproducir]);

  const refAnalyser = useRef(null);
  const refDataArray = useRef(null);

  const refAudioCtx = useRef(null);

  useEffect(() => {
    const inicializarAudio = () => {
      if (!refAnalyser.current && refElemento.current) {
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          refAudioCtx.current = audioCtx;
          const source = audioCtx.createMediaElementSource(refElemento.current);
          const analyser = audioCtx.createAnalyser();
          
          analyser.fftSize = 64; // 32 barras (mitad del fftSize)
          source.connect(analyser);
          analyser.connect(audioCtx.destination);
          
          refAnalyser.current = analyser;
          refDataArray.current = new Uint8Array(analyser.frequencyBinCount);
        } catch (e) {
          console.warn("No se pudo iniciar Web Audio API:", e);
        }
      }
    };

    const elemento = refElemento.current;
    if (elemento) {
      elemento.volume = volumen; // Sincronizar volumen inicial
      elemento.addEventListener('play', inicializarAudio, { once: true });
    }
    return () => {
      if (elemento) elemento.removeEventListener('play', inicializarAudio);
    };
  }, []);

  const obtenerFrecuencias = useCallback(() => {
    if (refAnalyser.current && refDataArray.current) {
      refAnalyser.current.getByteFrequencyData(refDataArray.current);
      return refDataArray.current;
    }
    return null;
  }, []);

  return {
    refElemento,
    estaReproduciendo,
    progreso,
    duracion,
    volumen,
    cancionActual,
    mezclando,
    repitiendo,
    listaLiked,
    alternarReproduccion,
    cambiarTiempo,
    cambiarVolumen,
    cargarCancion,
    alternarMezcla,
    alternarRepeticion,
    siguienteCancion,
    cancionAnterior,
    alternarLike,
    estaEnLiked,
    limpiarLikes,
    manejarActualizacionTiempo,
    manejarMetadatosCargados,
    obtenerFrecuencias,
    listaCanciones,
    panelExpandido,
    abrirPanel,
    cerrarPanel,
  };
}
