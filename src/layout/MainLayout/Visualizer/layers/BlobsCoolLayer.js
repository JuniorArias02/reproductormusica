/**
 * BlobsCoolLayer — Sincronizados con VOZ y MELODÍA
 *
 * Modo suave (sin drop):
 *  - Pequeños y muy translúcidos. Brillan con la voz aunque sin drop.
 *  - "Respiran" al ritmo vocal: se inflan cuando canta, se encogen en silencio.
 *
 * Modo DROP (iaDropRamp → 1):
 *  - Se inflan moderadamente (menos que los warm, son más "melódicos")
 *  - Núcleo blanco-azulado se enciende con la intensidad vocal del drop
 *  - Órbita se acelera cuando la voz es intensa
 */
export function renderBlobsCoolLayer(ctx, s, W, H, cx, cy, dt, R, G, B) {
  const tc    = s.tempoChar   ?? 0.5;
  const drop  = s.iaDropRamp  ?? 0;
  const vocal = s.iaVocal     ?? 0;    // señal del stem de voz (0-1)
  const rb    = s.tempoRebote ?? 0;

  for (const bl of s.blobsCool) {
    // Órbita: se acelera cuando hay voz intensa (melodía activa)
    const orbitSpeed = 1 + s.eMids * 5 + tc * 2.5 + vocal * 3.0 + drop * 2.5;
    bl.a  += bl.spd * dt * orbitSpeed;
    bl.ph += 0.0004 * dt;

    const bx = cx + Math.cos(bl.a) * bl.orb * W;
    const by = cy + Math.sin(bl.a * 0.6) * bl.orb * H * 0.55;

    // ── Tamaño ────────────────────────────────────────────────────────────
    // Los blobs vocales "respiran" con el nivel vocal
    const baseSz    = bl.sz * Math.min(W, H);
    const quietSz   = baseSz * (0.25 + (1 - tc) * 0.18);       // muy pequeños sin voz
    const vocalMod  = 1.0 + vocal * 0.60;                       // vocal infla suavemente
    const dropMod   = 1.0 + drop  * (0.70 + vocal * 0.80);     // drop + vocal = grande
    const targetSz  = quietSz * vocalMod * dropMod;

    // Resorte más suave que el warm (melodía = movimiento más fluido)
    const tension = 0.06 + vocal * 0.04 + drop * 0.03;
    bl.springVel += (targetSz - bl.currentSz) * tension;
    bl.springVel *= 0.82;
    if (bl.currentSz === 0) { bl.currentSz = quietSz; bl.springVel = 0; }
    bl.currentSz += bl.springVel;
    const sz = Math.max(1, bl.currentSz);

    // ── Alpha ─────────────────────────────────────────────────────────────
    // Con voz activa siempre hay algo de brillo, incluso sin drop
    const quietA = 0.015 + vocal * 0.055 + Math.abs(Math.sin(bl.ph)) * 0.020;
    const dropA  = drop * 0.30 + vocal * 0.20 + rb * 0.10;
    ctx.globalAlpha = Math.min(quietA + dropA, 0.82);
    ctx.drawImage(s.texCool, bx - sz, by - sz, sz * 2, sz * 2);

    // ── Núcleo interior (brillo vocal) ────────────────────────────────────
    const coreSignal = vocal * 0.55 + drop * 0.30 + s.pulse * 0.15 + rb * 0.12;
    if (coreSignal > 0.06) {
      const coreR = sz * (0.20 + coreSignal * 0.35);
      const coreA = Math.min(coreSignal * 0.85, 0.80);
      const grad  = ctx.createRadialGradient(bx, by, 0, bx, by, coreR);
      grad.addColorStop(0,    `rgba(255,255,255,${coreA.toFixed(3)})`);
      grad.addColorStop(0.30, `rgba(${R},${G},${Math.min(255, B + 90)},${(coreA * 0.55).toFixed(3)})`);
      grad.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle   = grad;
      ctx.beginPath();
      ctx.arc(bx, by, coreR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
