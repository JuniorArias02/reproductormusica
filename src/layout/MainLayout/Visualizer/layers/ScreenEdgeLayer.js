/**
 * ScreenEdgeLayer — Explosiones elegantes en los bordes de la pantalla.
 *
 * Filosofía: sin líneas ni láseres. Todo son bursts de luz suave —
 * círculos radiales con múltiples capas de gradiente que simulan bloom/blur,
 * como gotas de tinta luminosa que explotan desde los bordes.
 *
 * Dos efectos:
 *   1. edgeGlow   — halo continuo pegado al borde, crece con drop/kick.
 *   2. edgeBolts  — "explosiones de borde": orbes que nacen en la orilla,
 *                   se expanden y se disuelven como burbujas de luz.
 */
export function renderScreenEdgeLayer(ctx, s, W, H, cx, cy, dt, R, G, B) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  const tc = s.tempoChar   ?? 0.5; // 0=lento, 1=rápido
  const rb = s.tempoRebote ?? 0;   // rebote del beat

  // ── 1. Halo continuo de borde ─────────────────────────────────────────
  // Lento: halo ancho y etéreo | Rápido: halo estrecho y pulsante
  const glowBase = s.dropIntensidad * 0.55 + s.eSubBass * 0.18;
  const glowBeat = rb * (0.12 - tc * 0.06); // el rebote vale más en canciones lentas
  const glowIntensity = glowBase + glowBeat;
  if (glowIntensity > 0.012) {
    _drawContinuousEdgeHalo(ctx, W, H, glowIntensity, tc, R, G, B);
  }

  // ── 2. Explosiones individuales de borde ─────────────────────────────
  // Velocidad de decaimiento: rápido en tempo alto (bursts más cortos y snappy)
  const boltDecay = dt * (0.005 + tc * 0.006);
  for (const bolt of s.edgeBolts) {
    if (!bolt.on) continue;
    bolt.life -= boltDecay;
    if (bolt.life <= 0) { bolt.on = false; continue; }
    bolt.r = (1 - bolt.life) * bolt.len;
    _drawEdgeBurst(ctx, bolt, W, H, R, G, B);
  }

  ctx.restore();
}

