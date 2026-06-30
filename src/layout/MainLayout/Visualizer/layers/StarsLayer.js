import { N_STARS } from '../constants';

/**
 * StarsLayer — Puntos de luz sincronizados con el tempo y la melodía.
 *
 * - Canciones rápidas → estrellas se mueven más rápido
 * - vocalIndex alto   → estrellas más brillantes (melodía/voz)
 * - tempoRebote       → flash de brillo en cada beat
 */
export function renderStarsLayer(ctx, s, W, H, cx, cy, dt, R, G, B) {
  ctx.fillStyle = 'rgba(255,255,255,1)';

  const tc  = s.tempoChar   ?? 0.5;
  const rb  = s.tempoRebote ?? 0;
  const vi  = s.vocalIndex  ?? 0;

  // Velocidad: el air ya la controla, pero el tempo la amplifica
  const starSpd = 1 + Math.pow(s.rAir, 1.4) * 25 + tc * 2.5;

  const st = s.stars;
  for (let i = 0; i < N_STARS; i++) {
    const b = i * 6;
    st[b]     += st[b + 2] * dt * starSpd;
    st[b + 1] += st[b + 3] * dt * starSpd;
    // Parpadeo más rápido en canciones rápidas y con vocal
    st[b + 5] += 0.016 * (1 + s.rAir * 5 + tc * 2 + vi * 1.5);

    if (st[b + 1] < 0) { st[b + 1] = 1; st[b] = Math.random(); }
    if (st[b + 1] > 1) { st[b + 1] = 0; st[b] = Math.random(); }
    if (st[b] < 0) st[b] = 1;
    if (st[b] > 1) st[b] = 0;

    // Alpha: parpadeo base + air + vocal + rebote del beat
    const sa = (0.06 + Math.abs(Math.sin(st[b + 5])) * 0.35)
             + s.rAir * 0.50
             + vi  * 0.20   // voz/melodía → estrellas más brillantes
             + rb  * 0.15;  // flash en cada beat
    ctx.globalAlpha = Math.min(sa, 1);

    // Tamaño: levemente mayor con vocal activa
    const sr = st[b + 4] * (1 + s.eAir * 1.8 + vi * 0.5);
    ctx.beginPath();
    ctx.arc(st[b] * W, st[b + 1] * H, sr, 0, Math.PI * 2);
    ctx.fill();
  }
}
