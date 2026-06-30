import { useRef, useEffect } from 'react';

/**
 * Hook para sincronizar el mapa musical (JSON) con el tiempo real del audio.
 * Como aún no tenemos el backend de Python (Fase 1), este hook está preparado
 * estructuralmente y puede recibir un "Mock" o funcionar en modo fallback.
 */
export function useAudioSync(audioRef, mapaMusical) {
  // Usamos refs para no re-renderizar React en cada milisegundo
  const syncState = useRef({
    isDropActive: false,
    currentBeat: null,
    currentOnset: null,
    vocalIntensity: 0,
    lastCheckedTime: 0
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !mapaMusical) return;

    let rafId;

    const loop = () => {
      const currentTime = audio.currentTime;
      
      const { estructura, ritmo, vocals } = mapaMusical;
      
      // 1. Verificar si estamos en un drop
      if (estructura && estructura.drops) {
        syncState.current.isDropActive = estructura.drops.some(d => currentTime >= d.inicio && currentTime <= d.fin);
      }
      
      // 2. Disparar Beats (Batería)
      if (ritmo && ritmo.beats) {
        const beat = ritmo.beats.find(b => b > syncState.current.lastCheckedTime && b <= currentTime);
        if (beat) syncState.current.currentBeat = beat;
      }
      
      // 3. Disparar Onsets (Instrumentos)
      if (estructura && estructura.onsets) {
        const onset = estructura.onsets.find(o => o > syncState.current.lastCheckedTime && o <= currentTime);
        if (onset) syncState.current.currentOnset = onset;
      }

      // 4. Intensidad Vocal
      if (vocals) {
         // Buscar el frame de voz más cercano al tiempo actual
         const currentVocal = vocals.find(v => v.time >= currentTime);
         if (currentVocal) syncState.current.vocalIntensity = currentVocal.intensity;
      }

      syncState.current.lastCheckedTime = currentTime;
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [audioRef, mapaMusical]);

  // Retornamos la referencia mutable para que el motor físico (Canvas) la lea
  // sin provocar re-renders en la interfaz.
  return syncState;
}
