import { ENV, BEAT_HISTORY, N_SPARKS } from './constants';

const applyEnv = (raw, smooth, atk, dcy) =>
  raw > smooth ? smooth + (raw - smooth) * atk : smooth + (raw - smooth) * dcy;

export function fireShockwave(s, maxW) {
  const sw = s.shockwaves.find(x => !x.on);
  if (!sw) return;
  sw.on = true; sw.r = 0;
  sw.maxR = Math.min(maxW, window.innerHeight) * (0.22 + Math.random() * 0.30);
  sw.a = 0.65;
}

export function fireSparks(s, cx, cy, count) {
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
    sp[b + 4] = 1.0; 
    sp[b + 5] = 900 + Math.random() * 600; 
    sp[b + 6] = 0.8 + Math.random() * 1.4; 
    spawned++;
  }
}

/** Dispara un mini-anillo de energía en la posición del blob */
export function fireBlobRing(s, x, y, intensity, colorType) {
  const ring = s.blobRings.find(r => !r.on);
  if (!ring) return;
  ring.on    = true;
  ring.x     = x;
  ring.y     = y;
  ring.r     = 0;
  ring.maxR  = 40 + intensity * 180;
  ring.a     = 0.5 + intensity * 0.5;
  ring.color = colorType; // 'warm' | 'cool'
}

/** Dispara un burst de luz elegante desde el borde de la pantalla */
export function fireEdgeBolt(s, W, H, intensity) {
  const bolt = s.edgeBolts.find(b => !b.on);
  if (!bolt) return;
  bolt.on   = true;
  bolt.edge = Math.floor(Math.random() * 4);
  bolt.pos  = Math.random();
  // len = radio máximo de expansión del burst (más grande en drops/kicks intensos)
  bolt.len  = (0.12 + intensity * 0.30) * Math.min(W, H);
  bolt.a    = 0.55 + intensity * 0.45; // alpha máximo del burst
  bolt.life = 1.0;
  bolt.r    = 0; // radio actual (se calcula en el render)
}

