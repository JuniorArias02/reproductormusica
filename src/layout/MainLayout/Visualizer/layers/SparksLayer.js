import { N_SPARKS } from '../constants';
import { fireSparks } from '../VisualizerPhysics';

export function renderSparksLayer(ctx, s, W, H, cx, cy, dt, R, G, B) {
  if (s.rPresence > 0.55 && Math.random() < s.rPresence * 0.4) {
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.min(W, H) * (0.05 + Math.random() * 0.10);
    fireSparks(s, cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 2);
  }

  const sp = s.sparks;
  for (let i = 0; i < N_SPARKS; i++) {
    const b = i * 7;
    if (sp[b + 4] <= 0) continue;
    sp[b + 4] -= dt / sp[b + 5]; // normalizar life
    if (sp[b + 4] <= 0) { sp[b + 4] = 0; continue; }
    sp[b]     += sp[b + 2] * dt;
    sp[b + 1] += sp[b + 3] * dt;
    // Gravedad suave hacia abajo
    sp[b + 3] += 0.00012 * dt;
    
    const life = sp[b + 4];
    
    // Light Streak: Trazar una línea en la dirección de su velocidad
    // Cuanto más rápido y vivo, más larga la línea
    const lenX = sp[b + 2] * dt * 2.5;
    const lenY = sp[b + 3] * dt * 2.5;

    ctx.globalAlpha = Math.min(life * 1.5, 1);
    ctx.strokeStyle = `rgba(${R},${G},${B},1)`;
    ctx.lineWidth = sp[b + 6] * (0.5 + life * 0.5);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sp[b] - lenX, sp[b + 1] - lenY);
    ctx.lineTo(sp[b], sp[b + 1]);
    ctx.stroke();
  }
}
