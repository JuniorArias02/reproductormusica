import { ENV, BEAT_HISTORY, N_SPARKS } from './constants';
import { updateBPMDetector } from './BPMDetector';

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
    if (sp[b + 4] > 0) continue;
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

export function fireBlobRing(s, x, y, intensity, colorType) {
  const ring = s.blobRings.find(r => !r.on);
  if (!ring) return;
  ring.on    = true;
  ring.x     = x;
  ring.y     = y;
  ring.r     = 0;
  ring.maxR  = 40 + intensity * 180;
  ring.a     = 0.5 + intensity * 0.5;
  ring.color = colorType;
}

export function fireEdgeBolt(s, W, H, intensity) {
  const bolt = s.edgeBolts.find(b => !b.on);
  if (!bolt) return;
  bolt.on   = true;
  bolt.edge = Math.floor(Math.random() * 4);
  bolt.pos  = Math.random();
  bolt.len  = (0.12 + intensity * 0.28) * Math.min(W, H);
  bolt.a    = 0.50 + intensity * 0.45;
  bolt.life = 1.0;
  bolt.r    = 0;
}

export function updatePhysics(s, dt, obtenerBandas, W, H, cx, cy, iaSync = null) {
  // ── 0. Mouse tracking globals ──────────────────────────────────────────
  if (typeof window !== 'undefined' && window.__VISUALIZER_MOUSE__) {
    const m = window.__VISUALIZER_MOUSE__;
    s.mx = m.x;
    s.my = m.y;
    s.mActive = m.active;
    s.mDown = m.down;

    if (s.mDown) {
      s.mCharge = Math.min(1.0, s.mCharge + dt * 0.0015); // max charge in ~660ms
    }

    if (m.release) {
      m.release = false; // consume
      
      const exp = s.mouseExplosions.find(e => !e.active);
      if (exp) {
        exp.active = true;
        exp.x = s.mx;
        exp.y = s.my;
        exp.life = 1.0;
        // The longer they hold, the bigger the explosion
        const chargePower = 0.2 + s.mCharge * 0.8; 
        exp.maxSize = (250 + Math.random() * 150) * (1 + chargePower * 1.5);
      }
      
      const sparkCount = Math.floor(10 + s.mCharge * 30);
      fireShockwave(s, W);
      fireSparks(s, s.mx, s.my, sparkCount);

      s.mCharge = 0; // reset charge after firing
    }
  }

  // ── 1. Leer bandas de audio ──────────────────────────────────────────────
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

  // ── 2. Envelopes por banda ───────────────────────────────────────────────
  s.eSubBass  = applyEnv(rSub,  s.eSubBass,  ...ENV.subBass);
  s.eKickBass = applyEnv(rKick, s.eKickBass, ...ENV.kickBass);
  s.eLowMids  = applyEnv(rLow,  s.eLowMids,  ...ENV.lowMids);
  s.eMids     = applyEnv(rMid,  s.eMids,     ...ENV.mids);
  s.ePresence = applyEnv(rPre,  s.ePresence, ...ENV.presence);
  s.eAir      = applyEnv(rAir,  s.eAir,      ...ENV.air);

  // ── 3. Detección de transiente de kick (drum hit) ────────────────────────
  const dKick = rKick - s.prevKick;
  if (dKick > 0.22 && rKick > 0.40) {
    fireShockwave(s, W);
    fireSparks(s, cx, cy, 6);
    s.vigAlpha = Math.min(0.75, rKick * 0.85);
    const numBolts = 1 + Math.floor(rKick * 2);
    for (let i = 0; i < numBolts; i++) fireEdgeBolt(s, W, H, rKick);
  }
  s.prevKick = rKick;

  // ── 4. Detección de onset genérico (cualquier instrumento nuevo) ─────────
  const bandSum = rSub + rKick + rLow + rMid + rPre + rAir;
  if (iaSync) {
    if (iaSync.currentOnset !== s.lastIAonset) {
      s.onsetEnergy = 1.0; // Golpe fuerte garantizado por la IA
      s.lastIAonset = iaSync.currentOnset;
    } else {
      s.onsetEnergy = Math.max(0, s.onsetEnergy - dt * 0.005);
    }
  } else {
    const dBands  = bandSum - s.prevBandSum;
    s.onsetEnergy = Math.max(0, dBands); // solo subidas
  }
  s.prevBandSum = bandSum;

  // ── 5. Beat history & onBeat ─────────────────────────────────────────────
  if (iaSync) {
    s.onBeat = (iaSync.currentBeat !== s.lastIAbeat);
    if (s.onBeat) s.lastIAbeat = iaSync.currentBeat;
  } else {
    s.beatHistory[s.beatPtr] = rKick;
    s.beatPtr = (s.beatPtr + 1) % BEAT_HISTORY;
    let avgE = 0;
    for (let i = 0; i < BEAT_HISTORY; i++) avgE += s.beatHistory[i];
    avgE /= BEAT_HISTORY;
    s.onBeat = rKick > avgE * 1.55 && rKick > 0.22;
  }

  // ── 6. BPM Detection ─────────────────────────────────────────────────────
  updateBPMDetector(s.bpmDet, s.onBeat, performance.now(), dt);
  const { tempoChar, tempoClock, beatPeriod } = s.bpmDet;

  // Pulso sincronizado con el tempo: 1 justo en el beat, 0 a la mitad
  // Usa la mitad del ciclo para dar un "bounce" hacia atrás
  const beatPhase   = tempoClock * Math.PI;               // 0 → π
  const tempoRebote = Math.max(0, Math.cos(beatPhase));   // 1→0 (primera mitad)

  // ── 7. Energía global ────────────────────────────────────────────────────
  const energiaFrame = bandSum / 6;
  s.energiaGlobal += (energiaFrame - s.energiaGlobal) * 0.15;

  // energiaLenta: referencia del nivel base de ESTA canción (muy lenta)
  // Se normaliza con el tiempo para que la canción "calibre" su propio nivel
  s.energiaLenta += (s.energiaGlobal - s.energiaLenta) * (dt * 0.00012);

  // ── 8. Detección de drop / parte intensa ─────────────────────────────────
  const umbralBase = 1.30 + tempoChar * 0.30;
  
  if (iaSync) {
    // La IA dictamina con precisión quirúrgica el estado del drop
    s.dropActivo = iaSync.isDropActive;
    s.dropIntensidad += ((s.dropActivo ? 1.0 : 0.0) - s.dropIntensidad) * 0.1;
  } else {
    const esDropCandidate = s.energiaGlobal > s.energiaLenta * umbralBase && s.energiaGlobal > 0.26;
    if (esDropCandidate) {
      s.dropScore = Math.min(1, s.dropScore + dt * 0.0022);
    } else {
      s.dropScore = Math.max(0, s.dropScore - dt * 0.00070);
    }
    s.dropActivo     = s.dropScore > 0.42;
    s.dropIntensidad += (s.dropScore - s.dropIntensidad) * 0.04;
  }

  // ── 9. Pulse (bloqueado al beat) ─────────────────────────────────────────
  if (s.onBeat) {
    s.pulse = Math.min(1, s.pulse + 0.65);
  }
  // Decay más rápido en canciones rápidas para no acumular entre beats
  const pulseDecay = dt * (0.0035 + tempoChar * 0.006);
  s.pulse = Math.max(0, s.pulse - pulseDecay);

  // ── 10. Señales IA por stem ─────────────────────────────────────────────
  if (iaSync) {
    // Bajo/Batería: el beat de la IA es un golpe de la batería
    if (iaSync.currentBeat !== s.lastIAbeat) {
      s.iaBass = Math.min(1, s.iaBass + 0.9); // spike en cada beat
    }
    s.iaBass = Math.max(0, s.iaBass - dt * 0.004); // decaimiento orgánico

    // Voz/Melodía: directo del stem de voz analizado por Librosa
    const rawVocal = Math.min(1, (iaSync.vocalIntensity ?? 0) * 4.0);
    s.iaVocal += (rawVocal - s.iaVocal) * 0.12;

    // Instrumentos (otros): onset = nuevo instrumento en el stem 'other'
    if (iaSync.currentOnset !== s.lastIAonset) {
      s.iaInstr     = Math.min(1, s.iaInstr + 1.0);
      s.iaOnsetFlash = 1.0;
    }
    s.iaInstr      = Math.max(0, s.iaInstr - dt * 0.005);
    s.iaOnsetFlash = Math.max(0, s.iaOnsetFlash - dt * 0.012);

    // Ramp del Drop: sube suave al activarse, baja suave al desactivarse
    const dropTarget = s.dropActivo ? 1.0 : 0.0;
    s.iaDropRamp += (dropTarget - s.iaDropRamp) * 0.06;

    // Compatibilidad: mantener vocalIndex sincronizado
    s.vocalIndex = s.iaVocal;

  } else {
    // ── Modo fallback: usar bandas del navegador ──
    const bassRaw  = rSub * 0.6 + rKick * 0.4;
    const vocalRaw = rMid * 0.50 + rPre * 0.40 + rLow * 0.10;
    s.vocalIntensidad += (vocalRaw - s.vocalIntensidad) * 0.10;
    const total = s.vocalIntensidad + bassRaw + 0.001;
    s.vocalIndex = Math.max(0, Math.min(1, s.vocalIntensidad / total));

    // En modo fallback, las señales IA reflejan las bandas del navegador
    s.iaBass   = (rSub * 0.6 + rKick * 0.4);
    s.iaVocal  = s.vocalIndex;
    s.iaInstr  = s.onsetEnergy * 2.0;
    s.iaDropRamp += ((s.dropActivo ? 1.0 : 0.0) - s.iaDropRamp) * 0.06;
  }

  // ── 11. Cámara zoom-bop ─────────────────────────────────────────────────
  // Zoom más pronunciado en canciones lentas, más sutil en rápidas
  const zoomMax   = 0.06 - tempoChar * 0.025; // 0.06 lento → 0.035 rápido
  const targetScale = 1.0
    + s.pulse           * zoomMax
    + s.dropIntensidad  * 0.08
    + s.eSubBass        * 0.02;
  s.camScale += (targetScale - s.camScale) * 0.18;

  // ── 12. Tiempo interno (velocidad de animaciones) ────────────────────────
  // Tempo rápido → animaciones más rápidas
  s.t += dt * (1 + s.eMids * 6 + s.eAir * 3 + tempoChar * 1.5);

  // ── 13. Vignette ─────────────────────────────────────────────────────────
  if (s.dropActivo) {
    s.vigAlpha = Math.max(s.vigAlpha, s.dropIntensidad * 0.45);
  }
  s.vigAlpha = Math.max(0, s.vigAlpha - dt * 0.0045);

  // ── 14. Color interpolación ───────────────────────────────────────────────
  s.cr += (s.tr - s.cr) * 0.018;
  s.cg += (s.tg - s.cg) * 0.018;
  s.cb += (s.tb - s.cb) * 0.018;

  // ── 15. Edge bolts durante drops ─────────────────────────────────────────
  // Si estamos en un drop, disparamos relámpagos EXACTAMENTE en los beats fuertes
  if (s.dropActivo && s.onBeat) {
    // Si la energía global es alta, tiramos múltiples rayos en los bordes
    const numBolts = Math.floor(1 + s.dropIntensidad * 2);
    for(let i=0; i<numBolts; i++) {
      fireEdgeBolt(s, W, H, s.dropIntensidad);
    }
  } else if (!s.dropActivo && s.onsetEnergy > 0.15 && Math.random() < 0.1) {
    // Fuera de drops, rayos esporádicos en onsets fuertes (crashes de platillos/guitarras)
    fireEdgeBolt(s, W, H, s.onsetEnergy);
  }

  // ── 16. Blob rings por onset (cualquier instrumento) ────────────────────
  // Un onset suficientemente fuerte → ring en un blob aleatorio
  const onsetUmbral = 0.06 - s.dropIntensidad * 0.03; // más sensible en drops
  if (s.onsetEnergy > onsetUmbral && s.energiaGlobal > 0.15) {
    const wb  = s.blobsWarm[Math.floor(Math.random() * s.blobsWarm.length)];
    fireBlobRing(s, cx + Math.cos(wb.a) * wb.orb * W,
                    cy + Math.sin(wb.a * 0.7) * wb.orb * H * 0.55,
                    s.onsetEnergy * 1.5, 'warm');

    // Solo 1 blob frío por onset para no saturar
    if (s.onsetEnergy > onsetUmbral * 1.5) {
      const cb2 = s.blobsCool[Math.floor(Math.random() * s.blobsCool.length)];
      fireBlobRing(s, cx + Math.cos(cb2.a) * cb2.orb * W,
                      cy + Math.sin(cb2.a * 0.6) * cb2.orb * H * 0.55,
                      s.onsetEnergy * 1.2, 'cool');
    }
  }

  // ── 17. Drop + beat: todos los blobs emiten ring sincronizado ────────────
  if (s.dropActivo && s.onBeat) {
    for (const wb of s.blobsWarm) {
      fireBlobRing(s, cx + Math.cos(wb.a) * wb.orb * W,
                      cy + Math.sin(wb.a * 0.7) * wb.orb * H * 0.55,
                      s.dropIntensidad, 'warm');
    }
    for (const cb2 of s.blobsCool) {
      fireBlobRing(s, cx + Math.cos(cb2.a) * cb2.orb * W,
                      cy + Math.sin(cb2.a * 0.6) * cb2.orb * H * 0.55,
                      s.dropIntensidad, 'cool');
    }
  }

  // Exportar tempoRebote para uso en layers
  s.tempoRebote = tempoRebote;
  s.tempoChar   = tempoChar;
  s.tempoClock  = tempoClock;
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
    gW.addColorStop(0,   `rgba(${wR},${wG},${wB},0.9)`);
    gW.addColorStop(0.5, `rgba(${wR},${wG},${wB},0.4)`);
    gW.addColorStop(1,   'rgba(0,0,0,0)');
    s.ctxWarm.clearRect(0, 0, 256, 256);
    s.ctxWarm.fillStyle = gW;
    s.ctxWarm.fillRect(0, 0, 256, 256);

    const gC = s.ctxCool.createRadialGradient(128, 128, 0, 128, 128, 128);
    gC.addColorStop(0,   `rgba(${R},${G},${B},0.85)`);
    gC.addColorStop(0.5, `rgba(${R},${G},${B},0.35)`);
    gC.addColorStop(1,   'rgba(0,0,0,0)');
    s.ctxCool.clearRect(0, 0, 256, 256);
    s.ctxCool.fillStyle = gC;
    s.ctxCool.fillRect(0, 0, 256, 256);

    s.lastR = R; s.lastG = G; s.lastB = B;
  }
}
