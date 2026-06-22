import { useEffect, useRef } from 'react';
import { useReproductor } from '../context/ContextoReproductor';

/**
 * Mini Visualizador de audio real con Canvas y Web Audio API.
 * Se renderiza solo en la canción activa para no saturar la memoria.
 */
export function MiniVisualizador({ colorPrimario = '#FF4A1C', barras = 4, ancho = 3, gap = 2, alto = 16 }) {
  const canvasRef = useRef(null);
  const refRaf = useRef(null);
  const { obtenerFrecuencias, estaReproduciendo } = useReproductor();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const valoresSuavizados = new Array(barras).fill(0);

    const bucle = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const frecuencias = obtenerFrecuencias();

      for (let i = 0; i < barras; i++) {
        let valor = 0;
        if (estaReproduciendo && frecuencias && frecuencias.length > 0) {
          // Espaciar un poco la muestra para que las mini barras no se muevan igual
          // Usamos índices bajos (graves/medios) que tienen más ritmo
          const indice = i * 2 + 1; 
          valor = (frecuencias[indice] || 0) / 255; 
        }

        valoresSuavizados[i] += (valor - valoresSuavizados[i]) * 0.3;
        
        const alturaMinima = 0.15;
        const alturaRelativa = Math.max(alturaMinima, valoresSuavizados[i]);
        const altoBarra = alturaRelativa * H;
        
        const x = i * (ancho + gap);
        const y = H - altoBarra;

        ctx.fillStyle = colorPrimario;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, ancho, altoBarra, [ancho/2, ancho/2, 0, 0]);
        } else {
          ctx.rect(x, y, ancho, altoBarra);
        }
        ctx.fill();
      }

      refRaf.current = requestAnimationFrame(bucle);
    };

    refRaf.current = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(refRaf.current);
  }, [estaReproduciendo, obtenerFrecuencias, colorPrimario, barras, ancho, gap, alto]);

  return (
    <canvas
      ref={canvasRef}
      width={(ancho * barras) + (gap * (barras - 1))}
      height={alto}
      style={{ display: 'block' }}
    />
  );
}
