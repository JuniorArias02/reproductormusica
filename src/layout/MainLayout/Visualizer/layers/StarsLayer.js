import { N_STARS } from '../constants';

export function renderStarsLayer(ctx, s, W, H, cx, cy, dt, R, G, B) {
  ctx.fillStyle = 'rgba(255,255,255,1)';
  const starSpd = 1 + Math.pow(s.rAir, 1.4) * 25;
  const st = s.stars;
  for (let i = 0; i < N_STARS; i++) {
    const b = i * 6;
    st[b]     += st[b + 2] * dt * starSpd;
    st[b + 1] += st[b + 3] * dt * starSpd;
    st[b + 5] += 0.016 * (1 + s.rAir * 5);
    if (st[b + 1] < 0) { st[b + 1] = 1; st[b] = Math.random(); }
    if (st[b + 1] > 1) { st[b + 1] = 0; st[b] = Math.random(); }
    if (st[b] < 0) st[b] = 1;
    if (st[b] > 1) st[b] = 0;
    const sa = (0.08 + Math.abs(Math.sin(st[b + 5])) * 0.35) + s.rAir * 0.55;
    ctx.globalAlpha = Math.min(sa, 1);
    const sr = st[b + 4] * (1 + s.eAir * 1.8);
    ctx.beginPath();
    ctx.arc(st[b] * W, st[b + 1] * H, sr, 0, Math.PI * 2);
    ctx.fill();
  }
}
