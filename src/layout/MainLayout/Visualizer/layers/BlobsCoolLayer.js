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

    // ── Pulso de energía interior (brillo en núcleo) ──────────────────
    // Se dispara con el kick/bass fuerte, dando sensación de energía explosiva
    const energyFlash = s.pulse * 0.45 + s.eKickBass * 0.30 + s.dropIntensidad * 0.35;
    if (energyFlash > 0.05) {
      const coreR  = sz * 0.28 * (1 + energyFlash);
      const coreA  = Math.min(energyFlash * 0.80, 0.75);
      const coreGrad = ctx.createRadialGradient(bx, by, 0, bx, by, coreR);
      // Centro blanco → color del tema → transparente
      coreGrad.addColorStop(0,   `rgba(255,255,255,${coreA.toFixed(3)})`);
      coreGrad.addColorStop(0.3, `rgba(${R},${G},${Math.min(255,B+80)},${(coreA*0.6).toFixed(3)})`);
      coreGrad.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle   = coreGrad;
      ctx.beginPath();
      ctx.arc(bx, by, coreR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
