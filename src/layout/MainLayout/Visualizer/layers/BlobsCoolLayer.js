export function renderBlobsCoolLayer(ctx, s, W, H, cx, cy, dt, R, G, B) {
  for (const bl of s.blobsCool) {
    bl.a  += bl.spd * dt * (1 + s.eMids * 8);
    bl.ph += 0.0004 * dt;
    const bx = cx + Math.cos(bl.a) * bl.orb * W;
    const by = cy + Math.sin(bl.a * 0.6) * bl.orb * H * 0.55;
    const targetSz = bl.sz * Math.min(W, H) * (0.45 + s.eMids * 0.90);
    // Easing suave y estable
    if (bl.currentSz === 0) bl.currentSz = targetSz;
    bl.currentSz += (targetSz - bl.currentSz) * 0.18;
    const sz = Math.max(1, bl.currentSz);

    const ba = (0.02 + Math.abs(Math.sin(bl.ph)) * 0.03) + s.rMids * 0.30;
    ctx.globalAlpha = Math.min(ba, 1);
    ctx.drawImage(s.texCool, bx - sz, by - sz, sz * 2, sz * 2);
  }
}
