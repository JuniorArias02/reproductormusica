import { useEffect, useRef } from 'react';
import { useReproductor } from '../../features/Player/context/ContextoReproductor';

const CANTIDAD_ESTRELLAS = 120;
const CANTIDAD_BLOBS = 4;
const PASO_ESTRELLA = 0.018;

/**
 * Canvas full-screen de fondo. Optimizado para 120fps.
 * Renderiza nebulosas orbitales y campo de estrellas con delta-time.
 * Sin ondas ni shockwaves.
 */
export function FondoAmbiente() {
  const { color, estaReproduciendo, obtenerFrecuencias } = useReproductor();
  const refCanvas = useRef(null);
  const refRaf = useRef(null);
  const sis = useRef(null);

  if (!sis.current) {
    // Estrellas: Float32Array [x, y, vx, vy, radio, fase]
    const estrellas = new Float32Array(CANTIDAD_ESTRELLAS * 6);
    for (let i = 0; i < CANTIDAD_ESTRELLAS; i++) {
      const b = i * 6;
      estrellas[b + 0] = Math.random();
      estrellas[b + 1] = Math.random();
      estrellas[b + 2] = (Math.random() - 0.5) * 0.00006;
      estrellas[b + 3] = -Math.random() * 0.00010;
      estrellas[b + 4] = 0.4 + Math.random() * 1.2;
      estrellas[b + 5] = Math.random() * Math.PI * 2;
    }

    // Blobs orbitales
    const blobs = Array.from({ length: CANTIDAD_BLOBS }, (_, i) => ({
      angulo: (Math.PI * 2 / CANTIDAD_BLOBS) * i,
      radioOrbit: 0.14 + Math.random() * 0.20,
      velocidad: (0.00012 + Math.random() * 0.00008) * (i % 2 === 0 ? 1 : -1),
      tamano: 0.16 + Math.random() * 0.10,
      faseAlpha: Math.random() * Math.PI * 2,
    }));

    sis.current = {
      estrellas, blobs,
      cr: 255, cg: 74, cb: 28,
      tr: 255, tg: 74, tb: 28,
      t: 0,
      reproduciendo: false,
    };
  }

  // Ajuste de tamaño del canvas
  useEffect(() => {
    const c = refCanvas.current;
    if (!c) return;
    const ajustar = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    ajustar();
    window.addEventListener('resize', ajustar);
    return () => window.removeEventListener('resize', ajustar);
  }, []);

  // Reaccionar a cambio de color de la canción
  useEffect(() => {
    if (!color) return;
    const s = sis.current;
    s.tr = color.r; s.tg = color.g; s.tb = color.b;
  }, [color]);

  // Reaccionar a reproducción (latido)
  useEffect(() => {
    if (sis.current) sis.current.reproduciendo = estaReproduciendo;
  }, [estaReproduciendo]);

  // Bucle principal de animación
  useEffect(() => {
    const canvas = refCanvas.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let ultimo = performance.now();

    const bucle = (ahora) => {
      const dt = Math.min(ahora - ultimo, 33);
      ultimo = ahora;
      const s = sis.current;
      const W = canvas.width, H = canvas.height;

      ctx.clearRect(0, 0, W, H);
      
      // Sincronización Épica y Agresiva con Audio (Física de Altavoz Real)
      let factorAudioBase = 0;
      if (s.reproduciendo && obtenerFrecuencias) {
        const frecuencias = obtenerFrecuencias();
        if (frecuencias) {
          // Extraer el "pico" real de graves (primeras 4 bandas)
          // Usamos Math.max para no diluir el golpe seco del bombo (kick)
          let graves = 0;
          for (let i = 0; i < 4; i++) {
            graves = Math.max(graves, frecuencias[i]);
          }
          
          // Mapeo exponencial: Cortamos el ruido por debajo de 160
          // El rango útil para impactos es de 160 a 255 (95 de diferencia)
          let intensidadCruda = Math.max(0, graves - 160) / 95; 
          
          // Elevamos a la 3ra potencia. 
          // Esto apaga los sonidos normales y hace explotar los golpes verdaderos.
          factorAudioBase = Math.pow(intensidadCruda, 3);
        }
      }

      // Fast Attack, Slow Decay (Ataque rápido, Caída suave elástica)
      if (s.factorAudioSuave === undefined) s.factorAudioSuave = 0;
      
      if (factorAudioBase > s.factorAudioSuave) {
         // Ataque brutal: el visualizador reacciona al instante
         s.factorAudioSuave += (factorAudioBase - s.factorAudioSuave) * 0.85;
      } else {
         // Decay (Caída): se desinfla suavemente como la membrana de un altavoz
         s.factorAudioSuave += (factorAudioBase - s.factorAudioSuave) * 0.08;
      }

      // El tiempo global avanza hasta 20 VECES MÁS RÁPIDO en el drop
      s.t += dt * (1 + s.factorAudioSuave * 20);

      // Interpolar color suavemente
      s.cr += (s.tr - s.cr) * 0.02;
      s.cg += (s.tg - s.cg) * 0.02;
      s.cb += (s.tb - s.cb) * 0.02;
      const R = s.cr | 0, G = s.cg | 0, B = s.cb | 0;

      // El tamaño base ahora es más pequeño (0.65), pero explota masivamente (+1.85 = 2.5x)
      const factorLatido = 0.65 + (s.factorAudioSuave * 1.85);

      ctx.globalCompositeOperation = 'screen';
      const cx = W * 0.5, cy = H * 0.5;

      // ---- OPTIMIZACIÓN: Caché de texturas de Blobs ----
      if (!s.cacheCanvas) {
        s.cacheCanvas = document.createElement('canvas');
        s.cacheCanvas.width = 256;
        s.cacheCanvas.height = 256;
        s.cacheCtx = s.cacheCanvas.getContext('2d', { alpha: true });
        
        s.cyanCanvas = document.createElement('canvas');
        s.cyanCanvas.width = 256;
        s.cyanCanvas.height = 256;
        const cyanCtx = s.cyanCanvas.getContext('2d', { alpha: true });
        const gC = cyanCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gC.addColorStop(0, 'rgba(0,240,255,0.8)');
        gC.addColorStop(1, 'rgba(0,240,255,0)');
        cyanCtx.fillStyle = gC;
        cyanCtx.fillRect(0, 0, 256, 256);
      }

      // Solo actualizar la textura si el color cambió significativamente
      if (s.lastR !== R || s.lastG !== G || s.lastB !== B) {
        s.cacheCtx.clearRect(0, 0, 256, 256);
        const grad = s.cacheCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
        grad.addColorStop(0, `rgba(${R},${G},${B},1)`);
        grad.addColorStop(0.5, `rgba(${R},${G},${B},0.5)`);
        grad.addColorStop(1, `rgba(${R},${G},${B},0)`);
        s.cacheCtx.fillStyle = grad;
        s.cacheCtx.fillRect(0, 0, 256, 256);
        s.lastR = R; s.lastG = G; s.lastB = B;
      }

      // ── Blobs nebulosos orbitales ────────────────────────────
      s.blobs.forEach((blob) => {
        // Velocidad de rotación aumentada drásticamente en el beat
        blob.angulo += blob.velocidad * dt * (1 + s.factorAudioSuave * 8);
        blob.faseAlpha += 0.00035 * dt * (1 + factorAudioBase * 2);

        const bx = cx + Math.cos(blob.angulo) * blob.radioOrbit * W;
        const by = cy + Math.sin(blob.angulo * 0.65) * blob.radioOrbit * H * 0.55;
        const radio = blob.tamano * Math.min(W, H) * factorLatido;
        
        // El destello de opacidad usa el Base (sin suavizar) para que flashee como estroboscopio
        const alpha = (0.035 + Math.abs(Math.sin(blob.faseAlpha)) * 0.04) + (factorAudioBase * 0.45);

        ctx.globalAlpha = Math.min(alpha * 1.8, 1);
        ctx.drawImage(s.cacheCanvas, bx - radio, by - radio, radio * 2, radio * 2);
      });

      // Blob cian complementario reacciona a los altos
      const bCx = cx + Math.cos(s.t * 0.00007) * W * 0.28;
      const bCy = cy + Math.sin(s.t * 0.00004) * H * 0.28;
      const bCR = Math.min(W, H) * 0.18 * (1 + s.factorAudioSuave * 1.2); 
      ctx.globalAlpha = 0.04 + (factorAudioBase * 0.25); 
      ctx.drawImage(s.cyanCanvas, bCx - bCR, bCy - bCR, bCR * 2, bCR * 2);
      
      // ── Campo de estrellas hiperespacial ─────
      const est = s.estrellas;
      ctx.fillStyle = 'rgba(255,255,255,1)';
      
      // La velocidad del viaje espacial se dispara con el pico crudo
      const velocidadViaje = 1 + (Math.pow(factorAudioBase, 2) * 50); 

      for (let i = 0; i < CANTIDAD_ESTRELLAS; i++) {
        const b = i * 6;
        est[b + 0] += est[b + 2] * dt * velocidadViaje;
        est[b + 1] += est[b + 3] * dt * velocidadViaje;
        est[b + 5] += PASO_ESTRELLA * (1 + factorAudioBase * 5);
        
        if (est[b + 1] < 0) { est[b + 1] = 1; est[b + 0] = Math.random(); }
        if (est[b + 1] > 1) { est[b + 1] = 0; est[b + 0] = Math.random(); }
        if (est[b + 0] < 0) est[b + 0] = 1;
        if (est[b + 0] > 1) est[b + 0] = 0;

        // Las estrellas brillan intensamente cuando pega el beat
        const alpha = (0.15 + Math.abs(Math.sin(est[b + 5])) * 0.55) + (factorAudioBase * 0.6);
        ctx.globalAlpha = Math.min(alpha, 1);
        
        // Las estrellas se agrandan ligeramente en los bajos pesados (con suavizado)
        const radioEstrella = est[b + 4] * (1 + s.factorAudioSuave * 1.5);
        
        ctx.beginPath();
        ctx.arc(est[b + 0] * W, est[b + 1] * H, radioEstrella, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.globalCompositeOperation = 'source-over';
      refRaf.current = requestAnimationFrame(bucle);
    };

    refRaf.current = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(refRaf.current);
  }, []);

  return (
    <canvas
      ref={refCanvas}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, willChange: 'transform', mixBlendMode: 'screen' }}
    />
  );
}
