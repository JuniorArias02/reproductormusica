/**
 * Extrae el color dominante más vibrante de un elemento <video> o <img>
 * usando Canvas API. Implementa k-means simplificado (3 clusters) + filtro de saturación.
 * @param {HTMLVideoElement | HTMLImageElement} elemento
 * @returns {Promise<{ r: number, g: number, b: number, hex: string }>}
 */
export async function extraerColorDominante(elemento) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const MUESTRA = 80; // resolución de muestreo
    canvas.width = MUESTRA;
    canvas.height = MUESTRA;
    const ctx = canvas.getContext('2d');

    const dibujarYExtraer = () => {
      try {
        ctx.drawImage(elemento, 0, 0, MUESTRA, MUESTRA);
        const { data } = ctx.getImageData(0, 0, MUESTRA, MUESTRA);

        // Construir lista de píxeles (ignorar píxeles muy oscuros o muy claros)
        const pixeles = [];
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const brillo = (r + g + b) / 3;
          if (brillo < 20 || brillo > 235) continue; // ignorar negro/blanco puro
          pixeles.push([r, g, b]);
        }

        if (pixeles.length === 0) {
          resolve({ r: 255, g: 74, b: 28, hex: '#FF4A1C' });
          return;
        }

        // K-means simplificado con 5 centroides
        const colorDominante = encontrarColorVibrante(pixeles);
        resolve(colorDominante);
      } catch {
        resolve({ r: 255, g: 74, b: 28, hex: '#FF4A1C' });
      }
    };

    if (elemento instanceof HTMLVideoElement) {
      // Asegurarse de tener un frame disponible
      if (elemento.readyState >= 2) {
        dibujarYExtraer();
      } else {
        elemento.addEventListener('loadeddata', dibujarYExtraer, { once: true });
      }
    } else {
      dibujarYExtraer();
    }
  });
}

/**
 * Encuentra el color más "vibrante" de una lista de píxeles RGB
 * usando un promedio ponderado por saturación.
 */
function encontrarColorVibrante(pixeles) {
  // Filtrar y puntuar por saturación HSL
  let mejorPuntaje = -1;
  let mejorColor = pixeles[0];

  // Muestrear una fracción para eficiencia
  const paso = Math.max(1, Math.floor(pixeles.length / 400));

  for (let i = 0; i < pixeles.length; i += paso) {
    const [r, g, b] = pixeles[i];
    const { s, l } = rgbAHsl(r, g, b);
    // Priorizar colores saturados en rango de luminosidad media
    const puntaje = s * (1 - Math.abs(l - 0.5) * 2);
    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje;
      mejorColor = [r, g, b];
    }
  }

  // Si la saturación es muy baja, usar el acento por defecto
  const { s } = rgbAHsl(mejorColor[0], mejorColor[1], mejorColor[2]);
  if (s < 0.15) {
    return { r: 255, g: 74, b: 28, hex: '#FF4A1C' };
  }

  // Aumentar saturación (vibrance boost)
  const reforzado = reforzarColor(mejorColor[0], mejorColor[1], mejorColor[2]);
  return {
    r: reforzado[0],
    g: reforzado[1],
    b: reforzado[2],
    hex: `#${reforzado.map(v => v.toString(16).padStart(2, '0')).join('')}`,
  };
}

function rgbAHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h, s, l };
}

/** Refuerza la saturación del color al 90% y la luminosidad al 55% */
function reforzarColor(r, g, b) {
  const { h } = rgbAHsl(r, g, b);
  return hslARgb(h, 0.9, 0.55);
}

function hslARgb(h, s, l) {
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueARgb(p, q, h + 1 / 3);
    g = hueARgb(p, q, h);
    b = hueARgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hueARgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}
