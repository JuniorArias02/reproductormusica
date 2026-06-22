import { useEffect, useRef } from 'react';
import { useReproductor } from '../../features/Player/context/ContextoReproductor';

// ─── Constantes del Pool (sin allocaciones en render loop) ───────────────────
const N_STARS      = 150; // Float32Array [x, y, vx, vy, r, phase]       → 6 floats
const N_SPARKS     = 80;  // Float32Array [x, y, vx, vy, life, maxLife, r]→ 7 floats
const N_BLOBS_WARM = 3;   // lowMids  → blobs lentos, tono cálido
const N_BLOBS_COOL = 3;   // mids     → blobs rápidos, tono del color
const N_SHOCKWAVES = 8;   // kickBass → pool de anillos

// ─── Envelopes — parámetros (attack, decay) por banda ───────────────────────
const ENV = {
  subBass:  [0.90, 0.05], // Membranas de bombo: golpe instantáneo, lenta caída
  kickBass: [0.88, 0.04],
  lowMids:  [0.35, 0.08], // Cuerda pulsada: rápido pero fluye
  mids:     [0.30, 0.10], // Voz: onset claro, decay melódico
  presence: [0.55, 0.14], // Ataque de guitarra: muy reactivo
  air:      [0.60, 0.16], // Hi-hats: chispeante
};

// ─── Beat Detector (energy history, 43 frames ≈ 1 seg a 43fps) ──────────────
const BEAT_HISTORY = 43;

/**
 * Motor audiovisual 6-Band v4.
 *   subBass  → Orbe central (profundidad)
 *   kickBass → Shockwaves + Vignette flash
 *   lowMids  → Blobs cálidos lentos (instrumentos de cuerda baja)
 *   mids     → Blobs melódicos orbitales (voz / guitarra)
 *   presence → Partículas/chispas rápidas
 *   air      → Estrellas (brillo, velocidad, tamaño)
 */
