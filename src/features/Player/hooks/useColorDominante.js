import { useState, useEffect, useRef } from 'react';
import { extraerColorDominante } from '../services/extraerColorDominante';

const COLOR_DEFECTO = { r: 255, g: 74, b: 28, hex: '#FF4A1C' };

/**
 * Hook que extrae el color dominante de la canción activa.
 * Para MP4: captura un frame del video de fondo.
 * Para MP3: devuelve el color de acento por defecto (por ahora).
 */
export function useColorDominante(cancion, refElementoVideo) {
  const [color, setColor] = useState(COLOR_DEFECTO);
  const [cargando, setCargando] = useState(false);
  const refAnteriorId = useRef(null);

  useEffect(() => {
    if (!cancion || cancion.id === refAnteriorId.current) return;
    refAnteriorId.current = cancion.id;

    if (cancion.esVideo && refElementoVideo?.current) {
      setCargando(true);
      // Esperar a que el video tenga un frame
      const intentarExtraccion = () => {
        extraerColorDominante(refElementoVideo.current)
          .then((colorExtraido) => {
            setColor(colorExtraido);
            setCargando(false);
          })
          .catch(() => {
            setColor(COLOR_DEFECTO);
            setCargando(false);
          });
      };

      if (refElementoVideo.current.readyState >= 2) {
        intentarExtraccion();
      } else {
        const manejar = () => intentarExtraccion();
        refElementoVideo.current.addEventListener('loadeddata', manejar, { once: true });
      }
    } else if (!cancion.esVideo) {
      // Para MP3, generar un color pseudoaleatorio basado en el nombre del archivo
      const colorGenerado = generarColorDesdeCadena(cancion.titulo);
      setColor(colorGenerado);
    }
  }, [cancion, refElementoVideo]);

  return { color, cargando };
}

/** Genera un color HSL vibrante determinista a partir de un string */
function generarColorDesdeCadena(cadena) {
  let hash = 0;
  for (let i = 0; i < cadena.length; i++) {
    hash = cadena.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const h = Math.abs(hash) % 360;
  // Saturación y luminosidad fijas para asegurar que sea vibrante
  const [r, g, b] = hslARgb(h / 360, 0.85, 0.55);
  return {
    r, g, b,
    hex: `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`,
  };
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
