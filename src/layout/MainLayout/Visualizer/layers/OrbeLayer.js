export function renderOrbeLayer(ctx, s, W, H, cx, cy, dt, R, G, B) {
  const orbeBase  = 0.030;
  const orbeSub   = s.eSubBass    * 0.09;
  const orbeEnerg = s.energiaGlobal * 0.06;
  const orbePulse = s.pulse        * 0.07;
  const orbeDrop  = s.dropIntensidad * 0.24;

  const orbeR = Math.min(W, H) * (orbeBase + orbeSub + orbeEnerg + orbePulse + orbeDrop);

  const orbeA = 0.010
    + s.eSubBass      * 0.035
    + s.energiaGlobal * 0.025
    + s.pulse         * 0.055
    + s.dropIntensidad * 0.095;

  const oGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbeR);
  oGrad.addColorStop(0,   `rgba(${R},${G},${B},${Math.min(orbeA, 0.25)})`);
  oGrad.addColorStop(0.5, `rgba(${R},${G},${B},${Math.min(orbeA * 0.4, 0.10)})`);
  oGrad.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = oGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, orbeR, 0, Math.PI * 2);
  ctx.fill();
}
