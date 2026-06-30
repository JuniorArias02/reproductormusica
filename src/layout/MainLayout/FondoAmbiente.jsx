import { useEffect, useRef } from 'react';
import { useReproductor } from '../../features/Player/context/ContextoReproductor';
import { createVisualizerState } from './Visualizer/VisualizerState';
import { updatePhysics, updateTextureCache } from './Visualizer/VisualizerPhysics';
import { activeLayers } from './Visualizer/layers';
import { useAudioSync } from '../../features/Player/hooks/useAudioSync';

/**
 * Contenedor React del Motor audiovisual 6-Band v4 (Arquitectura Limpia).
 * Ahora la lógica y las capas están modularizadas en /Visualizer/
 */
export function FondoAmbiente() {
  const { color, estaReproduciendo, obtenerBandas, refElemento, mapaMusical, analizandoIA } = useReproductor();
  const refCanvas   = useRef(null);
  const refRaf      = useRef(null);
  const refVignette = useRef(null);
  const S           = useRef(null); // Estado mutable centralizado

  // Hook que sincroniza el audio con el JSON precalculado (si existe)
  const syncState = useAudioSync(refElemento, mapaMusical);

  // Inicializar estado una sola vez
  if (!S.current) {
    S.current = createVisualizerState();
  }

  // Ajuste de canvas al resize
  useEffect(() => {
    const c = refCanvas.current;
    if (!c) return;
    const fit = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // Sincronizar color de canción
  useEffect(() => {
    if (!color || !S.current) return;
    S.current.tr = color.r;
    S.current.tg = color.g;
    S.current.tb = color.b;
  }, [color]);

  // Sincronizar estado de reproducción
  useEffect(() => {
    if (S.current) S.current.playing = estaReproduciendo;
  }, [estaReproduciendo]);

  // Bucle principal de animación
  useEffect(() => {
    const canvas = refCanvas.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let last = performance.now();

    const loop = (now) => {
      try {
        const dt = Math.min(now - last, 33);
        last = now;
        const s = S.current;
        const W = canvas.width, H = canvas.height;
        const cx = W * 0.5, cy = H * 0.5;

        ctx.clearRect(0, 0, W, H);

        // ── 1. Física, Audio y Envelopes ──
        // Si tenemos JSON de la IA, le pasamos los triggers a las físicas nativas
        const iaSync = (mapaMusical && syncState.current) ? syncState.current : null;
        updatePhysics(s, dt, obtenerBandas, W, H, cx, cy, iaSync);
        
        // Color base suave (para caché de blobs, evita recálculo excesivo)
        const baseR = s.cr | 0, baseG = s.cg | 0, baseB = s.cb | 0;
        updateTextureCache(s, baseR, baseG, baseB);

        // Color excitado: destellos (flashes) sincronizados con el beat
        const flash = (s.pulse * 55) + (s.dropIntensidad * 35);
        const R = Math.min(255, baseR + flash) | 0;
        const G = Math.min(255, baseG + flash) | 0;
        const B = Math.min(255, baseB + flash) | 0;


        ctx.globalCompositeOperation = 'screen';

        // ── 2. Renderizado Modular de Capas ──
        activeLayers.forEach(renderLayer => {
          renderLayer(ctx, s, W, H, cx, cy, dt, R, G, B);
        });

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';

        // ── 3. Efectos de UI/CSS ──
        if (refCanvas.current) {
          refCanvas.current.style.transform = `scale(${s.camScale})`;
        }

        if (refVignette.current) {
          refVignette.current.style.opacity =
            s.vigAlpha > 0.005 ? String(Math.min(s.vigAlpha * 0.80, 0.8)) : '0';
        }

        refRaf.current = requestAnimationFrame(loop);
      } catch(e) {
        console.error('[FondoAmbiente]', e);
        refRaf.current = requestAnimationFrame(loop);
      }
    };

    refRaf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(refRaf.current);
  }, []);

  return (
    <>
      <canvas
        ref={refCanvas}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 0, willChange: 'transform', mixBlendMode: 'screen' }}
      />
      <div
        ref={refVignette}
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          opacity: 0,
          transition: 'opacity 60ms linear',
          background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.90) 100%)',
        }}
      />
    </>
  );
}
