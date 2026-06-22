export function renderShockwavesLayer(ctx, s, W, H, cx, cy, dt, R, G, B) {
  const swSpd = 0.25 + s.eKickBass * 0.7;
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
}
