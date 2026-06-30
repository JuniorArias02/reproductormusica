/**
 * BPMDetector — Detección de tempo en tiempo real.
 *
 * Algoritmo:
 *  1. Cada vez que se detecta un beat, se guarda el timestamp.
 *  2. Se calculan los intervalos entre beats consecutivos.
 *  3. La mediana de esos intervalos → BPM (más robusto que la media).
 *  4. `tempoChar` (0=lento, 1=rápido) escala la agresividad visual.
 *  5. `tempoClock` avanza de 0→1 entre cada beat (para efectos sincronizados).
 */

const MAX_BEATS   = 32;   // historial de timestamps de beats
const MIN_INTER   = 222;  // ms → máx ~270 BPM
const MAX_INTER   = 1333; // ms → mín  ~45 BPM

export function createBPMDetector() {
  return {
    beatTimes:    new Float64Array(MAX_BEATS),
    beatCount:    0,
    bpm:          120,
    bpmSmooth:    120,
    tempoChar:    0.5,    // 0=lento(60BPM), 1=rápido(180BPM)
    lastBeatTime: 0,
    beatPeriod:   500,    // ms entre beats (60000/BPM)
    tempoClock:   0,      // 0→1 dentro del beat actual
  };
}

/**
 * Llamar cada frame.
 * @param {object} det   - detector creado con createBPMDetector()
 * @param {boolean} onBeat - si este frame hay un beat detectado
 * @param {number}  now  - performance.now() del frame actual
 * @param {number}  dt   - delta time en ms
 */
export function updateBPMDetector(det, onBeat, now, dt) {
  // Avanzar el reloj de tempo (fracción dentro del beat)
  det.tempoClock = Math.min(1, det.tempoClock + dt / det.beatPeriod);

  if (!onBeat) return;

  const elapsed = now - det.lastBeatTime;

  // Filtrar: si es demasiado corto o largo, no es un beat válido
  if (elapsed < MIN_INTER || elapsed > MAX_INTER) {
    det.lastBeatTime = now;
    det.tempoClock = 0;
    return;
  }

  // Registrar timestamp del beat
  det.beatTimes[det.beatCount % MAX_BEATS] = now;
  det.beatCount++;
  det.lastBeatTime = now;
  det.tempoClock = 0; // reset al inicio de cada beat

  // Necesitamos al menos 4 beats para estimar
  const n = Math.min(det.beatCount, MAX_BEATS);
  if (n < 4) return;

  // Calcular intervalos entre beats consecutivos guardados
  const intervals = [];
  for (let i = 1; i < n; i++) {
    const a = det.beatTimes[(det.beatCount - n + i - 1 + MAX_BEATS) % MAX_BEATS];
    const b = det.beatTimes[(det.beatCount - n + i     + MAX_BEATS) % MAX_BEATS];
    const iv = b - a;
    if (iv >= MIN_INTER && iv <= MAX_INTER) intervals.push(iv);
  }
  if (intervals.length < 3) return;

  // Mediana (robusta ante outliers)
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];

  const rawBPM = 60000 / median;
  det.bpm = Math.max(50, Math.min(210, rawBPM));

  // Suavizar el BPM para evitar saltos bruscos
  det.bpmSmooth += (det.bpm - det.bpmSmooth) * 0.08;
  det.beatPeriod = 60000 / det.bpmSmooth;

  // tempoChar: 0 a 60 BPM, 0.5 a 120 BPM, 1 a 180 BPM
  det.tempoChar = Math.max(0, Math.min(1, (det.bpmSmooth - 60) / 120));
}
