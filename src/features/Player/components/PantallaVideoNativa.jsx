import { useEffect, useRef } from 'react';

/**
 * Componente que monta físicamente el elemento nativo <video> del AudioService
 * dentro del árbol DOM de React para aprovechar la aceleración por hardware (GPU)
 * del navegador, eliminando la sobrecarga de Canvas y requestAnimationFrame.
 */
export function PantallaVideoNativa({ videoElement, className, style }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !videoElement) return;

    // Guardar estilos originales para restaurarlos al desmontar
    const prevDisplay = videoElement.style.display;
    const prevClass = videoElement.className;

    // Aplicar estilos de la UI de React al elemento nativo
    videoElement.style.display = 'block';
    videoElement.className = className || '';

    // Montar en el DOM visual
    container.appendChild(videoElement);

    return () => {
      // Limpiar al desmontar (ej: el usuario cerró el panel o cambió a canción de solo audio)
      videoElement.style.display = 'none'; // prevDisplay era 'none'
      videoElement.className = prevClass || '';
      if (videoElement.parentNode === container) {
        container.removeChild(videoElement);
      }
    };
  }, [videoElement, className]);

  return <div ref={containerRef} className="w-full h-full relative" style={style} />;
}