// ── Helper: halo suave en los 4 bordes ──────────────────────────────────────────
function _drawContinuousEdgeHalo(ctx, W, H, intensity, tc, R, G, B) {
  // Lento (tc=0): halo más profundo y etéren | Rápido (tc=1): más estrecho
  const depth  = Math.min(W, H) * (0.08 + intensity * 0.20 + (1 - tc) * 0.06);
  const alpha  = Math.min(intensity * 0.45, 0.40);

  // Cada borde usa un gradiente lineal perpendicular al borde
  const edges = [
    { x0: 0, y0: 0, x1: 0, y1: depth,   rx: 0, ry: 0, rw: W, rh: depth },           // top
    { x0: 0, y0: H, x1: 0, y1: H-depth, rx: 0, ry: H-depth, rw: W, rh: depth },      // bottom
    { x0: 0, y0: 0, x1: depth, y1: 0,   rx: 0, ry: 0, rw: depth, rh: H },            // left
    { x0: W, y0: 0, x1: W-depth, y1: 0, rx: W-depth, ry: 0, rw: depth, rh: H },      // right
  ];

  for (const e of edges) {
    const grad = ctx.createLinearGradient(e.x0, e.y0, e.x1, e.y1);
    grad.addColorStop(0,    `rgba(${R},${G},${B},${alpha.toFixed(3)})`);
    grad.addColorStop(0.35, `rgba(${R},${G},${B},${(alpha * 0.35).toFixed(3)})`);
    grad.addColorStop(1,    `rgba(${R},${G},${B},0)`);
    ctx.globalAlpha = 1;
    ctx.fillStyle   = grad;
    ctx.fillRect(e.rx, e.ry, e.rw, e.rh);
  }

  // Esquinas: orbes radiales suaves para unir los bordes elegantemente
  const cornerR = depth * 1.2;
  const corners  = [[0,0],[W,0],[0,H],[W,H]];
  for (const [cx2, cy2] of corners) {
    const cGrad = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, cornerR);
    cGrad.addColorStop(0,   `rgba(${R},${G},${B},${(alpha * 0.6).toFixed(3)})`);
    cGrad.addColorStop(0.5, `rgba(${R},${G},${B},${(alpha * 0.2).toFixed(3)})`);
    cGrad.addColorStop(1,   `rgba(${R},${G},${B},0)`);
    ctx.globalAlpha = 1;
    ctx.fillStyle   = cGrad;
    ctx.beginPath();
    ctx.arc(cx2, cy2, cornerR, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Helper: explosión elegante de borde ────────────────────────────────────
// El burst nace pegado al borde (bx, by) y se expande radialmente.
// Múltiples capas concéntricas simulan profundidad/bloom sin líneas.
function _drawEdgeBurst(ctx, bolt, W, H, R, G, B) {
  // Calcular posición del centro del burst (pegado al borde)
  let bx, by;
  switch (bolt.edge) {
    case 0: bx = bolt.pos * W; by = 0;   break; // top
    case 1: bx = W;            by = bolt.pos * H; break; // right
    case 2: bx = bolt.pos * W; by = H;   break; // bottom
    case 3: bx = 0;            by = bolt.pos * H; break; // left
  }

  const t     = 1 - bolt.life;         // 0→1 a medida que avanza
  const maxR  = bolt.len;
  const curR  = maxR * Math.pow(t, 0.55); // expansión rápida al inicio

  // Alpha con campana gaussiana: sube rápido, cae suave
  const burstAlpha = Math.min(bolt.a, 0.9) * bolt.life * (1 + Math.sin(t * Math.PI) * 0.4);

  if (curR < 1 || burstAlpha < 0.005) return;

  // ── Capa 1: núcleo muy brillante (bloom interior) ──
  const innerR = curR * 0.22;
  const g1     = ctx.createRadialGradient(bx, by, 0, bx, by, innerR);
  g1.addColorStop(0,   `rgba(255,255,255,${Math.min(burstAlpha * 0.85, 0.80).toFixed(3)})`);
  g1.addColorStop(0.4, `rgba(${R},${G},${B},${(burstAlpha * 0.50).toFixed(3)})`);
  g1.addColorStop(1,   `rgba(${R},${G},${B},0)`);
  ctx.globalAlpha = 1;
  ctx.fillStyle   = g1;
  ctx.beginPath();
  ctx.arc(bx, by, innerR, 0, Math.PI * 2);
  ctx.fill();

  // ── Capa 2: halo medio (el cuerpo principal del burst) ──
  const g2 = ctx.createRadialGradient(bx, by, innerR * 0.6, bx, by, curR);
  g2.addColorStop(0,   `rgba(${R},${G},${B},${(burstAlpha * 0.45).toFixed(3)})`);
  g2.addColorStop(0.55,`rgba(${R},${G},${B},${(burstAlpha * 0.18).toFixed(3)})`);
  g2.addColorStop(1,   `rgba(${R},${G},${B},0)`);
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.arc(bx, by, curR, 0, Math.PI * 2);
  ctx.fill();

  // ── Capa 3: corona exterior fantasma (el "bloom blur") ──
  const outerR = curR * 1.55;
  const outerA = burstAlpha * 0.18 * bolt.life;
  if (outerA > 0.005) {
    const g3 = ctx.createRadialGradient(bx, by, curR * 0.8, bx, by, outerR);
    g3.addColorStop(0, `rgba(${R},${G},${B},${outerA.toFixed(3)})`);
    g3.addColorStop(1, `rgba(${R},${G},${B},0)`);
    ctx.fillStyle = g3;
    ctx.beginPath();
    ctx.arc(bx, by, outerR, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Capa 4: partícula central fija (punto de ignición en el borde) ──
  //inicio del burst (life > 0.65), hace que "nace" del borde
  if (bolt.life > 0.50) {
    const sparkA  = (bolt.life - 0.50) * 2 * burstAlpha;
    const sparkR  = innerR * 0.35;
    const sparkGr = ctx.createRadialGradient(bx, by, 0, bx, by, sparkR);
    sparkGr.addColorStop(0, `rgba(255,255,255,${Math.min(sparkA, 1).toFixed(3)})`);
    sparkGr.addColorStop(1, `rgba(255,255,255,0)`);
    ctx.fillStyle = sparkGr;
    ctx.beginPath();
    ctx.arc(bx, by, sparkR, 0, Math.PI * 2);
    ctx.fill();
  }
}
