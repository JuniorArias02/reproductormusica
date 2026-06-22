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
  }
}