export function FondoAmbiente() {
  const { color, estaReproduciendo, obtenerBandas } = useReproductor();
  const refCanvas   = useRef(null);
  const refRaf      = useRef(null);
  const refVignette = useRef(null);
  const S           = useRef(null); // Estado mutable del motor

  // Inicializar estado (una sola vez)
  if (!S.current) {
    // Estrellas [x, y, vx, vy, r, phase] × N_STARS
    const stars = new Float32Array(N_STARS * 6);
    for (let i = 0; i < N_STARS; i++) {
      const b = i * 6;
      stars[b]     = Math.random();
      stars[b + 1] = Math.random();
      stars[b + 2] = (Math.random() - 0.5) * 0.00005;
      stars[b + 3] = -Math.random() * 0.00008;
      stars[b + 4] = 0.3 + Math.random() * 1.0;
      stars[b + 5] = Math.random() * Math.PI * 2;
    }

    // Chispas [x, y, vx, vy, life, maxLife, r] × N_SPARKS
    const sparks = new Float32Array(N_SPARKS * 7);

    // Blobs cálidos (lowMids) — órbita lenta y ancha
    const blobsWarm = Array.from({ length: N_BLOBS_WARM }, (_, i) => ({
      a: (Math.PI * 2 / N_BLOBS_WARM) * i + Math.random() * 0.5,
      orb: 0.18 + Math.random() * 0.14,
      spd: (0.00008 + Math.random() * 0.00004) * (i % 2 ? 1 : -1),
      sz:  0.13 + Math.random() * 0.07,
      ph:  Math.random() * Math.PI * 2,
    }));

    // Blobs melódicos (mids) — órbita media
    const blobsCool = Array.from({ length: N_BLOBS_COOL }, (_, i) => ({
      a:   (Math.PI * 2 / N_BLOBS_COOL) * i,
      orb: 0.10 + Math.random() * 0.12,
      spd: (0.00015 + Math.random() * 0.00010) * (i % 2 ? 1 : -1),
      sz:  0.09 + Math.random() * 0.06,
      ph:  Math.random() * Math.PI * 2,
    }));

    // Shockwaves pool
    const shockwaves = Array.from({ length: N_SHOCKWAVES }, () => ({
      on: false, r: 0, maxR: 0, a: 0,
    }));

    // Beat detector: historial de energía del kickBass
    const beatHistory = new Float32Array(BEAT_HISTORY);

    S.current = {
      stars, sparks, blobsWarm, blobsCool, shockwaves, beatHistory,
      beatPtr: 0,
      cr: 255, cg: 74, cb: 28,
      tr: 255, tg: 74, tb: 28,
      t: 0,
      playing: false,
      eSubBass: 0, eKickBass: 0, eLowMids: 0,
      eMids: 0, ePresence: 0, eAir: 0,
      rSubBass: 0, rKickBass: 0, rLowMids: 0,
      rMids: 0, rPresence: 0, rAir: 0,
      prevKick: 0,
      vigAlpha: 0,
      onBeat: false,
      // ── EnergyDetector ──────────────────────────────────────────────
      energiaGlobal: 0,   // envelope rápido ~0.5s de toda la energía
      energiaLenta:  0,   // envelope muy lento ~3-5s (línea base de la sección)
      // ── DropDetector ────────────────────────────────────────────────
      dropScore:      0,  // acumulador: sube sostenidamente cuando hay drop
      dropActivo:     false,
      dropIntensidad: 0,  // 0-1 suavizado, controla protagonismo del orbe
      // ── PulseBoost ──────────────────────────────────────────────────
      pulse: 0,           // spike en cada beat, decae en ~160ms
    };
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

  // ── Bucle principal ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = refCanvas.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let last = performance.now();

    // Helpers reutilizables (sin allocaciones)
    const applyEnv = (raw, smooth, atk, dcy) =>
      raw > smooth ? smooth + (raw - smooth) * atk : smooth + (raw - smooth) * dcy;

    const fireShockwave = (s, maxW) => {
      const sw = s.shockwaves.find(x => !x.on);
      if (!sw) return;
      sw.on = true; sw.r = 0;
      sw.maxR = Math.min(maxW, window.innerHeight) * (0.22 + Math.random() * 0.30);
      sw.a = 0.65;
    };

    const fireSparks = (s, cx, cy, count) => {
      let spawned = 0;
      const sp = s.sparks;
      for (let i = 0; i < N_SPARKS && spawned < count; i++) {
        const b = i * 7;
        if (sp[b + 4] > 0) continue; // ocupado
        const ang = Math.random() * Math.PI * 2;
        const spd = 0.08 + Math.random() * 0.22;
        sp[b]     = cx;
        sp[b + 1] = cy;
        sp[b + 2] = Math.cos(ang) * spd;
        sp[b + 3] = Math.sin(ang) * spd;
        sp[b + 4] = 1.0; // life normalizada [1→0]
        sp[b + 5] = 900 + Math.random() * 600; // maxLife ms
        sp[b + 6] = 0.8 + Math.random() * 1.4; // radio px
        spawned++;
      }
    };

    const loop = (now) => { try {
      const dt = Math.min(now - last, 33);
      last = now;
      const s = S.current;
      const W = canvas.width, H = canvas.height;
      const cx = W * 0.5, cy = H * 0.5;

      ctx.clearRect(0, 0, W, H);

      // ── 1. Análisis de audio ──────────────────────────────────────────
      let rSub = 0, rKick = 0, rLow = 0, rMid = 0, rPre = 0, rAir = 0;
      if (s.playing && obtenerBandas) {
        const bands = obtenerBandas();
        if (bands) {
          rSub  = bands.subBass  ?? bands.bajos  ?? 0;
          rKick = bands.kickBass ?? bands.bajos  ?? 0;
          rLow  = bands.lowMids  ?? bands.medios ?? 0;
          rMid  = bands.mids     ?? bands.medios ?? 0;
          rPre  = bands.presence ?? bands.altos  ?? 0;
          rAir  = bands.air      ?? bands.altos  ?? 0;
        }
      }
      s.rSubBass = rSub; s.rKickBass = rKick; s.rLowMids = rLow;
      s.rMids = rMid; s.rPresence = rPre; s.rAir = rAir;

      // ── 2. Envelopes independientes (Fast Attack / Slow Decay) ────────
      s.eSubBass  = applyEnv(rSub,  s.eSubBass,  ...ENV.subBass);
      s.eKickBass = applyEnv(rKick, s.eKickBass, ...ENV.kickBass);
      s.eLowMids  = applyEnv(rLow,  s.eLowMids,  ...ENV.lowMids);
      s.eMids     = applyEnv(rMid,  s.eMids,     ...ENV.mids);
      s.ePresence = applyEnv(rPre,  s.ePresence, ...ENV.presence);
      s.eAir      = applyEnv(rAir,  s.eAir,      ...ENV.air);

      // ── 3. Detección de transiente (derivada del kickBass) ────────────
      const dKick = rKick - s.prevKick;
      if (dKick > 0.25 && rKick > 0.45) {
        fireShockwave(s, W);
        fireSparks(s, cx, cy, 8);
        s.vigAlpha = Math.min(0.8, rKick * 0.9);
      }
      s.prevKick = rKick;

      // ── 4. Beat Detection (energy history) ───────────────────────────
      s.beatHistory[s.beatPtr] = rKick;
      s.beatPtr = (s.beatPtr + 1) % BEAT_HISTORY;
      let avgE = 0;
      for (let i = 0; i < BEAT_HISTORY; i++) avgE += s.beatHistory[i];
      avgE /= BEAT_HISTORY;
      s.onBeat = rKick > avgE * 1.6 && rKick > 0.25;

      // ── EnergyDetector ────────────────────────────────────────────────
      // Energía global: promedio de todas las bandas
      const energiaFrame = (rSub + rKick + rLow + rMid + rPre + rAir) / 6;
      // Envelope rápido (~0.5s): sigue la energía momento a momento
      s.energiaGlobal += (energiaFrame - s.energiaGlobal) * 0.15;
      // Envelope lento (~3-5s): representa la "línea base" de la sección musical
      // dt*0.00025 ≈ 0.008 por frame a 60fps → converge en ~120 frames = ~2s
      s.energiaLenta += (s.energiaGlobal - s.energiaLenta) * (dt * 0.00025);

      // ── DropDetector ──────────────────────────────────────────────────
      // Drop = energía actual supera en >40% la línea base lenta de forma sostenida
      const esDropCandidate = s.energiaGlobal > s.energiaLenta * 1.4 && s.energiaGlobal > 0.28;
      if (esDropCandidate) {
        // Acumula lentamente: necesita ~400ms continuo para activarse
        s.dropScore = Math.min(1, s.dropScore + dt * 0.0025);
      } else {
        // Se desinfla un poco más rápido para que no se quede "pegado"
        s.dropScore = Math.max(0, s.dropScore - dt * 0.0035);
      }
      s.dropActivo = s.dropScore > 0.5;
      // Suavizado del drop para que el orbe no salte bruscamente
      s.dropIntensidad += (s.dropScore - s.dropIntensidad) * 0.04;

      // ── PulseBoost ────────────────────────────────────────────────────
      // En cada beat detectado, spike de +0.55 (se clampea a 1)
      if (s.onBeat) {
        s.pulse = Math.min(1, s.pulse + 0.55);
      }
      // Decay exponencial: ~160ms para caer de 1 a 0
      s.pulse = Math.max(0, s.pulse - dt * 0.006);

      // ── 5. Tiempo global ──────────────────────────────────────────────
      s.t += dt * (1 + s.eMids * 8 + s.eAir * 4);
      s.vigAlpha = Math.max(0, s.vigAlpha - dt * 0.007);
      s.cr += (s.tr - s.cr) * 0.018;
      s.cg += (s.tg - s.cg) * 0.018;
      s.cb += (s.tb - s.cb) * 0.018;
      const R = s.cr | 0, G = s.cg | 0, B = s.cb | 0;

      // ── Caché de texturas de blobs (actualizar solo si cambia el color) ─
      if (!s.texWarm) {
        s.texWarm = document.createElement('canvas'); s.texWarm.width = s.texWarm.height = 256;
        s.texCool = document.createElement('canvas'); s.texCool.width = s.texCool.height = 256;
        s.ctxWarm = s.texWarm.getContext('2d', { alpha: true });
        s.ctxCool = s.texCool.getContext('2d', { alpha: true });
      }
      if (s.lastR !== R || s.lastG !== G || s.lastB !== B) {
        // Blobs cálidos: tono rojizo-cálido (mezcla con naranja)
        const wR = Math.min(255, R + 40), wG = Math.max(0, G - 20), wB = Math.max(0, B - 40);
        const gW = s.ctxWarm.createRadialGradient(128, 128, 0, 128, 128, 128);
        gW.addColorStop(0, `rgba(${wR},${wG},${wB},0.9)`);
        gW.addColorStop(0.5, `rgba(${wR},${wG},${wB},0.4)`);
        gW.addColorStop(1, 'rgba(0,0,0,0)');
        s.ctxWarm.clearRect(0, 0, 256, 256);
        s.ctxWarm.fillStyle = gW;
        s.ctxWarm.fillRect(0, 0, 256, 256);

        // Blobs melódicos: color principal de la canción
        const gC = s.ctxCool.createRadialGradient(128, 128, 0, 128, 128, 128);
        gC.addColorStop(0, `rgba(${R},${G},${B},0.85)`);
        gC.addColorStop(0.5, `rgba(${R},${G},${B},0.35)`);
        gC.addColorStop(1, 'rgba(0,0,0,0)');
        s.ctxCool.clearRect(0, 0, 256, 256);
        s.ctxCool.fillStyle = gC;
        s.ctxCool.fillRect(0, 0, 256, 256);

        s.lastR = R; s.lastG = G; s.lastB = B;
      }

      ctx.globalCompositeOperation = 'screen';

      // ══ CAPA 1: Orbe Central — subBass + PulseBoost + DropDetector ══
      // Verso:    orbeBase (muy pequeño, apenas visible)
      // Pre-coro: crece con subBass + energiaGlobal
      // Drop:     se convierte en protagonista (dropIntensidad → máximo)
      // Beat:     late perceptiblemente con pulse, decay rápido
      const orbeBase  = 0.030;                         // ~3% pantalla en silencio
      const orbeSub   = s.eSubBass    * 0.09;          // sub-bass infla moderado
      const orbeEnerg = s.energiaGlobal * 0.06;        // energía general: pre-coro
      const orbePulse = s.pulse        * 0.07;         // latido en cada beat
      const orbeDrop  = s.dropIntensidad * 0.24;       // drop: protagonista

      const orbeR = Math.min(W, H) * (orbeBase + orbeSub + orbeEnerg + orbePulse + orbeDrop);

      // Brillo: también controlado por las mismas fuentes
      const orbeA = 0.010
        + s.eSubBass      * 0.035
        + s.energiaGlobal * 0.025
        + s.pulse         * 0.055  // flash visible en el beat
        + s.dropIntensidad * 0.095; // muy brillante en drop

      const oGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbeR);
      oGrad.addColorStop(0,   `rgba(${R},${G},${B},${Math.min(orbeA, 0.25)})`);
      oGrad.addColorStop(0.5, `rgba(${R},${G},${B},${Math.min(orbeA * 0.4, 0.10)})`);
      oGrad.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = oGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, orbeR, 0, Math.PI * 2);
      ctx.fill();

      // ══ CAPA 2: Blobs Cálidos — lowMids (instrumentos de cuerda grave) ══
      // Órbita lenta y amplia. Nunca cambian bruscamente. Aceleran con lowMids.
      for (const bl of s.blobsWarm) {
        bl.a  += bl.spd * dt * (1 + s.eLowMids * 5);
        bl.ph += 0.0003 * dt;
        const bx = cx + Math.cos(bl.a) * bl.orb * W;
        const by = cy + Math.sin(bl.a * 0.7) * bl.orb * H * 0.55;
        const sz = bl.sz * Math.min(W, H) * (0.50 + s.eLowMids * 0.80);
        const ba = (0.025 + Math.abs(Math.sin(bl.ph)) * 0.025) + rLow * 0.25;
        ctx.globalAlpha = Math.min(ba, 1);
        ctx.drawImage(s.texWarm, bx - sz, by - sz, sz * 2, sz * 2);
      }

      // ══ CAPA 3: Blobs Melódicos — mids (voz / guitarra) ════════════
      // Órbita media. El tamaño responde a mids. La velocidad orbital también.
      for (const bl of s.blobsCool) {
        bl.a  += bl.spd * dt * (1 + s.eMids * 8);
        bl.ph += 0.0004 * dt;
        const bx = cx + Math.cos(bl.a) * bl.orb * W;
        const by = cy + Math.sin(bl.a * 0.6) * bl.orb * H * 0.55;
        const sz = bl.sz * Math.min(W, H) * (0.45 + s.eMids * 0.90);
        const ba = (0.02 + Math.abs(Math.sin(bl.ph)) * 0.03) + rMid * 0.30;
        ctx.globalAlpha = Math.min(ba, 1);
        ctx.drawImage(s.texCool, bx - sz, by - sz, sz * 2, sz * 2);
      }

      // ══ CAPA 4: Estrellas — air (hi-hats, platillos, brillo) ═══════
      ctx.fillStyle = 'rgba(255,255,255,1)';
      const starSpd = 1 + Math.pow(rAir, 1.4) * 25;
      const st = s.stars;
      for (let i = 0; i < N_STARS; i++) {
        const b = i * 6;
        st[b]     += st[b + 2] * dt * starSpd;
        st[b + 1] += st[b + 3] * dt * starSpd;
        st[b + 5] += 0.016 * (1 + rAir * 5);
        if (st[b + 1] < 0) { st[b + 1] = 1; st[b] = Math.random(); }
        if (st[b + 1] > 1) { st[b + 1] = 0; st[b] = Math.random(); }
        if (st[b] < 0) st[b] = 1;
        if (st[b] > 1) st[b] = 0;
        const sa = (0.08 + Math.abs(Math.sin(st[b + 5])) * 0.35) + rAir * 0.55;
        ctx.globalAlpha = Math.min(sa, 1);
        const sr = st[b + 4] * (1 + s.eAir * 1.8);
        ctx.beginPath();
        ctx.arc(st[b] * W, st[b + 1] * H, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      // ══ CAPA 5: Chispas / Sparks — presence ════════════════════════
      // Nacen en el kick/transiente, viven con la presencia alta.
      // También se generan suavemente si presence es alta (rasgueo de guitarra).
      if (rPre > 0.55 && Math.random() < rPre * 0.4) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.min(W, H) * (0.05 + Math.random() * 0.10);
        fireSparks(s, cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 2);
      }

      const sp = s.sparks;
      for (let i = 0; i < N_SPARKS; i++) {
        const b = i * 7;
        if (sp[b + 4] <= 0) continue;
        sp[b + 4] -= dt / sp[b + 5]; // normalizar life
        if (sp[b + 4] <= 0) { sp[b + 4] = 0; continue; }
        sp[b]     += sp[b + 2] * dt;
        sp[b + 1] += sp[b + 3] * dt;
        // Gravedad suave hacia abajo
        sp[b + 3] += 0.00012 * dt;
        // Fade out
        const life = sp[b + 4];
        ctx.globalAlpha = Math.min(life * 1.2, 1);
        ctx.fillStyle = `rgba(${R},${G},${B},1)`;
        ctx.beginPath();
        ctx.arc(sp[b], sp[b + 1], sp[b + 6] * life, 0, Math.PI * 2);
        ctx.fill();
      }

      // ══ CAPA 6: Shockwave Rings — kickBass ════════════════════════
      const swSpd = 0.25 + s.eKickBass * 0.7;
      ctx.globalCompositeOperation = 'screen';
      for (const sw of s.shockwaves) {
        if (!sw.on) continue;
        sw.r += swSpd * dt;
        sw.a -= 0.010 * dt * (200 / sw.maxR);
        if (sw.a <= 0 || sw.r >= sw.maxR) { sw.on = false; continue; }
        const thick = Math.max(0.5, 3.5 * (1 - sw.r / sw.maxR));
        ctx.globalAlpha = sw.a;
        ctx.beginPath();
        ctx.arc(cx, cy, sw.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${R},${G},${B},1)`;
        ctx.lineWidth = thick;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // Vignette via div CSS (no en canvas para evitar conflicto con mixBlendMode)
      if (refVignette.current) {
        refVignette.current.style.opacity =
          s.vigAlpha > 0.005 ? String(Math.min(s.vigAlpha * 0.80, 0.8)) : '0';
      }

      refRaf.current = requestAnimationFrame(loop);
    } catch(e) {
      console.error('[FondoAmbiente]', e);
      refRaf.current = requestAnimationFrame(loop);
    }};

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
