import { useEffect, useRef } from 'react';
import { useReproductor } from '../context/ContextoReproductor';

/**
 * Visualizador de audio real con Canvas y Web Audio API.
 * Las barras responden con precisión a las frecuencias musicales en tiempo real.
 */
export function VisualizadorAudio({ estaReproduciendo, colorPrimario = '#FF4A1C' }) {
  const canvasRef = useRef(null);
  const refRaf = useRef(null);
  const { obtenerFrecuencias } = useReproductor();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Array para suavizar la caída de las barras y que no se vea tan brusco
    const CANTIDAD_BARRAS = 24;
    let valoresSuavizados = new Array(CANTIDAD_BARRAS).fill(0);

    const bucle = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const frecuencias = obtenerFrecuencias();
      
      const gap = 3;
      const anchoBarra = (W - (CANTIDAD_BARRAS - 1) * gap) / CANTIDAD_BARRAS;

      for (let i = 0; i < CANTIDAD_BARRAS; i++) {
        // Tomamos muestras directas de las frecuencias si existen
        let valor = 0;
        if (estaReproduciendo && frecuencias && frecuencias.length > i) {
           // Normalizar de 0 a 1
           valor = frecuencias[i] / 255; 
        }

        // Interpolación lineal para suavizar los movimientos (easing)
        valoresSuavizados[i] += (valor - valoresSuavizados[i]) * 0.25;
        
        // Altura mínima para que no desaparezcan cuando no hay sonido
        const alturaMinima = 0.15;
        const alturaRelativa = Math.max(alturaMinima, valoresSuavizados[i]);
        const altoBarra = alturaRelativa * H;
        
        const x = i * (anchoBarra + gap);
        const y = H - altoBarra;

        // Crear gradiente de color inmersivo
        const grad = ctx.createLinearGradient(0, y, 0, H);
        
        // Toques de acento secundario cada cierta barra para que resalte
        if (i % 4 === 1) {
           grad.addColorStop(0, '#00F0FF');
           grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
        } else {
           grad.addColorStop(0, colorPrimario);
           // Para el hex necesitamos pasarlo a transparente al fondo
           grad.addColorStop(1, `${colorPrimario}00`); 
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        
        // Canvas API moderna para rectángulos con bordes redondeados arriba
        if (ctx.roundRect) {
          ctx.roundRect(x, y, anchoBarra, altoBarra, [4, 4, 0, 0]);
        } else {
          ctx.rect(x, y, anchoBarra, altoBarra);
        }
        
        ctx.fill();
      }

      refRaf.current = requestAnimationFrame(bucle);
    };

    refRaf.current = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(refRaf.current);
  }, [estaReproduciendo, obtenerFrecuencias, colorPrimario]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-16 transition-opacity duration-500"
      width={320}
      height={64}
      style={{ display: 'block', opacity: estaReproduciendo ? 1 : 0.6 }}
    />
  );
}
