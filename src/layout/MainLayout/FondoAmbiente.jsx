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
  const { color, estaReproduciendo } = useReproductor();
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
      latidoTimer: 0,
      latidoPulso: 0,
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
      s.t += dt;

      // Interpolar color suavemente
      s.cr += (s.tr - s.cr) * 0.02;
      s.cg += (s.tg - s.cg) * 0.02;
      s.cb += (s.tb - s.cb) * 0.02;
      const R = s.cr | 0, G = s.cg | 0, B = s.cb | 0;

      // Latido suave cuando está reproduciendo
      if (s.reproduciendo) {
        s.latidoTimer += dt;
        if (s.latidoTimer > 2400) { s.latidoTimer = 0; s.latidoPulso = 1; }
      }
      if (s.latidoPulso > 0) s.latidoPulso = Math.max(0, s.latidoPulso - dt * 0.004);
      const factorLatido = 1 + Math.sin(s.latidoPulso * Math.PI) * 0.12;

      ctx.globalCompositeOperation = 'screen';
      const cx = W * 0.5, cy = H * 0.5;

      // ── Blobs nebulosos orbitales ────────────────────────────
      s.blobs.forEach((blob) => {
        blob.angulo += blob.velocidad * dt;
        blob.faseAlpha += 0.00035 * dt;

        const bx = cx + Math.cos(blob.angulo) * blob.radioOrbit * W;
        const by = cy + Math.sin(blob.angulo * 0.65) * blob.radioOrbit * H * 0.55;
        const radio = blob.tamano * Math.min(W, H) * factorLatido;
        const alpha = 0.035 + Math.abs(Math.sin(blob.faseAlpha)) * 0.04;

        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, radio);
        grad.addColorStop(0, `rgba(${R},${G},${B},${(alpha * 1.8).toFixed(3)})`);
        grad.addColorStop(0.5, `rgba(${R},${G},${B},${(alpha * 0.5).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${R},${G},${B},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, radio, 0, Math.PI * 2);
        ctx.fill();
      });

      // Blob cian complementario (se mueve en sentido contrario)
      const bCx = cx + Math.cos(s.t * 0.00007) * W * 0.28;
      const bCy = cy + Math.sin(s.t * 0.00004) * H * 0.28;
      const bCR = Math.min(W, H) * 0.18;
      const gC = ctx.createRadialGradient(bCx, bCy, 0, bCx, bCy, bCR);
      gC.addColorStop(0, 'rgba(0,240,255,0.04)');
      gC.addColorStop(1, 'rgba(0,240,255,0)');
      ctx.fillStyle = gC;
      ctx.beginPath();
      ctx.arc(bCx, bCy, bCR, 0, Math.PI * 2);
      ctx.fill();

      // ── Campo de estrellas (arcos simples sin gradientes) ─────
      const est = s.estrellas;
      ctx.fillStyle = 'rgba(220,220,240,1)';
      for (let i = 0; i < CANTIDAD_ESTRELLAS; i++) {
        const b = i * 6;
        est[b + 0] += est[b + 2] * dt;
        est[b + 1] += est[b + 3] * dt;
        est[b + 5] += PASO_ESTRELLA;
        if (est[b + 1] < 0) { est[b + 1] = 1; est[b + 0] = Math.random(); }
        if (est[b + 0] < 0) est[b + 0] = 1;
        if (est[b + 0] > 1) est[b + 0] = 0;

        const alpha = 0.15 + Math.abs(Math.sin(est[b + 5])) * 0.55;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(est[b + 0] * W, est[b + 1] * H, est[b + 4], 0, Math.PI * 2);
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
