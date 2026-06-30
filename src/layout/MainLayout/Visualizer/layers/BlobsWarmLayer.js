/**
 * BlobsWarmLayer — Sincronizados con BAJO y BATERÍA
 *
 * Modo suave (sin drop):
 *  - Tamaño pequeño, translúcido, órbita lenta
 *  - Pulso suave en cada beat (iaBass)
 *
 * Modo DROP (iaDropRamp → 1):
 *  - Se inflan agresivamente con cada beat
 *  - Núcleo interior explota con el kick
 *  - Vibran al ritmo exacto de los onsets del bajo
 */
export function renderBlobsWarmLayer(ctx, s, W, H, cx, cy, dt, R, G, B) {
  const tc   = s.tempoChar    ?? 0.5;
  const drop = s.iaDropRamp   ?? 0;     // 0=tranquilo, 1=drop total
  const bass = s.iaBass       ?? 0;     // señal del stem de bajo/batería
  const rb   = s.tempoRebote  ?? 0;

  for (const bl of s.blobsWarm) {
    // Órbita: más rápida en drop
    const orbitSpeed = 1 + s.eLowMids * 4 + tc * 2.5 + drop * 4.0;
    bl.a  += bl.spd * dt * orbitSpeed;
    bl.ph += 0.0003 * dt;

    const bx = cx + Math.cos(bl.a) * bl.orb * W;
    const by = cy + Math.sin(bl.a * 0.7) * bl.orb * H * 0.55;

    // ── Tamaño ────────────────────────────────────────────────────────────
    // Fuera de drop: pequeño y con pulso suave del bajo
    // En drop: se infla explosivamente con cada beat de batería
    const baseSz    = bl.sz * Math.min(W, H);
    const quietSz   = baseSz * (0.30 + (1 - tc) * 0.20);      // pequeño fuera de drop
    const dropSzMod = 1.0 + drop * (0.90 + bass * 1.20);       // hasta 3x en drop con bass fuerte
    const targetSz  = quietSz * dropSzMod;

    // Resorte: la física de spring absorbe el golpe y rebota
    const tension = 0.08 + drop * 0.06;
    bl.springVel += (targetSz - bl.currentSz) * tension;
    bl.springVel *= 0.78;                                       // fricción
    if (bl.currentSz === 0) { bl.currentSz = quietSz; bl.springVel = 0; }
    bl.currentSz += bl.springVel;
    const sz = Math.max(1, bl.currentSz);

    // ── Alpha ─────────────────────────────────────────────────────────────
    // Fuera de drop: muy translúcido. En drop con bass: brillante y visible
    const quietA  = 0.020 + Math.abs(Math.sin(bl.ph)) * 0.015;
    const dropA   = drop * 0.35 + bass * 0.25 + rb * 0.12;
    ctx.globalAlpha = Math.min(quietA + dropA, 0.88);
    ctx.drawImage(s.texWarm, bx - sz, by - sz, sz * 2, sz * 2);

    // ── Núcleo interior (pulso de energía) ────────────────────────────────
    // Solo visible cuando hay bass fuerte o estamos en drop
    const coreSignal = bass * 0.6 + drop * 0.35 + s.pulse * 0.20 + rb * 0.15;
    if (coreSignal > 0.08) {
      const coreR = sz * (0.22 + coreSignal * 0.40);
      const coreA = Math.min(coreSignal * 0.90, 0.85);
      const wR    = Math.min(255, R + 70);
      const wG    = Math.max(0,   G - 20);
      const wB    = Math.max(0,   B - 40);
      const grad  = ctx.createRadialGradient(bx, by, 0, bx, by, coreR);
      grad.addColorStop(0,    `rgba(255,220,160,${coreA.toFixed(3)})`);
      grad.addColorStop(0.30, `rgba(${wR},${wG},${wB},${(coreA * 0.50).toFixed(3)})`);
      grad.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle   = grad;
      ctx.beginPath();
      ctx.arc(bx, by, coreR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
