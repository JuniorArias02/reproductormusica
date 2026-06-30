export function renderMouseLayer(ctx, s, W, H, cx, cy, dt, R, G, B) {
  if (!s.mActive && s.mouseExplosions.every(e => !e.active)) return;

  ctx.save();
  
  // Render explosions
  for (let i = 0; i < s.mouseExplosions.length; i++) {
    const exp = s.mouseExplosions[i];
    if (!exp.active) continue;

    exp.life -= dt * 0.0015; // fade out speed
    if (exp.life <= 0) {
      exp.active = false;
      continue;
    }

    const t = 1 - exp.life; // 0 to 1
    // ease-out cubic
    const progress = 1 - Math.pow(1 - t, 3);
    const size = exp.maxSize * progress;
    const alpha = exp.life;
    
    // Outer ring
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, size, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${R}, ${G}, ${B}, ${alpha * 0.8})`;
    ctx.lineWidth = 4 * alpha;
    ctx.stroke();

    // Inner bright ring
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, size * 0.8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
    ctx.lineWidth = 2 * alpha;
    ctx.stroke();
  }

  // Render mouse pointer bubble
  if (s.mActive) {
    const mx = s.mx;
    const my = s.my;
    
    // Bubble pulsates based on the music (kick/beat)
    const baseSize = 20;
    const pulseBoost = (s.pulse * 15) + (s.energiaGlobal * 20);
    const size = baseSize + pulseBoost;

    // Charging visual
    if (s.mDown && s.mCharge > 0) {
      ctx.beginPath();
      const chargeSize = size + 10 + s.mCharge * 40;
      ctx.arc(mx, my, chargeSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${R}, ${G}, ${B}, ${0.05 + s.mCharge * 0.2})`;
      ctx.fill();
      
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + s.mCharge * 0.6})`;
      ctx.setLineDash([10, 5]);
      ctx.lineWidth = 2 + s.mCharge * 3;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Glowing circle
    ctx.beginPath();
    ctx.arc(mx, my, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${R}, ${G}, ${B}, 0.15)`;
    ctx.fill();
    
    ctx.strokeStyle = `rgba(${R}, ${G}, ${B}, 0.6)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Core dot
    ctx.beginPath();
    ctx.arc(mx, my, 4, 0, Math.PI * 2);
    ctx.fillStyle = s.mDown ? `rgba(255, 255, 255, 1)` : `rgba(255, 255, 255, 0.8)`;
    ctx.fill();
  }

  ctx.restore();
}
