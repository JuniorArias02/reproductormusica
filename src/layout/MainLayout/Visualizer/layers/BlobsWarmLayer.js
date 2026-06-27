export function renderBlobsWarmLayer(ctx, s, W, H, cx, cy, dt, R, G, B) {
  for (const bl of s.blobsWarm) {
    bl.a  += bl.spd * dt * (1 + s.eLowMids * 5);
    bl.ph += 0.0003 * dt;
    const bx = cx + Math.cos(bl.a) * bl.orb * W;
    const by = cy + Math.sin(bl.a * 0.7) * bl.orb * H * 0.55;
    const targetSz = bl.sz * Math.min(W, H) * (0.50 + s.eLowMids * 0.80);
    // Easing suave y 100% estable (en lugar de resortes que explotan con dt variable)
    if (bl.currentSz === 0) bl.currentSz = targetSz;
    bl.currentSz += (targetSz - bl.currentSz) * 0.12;
    const sz = Math.max(1, bl.currentSz);

    const ba = (0.025 + Math.abs(Math.sin(bl.ph)) * 0.025) + s.rLowMids * 0.25;
    ctx.globalAlpha = Math.min(ba, 1);
    ctx.drawImage(s.texWarm, bx - sz, by - sz, sz * 2, sz * 2);

    // ── Pulso de energía interior (brillo cálido en núcleo) ───────────
    const energyFlash = s.pulse * 0.40 + s.eSubBass * 0.35 + s.dropIntensidad * 0.40;
    if (energyFlash > 0.05) {
      const coreR  = sz * 0.30 * (1 + energyFlash);
      const coreA  = Math.min(energyFlash * 0.75, 0.70);
      const wR     = Math.min(255, R + 60);
      const wG     = Math.max(0,   G - 20);
      const wB     = Math.max(0,   B - 40);
      const coreGrad = ctx.createRadialGradient(bx, by, 0, bx, by, coreR);
      coreGrad.addColorStop(0,   `rgba(255,230,180,${coreA.toFixed(3)})`);
      coreGrad.addColorStop(0.35, `rgba(${wR},${wG},${wB},${(coreA*0.55).toFixed(3)})`);
      coreGrad.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle   = coreGrad;
      ctx.beginPath();
      ctx.arc(bx, by, coreR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
