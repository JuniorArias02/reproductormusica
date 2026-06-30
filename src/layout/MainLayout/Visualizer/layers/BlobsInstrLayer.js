/**
 * BlobsInstrLayer — Sincronizados con ONSETS de INSTRUMENTOS (stem 'other')
 *
 * Estos blobs SOLO se activan cuando Demucs detecta un instrumento
 * (guitarra, sinte, piano, etc.) en el stem 'other'. Son los más agresivos
 * y explosivos porque reaccionan a transientes puros, no a energía continua.
 *
 * Modo suave: casi invisibles. Orbitan lentamente en segundo plano.
 * En onset: flash explosivo sincronizado con la nota del instrumento.
 * En drop + onset: explosión máxima con ring propio.
 */
export function renderBlobsInstrLayer(ctx, s, W, H, cx, cy, dt, R, G, B) {
  const tc     = s.tempoChar     ?? 0.5;
  const drop   = s.iaDropRamp    ?? 0;
  const instr  = s.iaInstr       ?? 0;   // señal del stem 'other' (0-1, decae)
  const flash  = s.iaOnsetFlash  ?? 0;   // flash de 1 frame por onset nuevo
  const rb     = s.tempoRebote   ?? 0;

  // Color complementario: desplazamos el tono hacia el violeta/cian
  const iR = Math.min(255, Math.max(0, R - 40));
  const iG = Math.min(255, Math.max(0, G + 30));
  const iB = Math.min(255, Math.max(0, B + 80));

  for (const bl of s.blobsInstr) {
    // Órbita exterior (más alejados del centro)
    const orbitSpeed = 1 + tc * 2.0 + instr * 5.0 + drop * 3.0;
    bl.a  += bl.spd * dt * orbitSpeed;
    bl.ph += 0.0002 * dt;

    // Radio de órbita expandido en drop
    const orbRadius = bl.orb * (1 + drop * 0.25);
    const bx = cx + Math.cos(bl.a) * orbRadius * W;
    const by = cy + Math.sin(bl.a * 0.5) * orbRadius * H * 0.50;

    // ── Tamaño: Resorte agresivo basado en onset ──────────────────────────
    const baseSz   = bl.sz * Math.min(W, H);
    const quietSz  = baseSz * 0.15;                           // casi invisible en silencio
    const onsetSz  = baseSz * (0.60 + instr * 1.40);         // explota en onset
    const dropBoost= 1.0 + drop * 0.80;
    const targetSz = Math.max(quietSz, onsetSz) * dropBoost;

    // Resorte muy elástico (alta tensión, poca fricción) = golpe explosivo
    const tension = 0.15 + flash * 0.20;
    bl.springVel += (targetSz - bl.currentSz) * tension;
    bl.springVel *= 0.70;                                     // poca fricción = rebote
    if (bl.currentSz === 0) { bl.currentSz = quietSz; bl.springVel = 0; }
    bl.currentSz += bl.springVel;
    const sz = Math.max(0.5, bl.currentSz);

    // ── Alpha: casi invisible en silencio, brillante en onset ────────────
    const quietA  = Math.abs(Math.sin(bl.ph)) * 0.010;       // parpadeo muy sutil
    const onsetA  = instr * 0.45 + flash * 0.30 + drop * 0.20;
    ctx.globalAlpha = Math.min(quietA + onsetA, 0.80);

    // Usar textura cool pero con tono desplazado (complementario)
    ctx.drawImage(s.texCool, bx - sz, by - sz, sz * 2, sz * 2);

    // ── Núcleo interior: flash de onset ───────────────────────────────────
    const coreSignal = flash * 0.80 + instr * 0.45 + drop * 0.25 + rb * 0.10;
    if (coreSignal > 0.05) {
      const coreR = sz * (0.18 + coreSignal * 0.45);
      const coreA = Math.min(coreSignal * 0.92, 0.90);
      const grad  = ctx.createRadialGradient(bx, by, 0, bx, by, coreR);
      // Color frío-violeta para distinguirlos de los otros blobs
      grad.addColorStop(0,    `rgba(200,220,255,${coreA.toFixed(3)})`);
      grad.addColorStop(0.25, `rgba(${iR},${iG},${iB},${(coreA * 0.65).toFixed(3)})`);
      grad.addColorStop(0.70, `rgba(${R},${G},${B},${(coreA * 0.20).toFixed(3)})`);
      grad.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle   = grad;
      ctx.beginPath();
      ctx.arc(bx, by, coreR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
