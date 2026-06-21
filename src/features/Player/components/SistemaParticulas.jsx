import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';

const CANTIDAD_PARTICULAS = 130;
const DURACION_MS = 1200;

/**
 * Motor de partículas Canvas 120fps.
 * Dispara: burst de partículas + anillos de expansión concéntricos desde el click.
 */
export const SistemaParticulas = forwardRef(function SistemaParticulas(_, ref) {
  const refCanvas = useRef(null);
  const refRaf = useRef(null);
  const refActivo = useRef(false);
  const refT0 = useRef(null);

  // Float32Array para partículas: [x, y, vx, vy, vida, vidaMax, radio, op, r, g, b, ax]
  const CAMPOS = 12;
  const refDatos = useRef(new Float32Array(CANTIDAD_PARTICULAS * CAMPOS));

  // Anillos: array de objetos
  const refAnillos = useRef([]);

  const ajustarCanvas = useCallback(() => {
    const c = refCanvas.current;
    if (c) { c.width = window.innerWidth; c.height = window.innerHeight; }
  }, []);

  useEffect(() => {
    ajustarCanvas();
    window.addEventListener('resize', ajustarCanvas);
    return () => window.removeEventListener('resize', ajustarCanvas);
  }, [ajustarCanvas]);

  const inicializarParticulas = useCallback((ox, oy, r, g, b) => {
    const datos = refDatos.current;
    const destX = window.innerWidth * 0.72;

    for (let i = 0; i < CANTIDAD_PARTICULAS; i++) {
      const base = i * CAMPOS;
      const angulo = Math.random() * Math.PI * 2;
      const vel = 2.5 + Math.random() * 7;
      const vidaMax = 0.45 + Math.random() * 0.55;

      datos[base +  0] = ox;
      datos[base +  1] = oy;
      datos[base +  2] = Math.cos(angulo) * vel;
      datos[base +  3] = Math.sin(angulo) * vel;
      datos[base +  4] = 0;
      datos[base +  5] = vidaMax;
      datos[base +  6] = 1.5 + Math.random() * 4.5;
      datos[base +  7] = 1;
      datos[base +  8] = Math.min(255, r + (Math.random() - 0.5) * 70);
      datos[base +  9] = Math.min(255, g + (Math.random() - 0.5) * 70);
      datos[base + 10] = Math.min(255, b + (Math.random() - 0.5) * 70);
      datos[base + 11] = (destX - ox) * 0.00008 * (0.4 + Math.random());
    }
  }, []);

  const inicializarAnillos = useCallback((ox, oy, r, g, b) => {
    const canvas = refCanvas.current;
    if (!canvas) return;

    refAnillos.current = Array.from({ length: 4 }, (_, i) => ({
      x: ox, y: oy,
      radio: i * 15,
      maxRadio: Math.sqrt(canvas.width ** 2 + canvas.height ** 2) * 0.55,
      velBase: 9 + i * 1.5,
      alpha: 0.75 - i * 0.12,
      grosor: 3.5 - i * 0.6,
      r, g, b,
    }));
  }, []);

  const bucleAnimacion = useCallback((ts) => {
    if (!refActivo.current) return;
    if (!refT0.current) refT0.current = ts;
    const elapsed = ts - refT0.current;
    const progreso = Math.min(elapsed / DURACION_MS, 1);

    const canvas = refCanvas.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'screen';

    // ── Anillos de expansión ───────────────────────────────────
    refAnillos.current = refAnillos.current.filter((an) => {
      an.radio += an.velBase;
      const t = an.radio / an.maxRadio;
      if (t >= 1) return false;

      // Easing: rápido al inicio, desacelera
      const alphaFinal = an.alpha * Math.pow(1 - t, 1.8);
      const grosorFinal = an.grosor * (1 - t * 0.6);

      // Anillo principal
      ctx.save();
      ctx.strokeStyle = `rgba(${an.r},${an.g},${an.b},${alphaFinal.toFixed(3)})`;
      ctx.lineWidth = grosorFinal;
      ctx.shadowBlur = 20;
      ctx.shadowColor = `rgba(${an.r},${an.g},${an.b},${(alphaFinal * 0.5).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(an.x, an.y, an.radio, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return true;
    });

    // ── Partículas ─────────────────────────────────────────────
    const datos = refDatos.current;
    let hayVivas = false;

    for (let i = 0; i < CANTIDAD_PARTICULAS; i++) {
      const b = i * CAMPOS;
      const vida = datos[b + 4];
      const vidaMax = datos[b + 5];
      if (vida >= vidaMax) continue;
      hayVivas = true;

      datos[b + 4] += 0.015;
      datos[b + 2] += datos[b + 11];
      datos[b + 3] += 0.07;
      datos[b + 2] *= 0.982;
      datos[b + 3] *= 0.982;
      datos[b + 0] += datos[b + 2];
      datos[b + 1] += datos[b + 3];

      const t = vida / vidaMax;
      const op = t < 0.1 ? t / 0.1 : 1 - ((t - 0.1) / 0.9);
      const x = datos[b + 0], y = datos[b + 1];
      const radio = datos[b + 6] * (1 - t * 0.35);
      const cr = Math.min(255, Math.max(0, datos[b + 8]));
      const cg = Math.min(255, Math.max(0, datos[b + 9]));
      const cb = Math.min(255, Math.max(0, datos[b + 10]));

      ctx.save();
      ctx.globalAlpha = op * 0.92;

      // Glow exterior
      const grd = ctx.createRadialGradient(x, y, 0, x, y, radio * 3.5);
      grd.addColorStop(0,   `rgba(${cr},${cg},${cb},0.85)`);
      grd.addColorStop(0.4, `rgba(${cr},${cg},${cb},0.3)`);
      grd.addColorStop(1,   `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, radio * 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Núcleo sólido
      ctx.globalAlpha = op;
      ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
      ctx.beginPath();
      ctx.arc(x, y, radio, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.globalCompositeOperation = 'source-over';

    const hayAnillos = refAnillos.current.length > 0;

    if (progreso < 1 && (hayVivas || hayAnillos)) {
      refRaf.current = requestAnimationFrame(bucleAnimacion);
    } else {
      refActivo.current = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    disparar({ x, y, color }) {
      if (refRaf.current) cancelAnimationFrame(refRaf.current);
      refActivo.current = true;
      refT0.current = null;

      const { r = 255, g = 74, b = 28 } = color ?? {};
      inicializarParticulas(x, y, r, g, b);
      inicializarAnillos(x, y, r, g, b);
      refRaf.current = requestAnimationFrame(bucleAnimacion);
    }
  }), [inicializarParticulas, inicializarAnillos, bucleAnimacion]);

  useEffect(() => () => cancelAnimationFrame(refRaf.current), []);

  return (
    <canvas
      ref={refCanvas}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 50, willChange: 'transform' }}
    />
  );
});
