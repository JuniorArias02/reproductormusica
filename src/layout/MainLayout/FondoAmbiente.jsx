import { useEffect, useRef } from 'react';
import { useReproductor } from '../../features/Player/context/ContextoReproductor';

const CANTIDAD_ESTRELLAS = 120;
const CANTIDAD_BLOBS = 4;
const PASO_ESTRELLA = 0.018;
const MAX_SHOCKWAVES = 8; // Pool máximo de ondas simultáneas

/**
 * Canvas full-screen de fondo — Motor de animación Multi-Banda v3.
 *   BAJOS      → Tamaño + flash de burbujas + SHOCKWAVE RINGS (bombo/kick)
 *   MEDIOS     → Velocidad orbital + blob cian (voz/guitarras/piano)
 *   ALTOS      → Brillo, velocidad y tamaño de estrellas (hi-hats/platillos)
 *   ENERGÍA    → Orbe central respiratorio + Vignette pulsante
 *   TRANSIENTE → Detección de golpe seco → dispara shockwave y vignette
 */
export function FondoAmbiente() {
  const { color, estaReproduciendo, obtenerBandas } = useReproductor();
  const refCanvas = useRef(null);
  const refRaf = useRef(null);
  const refVignette = useRef(null);
  const sis = useRef(null);

  if (!sis.current) {
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

    const blobs = Array.from({ length: CANTIDAD_BLOBS }, (_, i) => ({
      angulo: (Math.PI * 2 / CANTIDAD_BLOBS) * i,
      radioOrbit: 0.14 + Math.random() * 0.20,
      velocidad: (0.00010 + Math.random() * 0.00006) * (i % 2 === 0 ? 1 : -1),
      tamano: 0.12 + Math.random() * 0.08,
      faseAlpha: Math.random() * Math.PI * 2,
    }));

    // Pool de shockwaves — evita allocaciones en el bucle caliente
    const shockwaves = Array.from({ length: MAX_SHOCKWAVES }, () => ({
      activo: false, radio: 0, maxRadio: 0, alpha: 0,
      r: 255, g: 74, b: 28,
    }));

    sis.current = {
      estrellas, blobs, shockwaves,
      cr: 255, cg: 74, cb: 28,
      tr: 255, tg: 74, tb: 28,
      t: 0,
      reproduciendo: false,
      // Envelopes independientes por banda
      sBajos: 0, sMedios: 0, sAltos: 0,
      // Para detección de transiente: valor previo de rawBajos
      prevBajos: 0,
      // Vignette pulsante
      vignetteAlpha: 0,
      // Orbe central
      orbeAlpha: 0,
    };
  }

  useEffect(() => {
    const c = refCanvas.current;
    if (!c) return;
    const ajustar = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    ajustar();
    window.addEventListener('resize', ajustar);
    return () => window.removeEventListener('resize', ajustar);
  }, []);

  useEffect(() => {
    if (!color) return;
    const s = sis.current;
    s.tr = color.r; s.tg = color.g; s.tb = color.b;
  }, [color]);

  useEffect(() => {
    if (sis.current) sis.current.reproduciendo = estaReproduciendo;
  }, [estaReproduciendo]);

  useEffect(() => {
    const canvas = refCanvas.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let ultimo = performance.now();

    const dispararShockwave = (s, cx, cy, R, G, B, W) => {
      const libre = s.shockwaves.find(sw => !sw.activo);
      if (!libre) return;
      libre.activo = true;
      libre.radio = 0;
      libre.maxRadio = Math.min(W, window.innerHeight) * (0.25 + Math.random() * 0.35);
      libre.alpha = 0.7;
      libre.r = R; libre.g = G; libre.b = B;
    };

    const bucle = (ahora) => { try {
      const dt = Math.min(ahora - ultimo, 33);
      ultimo = ahora;
      const s = sis.current;
      const W = canvas.width, H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // ── Análisis multi-banda ─────────────────────────────────────────
      let rawBajos = 0, rawMedios = 0, rawAltos = 0;
      if (s.reproduciendo && obtenerBandas) {
        const bands = obtenerBandas();
        if (bands) {
          rawBajos  = bands.bajos;
          rawMedios = bands.medios;
          rawAltos  = bands.altos;
        }
      }

      // Fast Attack / Slow Decay independientes
      s.sBajos  += rawBajos  > s.sBajos  ? (rawBajos  - s.sBajos)  * 0.80 : (rawBajos  - s.sBajos)  * 0.06;
      s.sMedios += rawMedios > s.sMedios ? (rawMedios - s.sMedios) * 0.40 : (rawMedios - s.sMedios) * 0.10;
      s.sAltos  += rawAltos  > s.sAltos  ? (rawAltos  - s.sAltos)  * 0.65 : (rawAltos  - s.sAltos)  * 0.12;

      // ── Detección de Transiente (golpe de kick/bombo) ─────────────────
      // Un transiente es cuando rawBajos sube repentinamente > 0.28 en un frame
      const derivadaBajos = rawBajos - s.prevBajos;
      if (derivadaBajos > 0.28 && rawBajos > 0.5) {
        // ¡Golpe detectado! Disparar shockwave y vignette
        dispararShockwave(s, W * 0.5, H * 0.5, s.cr | 0, s.cg | 0, s.cb | 0, W);
        s.vignetteAlpha = Math.min(1, rawBajos * 0.9);
      }
      s.prevBajos = rawBajos;

      // Decay del vignette
      s.vignetteAlpha = Math.max(0, s.vignetteAlpha - dt * 0.008);

      // El tiempo global se acelera con medios y altos
      s.t += dt * (1 + s.sMedios * 12 + s.sAltos * 5);

      s.cr += (s.tr - s.cr) * 0.02;
      s.cg += (s.tg - s.cg) * 0.02;
      s.cb += (s.tb - s.cb) * 0.02;
      const R = s.cr | 0, G = s.cg | 0, B = s.cb | 0;

      ctx.globalCompositeOperation = 'screen';
      const cx = W * 0.5, cy = H * 0.5;

      // ── Caché de texturas ─────────────────────────────────────────────
      if (!s.cacheCanvas) {
        s.cacheCanvas = document.createElement('canvas');
        s.cacheCanvas.width = 256; s.cacheCanvas.height = 256;
        s.cacheCtx = s.cacheCanvas.getContext('2d', { alpha: true });

        s.cyanCanvas = document.createElement('canvas');
        s.cyanCanvas.width = 256; s.cyanCanvas.height = 256;
        const cyanCtx = s.cyanCanvas.getContext('2d', { alpha: true });
        const gC = cyanCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gC.addColorStop(0, 'rgba(0,240,255,0.8)');
        gC.addColorStop(1, 'rgba(0,240,255,0)');
        cyanCtx.fillStyle = gC;
        cyanCtx.fillRect(0, 0, 256, 256);
      }

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

      // ── ORBE CENTRAL RESPIRATORIO (energía general) ───────────────────
      // Siempre presente, más brillante con medios y altos, casi invisible en silencio
      const energiaTotal = (s.sBajos * 0.3 + s.sMedios * 0.5 + s.sAltos * 0.2);
      const orbeR = Math.min(W, H) * (0.06 + energiaTotal * 0.18);
      const orbeAlpha = 0.025 + energiaTotal * 0.08;
      
      const orbeGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbeR);
      orbeGrad.addColorStop(0, `rgba(${R},${G},${B},${orbeAlpha})`);
      orbeGrad.addColorStop(0.5, `rgba(${R},${G},${B},${orbeAlpha * 0.4})`);
      orbeGrad.addColorStop(1, `rgba(${R},${G},${B},0)`);
      ctx.fillStyle = orbeGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, orbeR, 0, Math.PI * 2);
      ctx.fill();

      // ── BLOBS → Controlados SOLO por BAJOS ───────────────────────────
      s.blobs.forEach((blob) => {
        blob.angulo += blob.velocidad * dt * (1 + s.sMedios * 10);
        blob.faseAlpha += 0.00035 * dt * (1 + s.sAltos * 3);

        const bx = cx + Math.cos(blob.angulo) * blob.radioOrbit * W;
        const by = cy + Math.sin(blob.angulo * 0.65) * blob.radioOrbit * H * 0.55;

        const factorTamano = 0.55 + (s.sBajos * 1.9);
        const radio = blob.tamano * Math.min(W, H) * factorTamano;

        const alphaBase = 0.03 + Math.abs(Math.sin(blob.faseAlpha)) * 0.04;
        const alphaFlash = rawBajos * 0.55;
        ctx.globalAlpha = Math.min((alphaBase + alphaFlash) * 2.2, 1);
        ctx.drawImage(s.cacheCanvas, bx - radio, by - radio, radio * 2, radio * 2);
      });

      // ── BLOB CIAN → Medios (voz/melodías) ────────────────────────────
      const bCx = cx + Math.cos(s.t * 0.00007) * W * 0.28;
      const bCy = cy + Math.sin(s.t * 0.00004) * H * 0.28;
      const bCR = Math.min(W, H) * 0.14 * (1 + s.sMedios * 1.5);
      ctx.globalAlpha = 0.03 + (s.sMedios * 0.20);
      ctx.drawImage(s.cyanCanvas, bCx - bCR, bCy - bCR, bCR * 2, bCR * 2);

      // ── ESTRELLAS → Altos (hi-hats, platillos, sibilancia) ──────────
      ctx.fillStyle = 'rgba(255,255,255,1)';
      const velocidadViaje = 1 + (Math.pow(rawAltos, 1.5) * 30);
      const est = s.estrellas;

      for (let i = 0; i < CANTIDAD_ESTRELLAS; i++) {
        const b = i * 6;
        est[b + 0] += est[b + 2] * dt * velocidadViaje;
        est[b + 1] += est[b + 3] * dt * velocidadViaje;
        est[b + 5] += PASO_ESTRELLA * (1 + rawAltos * 6);

        if (est[b + 1] < 0) { est[b + 1] = 1; est[b + 0] = Math.random(); }
        if (est[b + 1] > 1) { est[b + 1] = 0; est[b + 0] = Math.random(); }
        if (est[b + 0] < 0) est[b + 0] = 1;
        if (est[b + 0] > 1) est[b + 0] = 0;

        const alpha = (0.10 + Math.abs(Math.sin(est[b + 5])) * 0.4) + (rawAltos * 0.55);
        ctx.globalAlpha = Math.min(alpha, 1);
        const radioEstrella = est[b + 4] * (1 + s.sAltos * 2.0);
        ctx.beginPath();
        ctx.arc(est[b + 0] * W, est[b + 1] * H, radioEstrella, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ── SHOCKWAVE RINGS (ondas de choque) ────────────────────────────
      // Se expanden desde el centro y se desvanecen. Velocidad proporcional al kick.
      const velocidadOnda = 0.3 + s.sBajos * 0.8; // px por ms
      ctx.globalCompositeOperation = 'screen';
      for (const sw of s.shockwaves) {
        if (!sw.activo) continue;

        sw.radio += velocidadOnda * dt;
        sw.alpha -= 0.012 * dt * (1 / (sw.maxRadio / 200)); // decay proporcional al tamaño

        if (sw.alpha <= 0 || sw.radio >= sw.maxRadio) {
          sw.activo = false;
          continue;
        }

        // Grosor del anillo decrece conforme se expande
        const grosor = Math.max(1, 4 * (1 - sw.radio / sw.maxRadio));
        ctx.beginPath();
        ctx.arc(cx, cy, sw.radio, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${sw.r},${sw.g},${sw.b},${sw.alpha})`;
        ctx.lineWidth = grosor;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // Actualizar la vignette via el div CSS (no en el canvas para no interferir con mixBlendMode)
      if (refVignette.current) {
        refVignette.current.style.opacity = s.vignetteAlpha > 0.005 ? String(s.vignetteAlpha * 0.75) : '0';
      }
      refRaf.current = requestAnimationFrame(bucle);
    } catch(e) { console.error('FondoAmbiente error:', e); refRaf.current = requestAnimationFrame(bucle); } };

    refRaf.current = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(refRaf.current);
  }, []);

  return (
    <>
      <canvas
        ref={refCanvas}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 0, willChange: 'transform', mixBlendMode: 'screen' }}
      />
      {/* Vignette pulsante en CSS para no interferir con mixBlendMode del canvas */}
      <div
        ref={refVignette}
        className="fixed inset-0 pointer-events-none transition-opacity duration-75"
        style={{
          zIndex: 1,
          opacity: 0,
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
        }}
      />
    </>
  );
}
