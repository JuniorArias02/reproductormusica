/**
 * BlobRingsLayer — anillos de energía locales que emanan de los blobs.
 * Se disparan cuando hay un pico de energía (bass/kick fuerte).
 * Cada ring es un mini-shockwave posicionado en el blob que lo generó,
 * con color warm o cool según el blob de origen.
 */
export function renderBlobRingsLayer(ctx, s, W, H, cx, cy, dt, R, G, B) {
  const expandSpeed = 0.18 + s.eKickBass * 0.35;

  for (const ring of s.blobRings) {
    if (!ring.on) continue;

    ring.r += expandSpeed * dt;
    ring.a -= (0.008 + s.eKickBass * 0.003) * dt;

    if (ring.a <= 0 || ring.r >= ring.maxR) {
      ring.on = false;
      continue;
    }

    const progress = ring.r / ring.maxR;
    const thick    = Math.max(0.5, 2.5 * (1 - progress));

    // Color según tipo: warm = tono más cálido, cool = más frío
    let rC, gC, bC;
    if (ring.color === 'warm') {
      rC = Math.min(255, R + 60);
      gC = Math.max(0,   G - 20);
      bC = Math.max(0,   B - 40);
    } else {
      rC = Math.max(0,   R - 30);
      gC = Math.min(255, G + 20);
      bC = Math.min(255, B + 60);
    }

    // Anillo principal
    ctx.globalAlpha = Math.min(ring.a, 0.85);
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${rC},${gC},${bC},1)`;
    ctx.lineWidth   = thick;
    ctx.stroke();

    // Segundo anillo tenue desplazado (efecto doble onda)
    if (ring.r > 12) {
      ctx.globalAlpha = Math.min(ring.a * 0.35, 0.4);
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r * 0.72, 0, Math.PI * 2);
      ctx.lineWidth = thick * 0.6;
      ctx.stroke();
    }
  }
}