export function updatePhysics(s, dt, obtenerBandas, W, H, cx, cy) {
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

  s.eSubBass  = applyEnv(rSub,  s.eSubBass,  ...ENV.subBass);
  s.eKickBass = applyEnv(rKick, s.eKickBass, ...ENV.kickBass);
  s.eLowMids  = applyEnv(rLow,  s.eLowMids,  ...ENV.lowMids);
  s.eMids     = applyEnv(rMid,  s.eMids,     ...ENV.mids);
  s.ePresence = applyEnv(rPre,  s.ePresence, ...ENV.presence);
  s.eAir      = applyEnv(rAir,  s.eAir,      ...ENV.air);

  const dKick = rKick - s.prevKick;
  if (dKick > 0.25 && rKick > 0.45) {
    fireShockwave(s, W);
    fireSparks(s, cx, cy, 8);
    s.vigAlpha = Math.min(0.8, rKick * 0.9);
    // Dispara rayos desde los bordes en cada kick fuerte
    const numBolts = 1 + Math.floor(rKick * 3);
    for (let i = 0; i < numBolts; i++) fireEdgeBolt(s, W, H, rKick);
  }
  s.prevKick = rKick;

  s.beatHistory[s.beatPtr] = rKick;
  s.beatPtr = (s.beatPtr + 1) % BEAT_HISTORY;
  let avgE = 0;
  for (let i = 0; i < BEAT_HISTORY; i++) avgE += s.beatHistory[i];
  avgE /= BEAT_HISTORY;
  s.onBeat = rKick > avgE * 1.6 && rKick > 0.25;

  const energiaFrame = (rSub + rKick + rLow + rMid + rPre + rAir) / 6;
  s.energiaGlobal += (energiaFrame - s.energiaGlobal) * 0.15;
  s.energiaLenta += (s.energiaGlobal - s.energiaLenta) * (dt * 0.00025);

  const esDropCandidate = s.energiaGlobal > s.energiaLenta * 1.4 && s.energiaGlobal > 0.28;
  if (esDropCandidate) {
    s.dropScore = Math.min(1, s.dropScore + dt * 0.0025);
  } else {
    s.dropScore = Math.max(0, s.dropScore - dt * 0.0035);
  }
  s.dropActivo = s.dropScore > 0.5;
  s.dropIntensidad += (s.dropScore - s.dropIntensidad) * 0.04;

  if (s.onBeat) {
    s.pulse = Math.min(1, s.pulse + 0.55);
  }
  s.pulse = Math.max(0, s.pulse - dt * 0.006);

  // Cámara Zoom Bop: el lienzo "bombea" hacia el usuario
  const targetScale = 1.0 + (s.pulse * 0.05) + (s.dropIntensidad * 0.12) + (s.eSubBass * 0.03);
  s.camScale += (targetScale - s.camScale) * 0.18;

  s.t += dt * (1 + s.eMids * 8 + s.eAir * 4);
  s.vigAlpha = Math.max(0, s.vigAlpha - dt * 0.007);
  s.cr += (s.tr - s.cr) * 0.018;
  s.cg += (s.tg - s.cg) * 0.018;
  s.cb += (s.tb - s.cb) * 0.018;

  // ── Drop: rayos continuos en los bordes mientras el drop está activo ──
  if (s.dropActivo && Math.random() < s.dropIntensidad * 0.25) {
    fireEdgeBolt(s, W, H, s.dropIntensidad);
  }

  // ── Sub-bass muy fuerte: dispara blob rings en posiciones de blobs ──
  const dEnergy = s.energiaGlobal - s.prevEnergy;
  s.prevEnergy = s.energiaGlobal;
  if (dEnergy > 0.05 && s.energiaGlobal > 0.3) {
    // Ring en un blob calido aleatorio
    const wb = s.blobsWarm[Math.floor(Math.random() * s.blobsWarm.length)];
    const wbx = cx + Math.cos(wb.a) * wb.orb * W;
    const wby = cy + Math.sin(wb.a * 0.7) * wb.orb * H * 0.55;
    fireBlobRing(s, wbx, wby, s.energiaGlobal, 'warm');

    // Ring en un blob frío aleatorio
    const cb2 = s.blobsCool[Math.floor(Math.random() * s.blobsCool.length)];
    const cbx = cx + Math.cos(cb2.a) * cb2.orb * W;
    const cby = cy + Math.sin(cb2.a * 0.6) * cb2.orb * H * 0.55;
    fireBlobRing(s, cbx, cby, s.energiaGlobal, 'cool');
  }
}

export function updateTextureCache(s, R, G, B) {
  if (!s.texWarm) {
    s.texWarm = document.createElement('canvas'); s.texWarm.width = s.texWarm.height = 256;
    s.texCool = document.createElement('canvas'); s.texCool.width = s.texCool.height = 256;
    s.ctxWarm = s.texWarm.getContext('2d', { alpha: true });
    s.ctxCool = s.texCool.getContext('2d', { alpha: true });
  }
  if (s.lastR !== R || s.lastG !== G || s.lastB !== B) {
    const wR = Math.min(255, R + 40), wG = Math.max(0, G - 20), wB = Math.max(0, B - 40);
    const gW = s.ctxWarm.createRadialGradient(128, 128, 0, 128, 128, 128);
    gW.addColorStop(0, `rgba(${wR},${wG},${wB},0.9)`);
    gW.addColorStop(0.5, `rgba(${wR},${wG},${wB},0.4)`);
    gW.addColorStop(1, 'rgba(0,0,0,0)');
    s.ctxWarm.clearRect(0, 0, 256, 256);
    s.ctxWarm.fillStyle = gW;
    s.ctxWarm.fillRect(0, 0, 256, 256);

    const gC = s.ctxCool.createRadialGradient(128, 128, 0, 128, 128, 128);
    gC.addColorStop(0, `rgba(${R},${G},${B},0.85)`);
    gC.addColorStop(0.5, `rgba(${R},${G},${B},0.35)`);
    gC.addColorStop(1, 'rgba(0,0,0,0)');
    s.ctxCool.clearRect(0, 0, 256, 256);
    s.ctxCool.fillStyle = gC;
    s.ctxCool.fillRect(0, 0, 256, 256);

    s.lastR = R; s.lastG = G; s.lastB = B;
  }
}
