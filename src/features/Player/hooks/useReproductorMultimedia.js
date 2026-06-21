import { useState, useRef, useEffect, useCallback } from 'react';

export function useReproductorMultimedia() {
  const refElemento = useRef(null);
  const [estaReproduciendo, setEstaReproduciendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [volumen, setVolumen] = useState(1);
  const [cancionActual, setCancionActual] = useState(null);
  const [mezclando, setMezclando] = useState(false);
  const [listaLiked, setListaLiked] = useState(new Set());

  const reproducir = useCallback(async () => {
    if (refElemento.current) {
      try {
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
    }
  }, []);

  const cargarCancion = useCallback((cancion) => {
    setCancionActual(cancion);
  }, []);

  const alternarMezcla = useCallback(() => {
    setMezclando((prev) => !prev);
  }, []);

  const alternarLike = useCallback((id) => {
    setListaLiked((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }, []);

  const estaEnLiked = useCallback((id) => listaLiked.has(id), [listaLiked]);

  useEffect(() => {
    if (cancionActual && refElemento.current) {
      refElemento.current.src = cancionActual.archivo;
      refElemento.current.load();
      reproducir();
    }
  }, [cancionActual, reproducir]);

  return {
    refElemento,
    estaReproduciendo,
    progreso,
    duracion,
    volumen,
    cancionActual,
    mezclando,
    listaLiked,
    alternarReproduccion,
    cambiarTiempo,
    cambiarVolumen,
    cargarCancion,
    alternarMezcla,
    alternarLike,
    estaEnLiked,
    manejarActualizacionTiempo,
    manejarMetadatosCargados,
  };
}
