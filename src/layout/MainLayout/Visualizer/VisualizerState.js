import { N_STARS, N_SPARKS, N_BLOBS_WARM, N_BLOBS_COOL, N_BLOBS_INSTR, N_SHOCKWAVES, N_BLOB_RINGS, N_EDGE_BOLTS, BEAT_HISTORY } from './constants';
import { createBPMDetector } from './BPMDetector';

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

  // ── Blobs CÁLIDOS: sincronizados con BAJO y BATERÍA ──────────────────────
  const blobsWarm = Array.from({ length: N_BLOBS_WARM }, (_, i) => ({
    a:   (Math.PI * 2 / N_BLOBS_WARM) * i + Math.random() * 0.5,
    orb: 0.16 + Math.random() * 0.12,
    spd: (0.00007 + Math.random() * 0.00003) * (i % 2 ? 1 : -1),
    sz:  0.14 + Math.random() * 0.06,
    ph:  Math.random() * Math.PI * 2,
    currentSz: 0,
    velSz: 0,
    // Estado de resorte para respuesta orgánica al bajo/beat
    springVel: 0,
  }));

  // ── Blobs FRÍOS: sincronizados con VOZ y MELODÍA ─────────────────────────
  const blobsCool = Array.from({ length: N_BLOBS_COOL }, (_, i) => ({
    a:   (Math.PI * 2 / N_BLOBS_COOL) * i + 0.3,
    orb: 0.09 + Math.random() * 0.11,
    spd: (0.00012 + Math.random() * 0.00008) * (i % 2 ? 1 : -1),
    sz:  0.08 + Math.random() * 0.05,
    ph:  Math.random() * Math.PI * 2,
    currentSz: 0,
    velSz: 0,
    springVel: 0,
  }));

  // ── Blobs INSTRUMENTOS: sincronizados con ONSETS (guitarras, sintes) ─────
  const blobsInstr = Array.from({ length: N_BLOBS_INSTR }, (_, i) => ({
    a:   (Math.PI * 2 / N_BLOBS_INSTR) * i + 1.2,
    orb: 0.22 + Math.random() * 0.10,
    spd: (0.00006 + Math.random() * 0.00005) * (i % 2 ? 1 : -1),
    sz:  0.10 + Math.random() * 0.06,
    ph:  Math.random() * Math.PI * 2,
    currentSz: 0,
    velSz: 0,
    springVel: 0,
    // Flash acumulado por onset
    onsetFlash: 0,
  }));

  const shockwaves = Array.from({ length: N_SHOCKWAVES }, () => ({
    on: false, r: 0, maxR: 0, a: 0,
  }));

  const blobRings = Array.from({ length: N_BLOB_RINGS }, () => ({
    on: false, x: 0, y: 0, r: 0, maxR: 0, a: 0, color: 'warm',
  }));

  const edgeBolts = Array.from({ length: N_EDGE_BOLTS }, () => ({
    on: false, edge: 0, pos: 0, len: 0, r: 0, a: 0, life: 0,
  }));

  const beatHistory = new Float32Array(BEAT_HISTORY);

  return {
    stars, sparks, blobsWarm, blobsCool, blobsInstr, shockwaves, blobRings, edgeBolts, beatHistory,
    beatPtr: 0,
    cr: 255, cg: 74, cb: 28,
    tr: 255, tg: 74, tb: 28,
    t: 0,
    playing: false,

    // Bandas de audio (raw y suavizadas)
    eSubBass: 0, eKickBass: 0, eLowMids: 0, eMids: 0, ePresence: 0, eAir: 0,
    rSubBass: 0, rKickBass: 0, rLowMids: 0, rMids: 0, rPresence: 0, rAir: 0,

    prevKick:   0,
    vigAlpha:   0,
    onBeat:     false,

    // Energía global
    energiaGlobal: 0,
    energiaLenta:  0,
    prevEnergy:    0,

    // Drop detection
    dropScore:      0,
    dropActivo:     false,
    dropIntensidad: 0,

    // Pulso por beat
    pulse:    0,
    camScale: 1,

    // ── BPM Detection ──────────────────────────────────────────────────────
    bpmDet: createBPMDetector(),
    tempoChar:   0.5,
    tempoRebote: 0,
    tempoClock:  0,

    // ── Señales IA por stem (cuando mapaMusical está activo) ────────────────
    // Cada señal es una intensidad 0-1 de cada fuente de audio separada
    iaBass:      0,   // intensidad del stem de bajo/batería → BlobsWarm
    iaVocal:     0,   // intensidad del stem de voz → BlobsCool
    iaInstr:     0,   // intensidad del stem de otros → BlobsInstr
    iaOnsetFlash: 0,  // flash acumulado cuando llega un nuevo onset de la IA
    iaDropRamp:  0,   // 0→1 cuando estamos en un drop según la IA

    // ── Vocal / Melodía (modo fallback sin IA) ─────────────────────────────
    vocalIntensidad: 0,
    vocalIndex:      0,

    // ── Onset detection (modo fallback sin IA) ─────────────────────────────
    onsetEnergy: 0,
    prevBandSum: 0,
    energyPeak:  0,

    // ── Tracking IA ────────────────────────────────────────────────────────
    lastIAbeat:  null,
    lastIAonset: null,

    // ── Mouse Interactive ──────────────────────────────────────────────────
    mx: 0,
    my: 0,
    mActive: false,
    mDown: false,
    mCharge: 0,
    mouseExplosions: Array.from({ length: 5 }, () => ({ active: false, x: 0, y: 0, life: 0, maxSize: 0 })),
  };
}
