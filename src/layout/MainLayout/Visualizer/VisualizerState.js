import { N_STARS, N_SPARKS, N_BLOBS_WARM, N_BLOBS_COOL, N_SHOCKWAVES, BEAT_HISTORY } from './constants';

export function createVisualizerState() {
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

  const sparks = new Float32Array(N_SPARKS * 7);

  const blobsWarm = Array.from({ length: N_BLOBS_WARM }, (_, i) => ({
    a: (Math.PI * 2 / N_BLOBS_WARM) * i + Math.random() * 0.5,
    orb: 0.18 + Math.random() * 0.14,
    spd: (0.00008 + Math.random() * 0.00004) * (i % 2 ? 1 : -1),
    sz:  0.13 + Math.random() * 0.07,
    ph:  Math.random() * Math.PI * 2,
    currentSz: 0, velSz: 0,
  }));

  const blobsCool = Array.from({ length: N_BLOBS_COOL }, (_, i) => ({
    a:   (Math.PI * 2 / N_BLOBS_COOL) * i,
    orb: 0.10 + Math.random() * 0.12,
    spd: (0.00015 + Math.random() * 0.00010) * (i % 2 ? 1 : -1),
    sz:  0.09 + Math.random() * 0.06,
    ph:  Math.random() * Math.PI * 2,
    currentSz: 0, velSz: 0,
  }));

  const shockwaves = Array.from({ length: N_SHOCKWAVES }, () => ({
    on: false, r: 0, maxR: 0, a: 0,
  }));

  const beatHistory = new Float32Array(BEAT_HISTORY);

  return {
    stars, sparks, blobsWarm, blobsCool, shockwaves, beatHistory,
    beatPtr: 0,
    cr: 255, cg: 74, cb: 28,
    tr: 255, tg: 74, tb: 28,
    t: 0,
    playing: false,
    eSubBass: 0, eKickBass: 0, eLowMids: 0, eMids: 0, ePresence: 0, eAir: 0,
    rSubBass: 0, rKickBass: 0, rLowMids: 0, rMids: 0, rPresence: 0, rAir: 0,
    prevKick: 0,
    vigAlpha: 0,
    onBeat: false,
    energiaGlobal: 0, energiaLenta:  0,
    dropScore: 0, dropActivo: false, dropIntensidad: 0,
    pulse: 0,
    camScale: 1, // Escala de cámara para efecto Zoom Bop
  };
}
