import { useEffect } from 'react';

/**
 * Hook para manejar los atajos de teclado globales de la aplicación.
 * Aislado por Regla #3 (Clean Architecture).
 * 
 * @param {Object} reproductor - Estado y métodos del contexto del reproductor
 */
export function useShortcutsTeclado(reproductor) {
  useEffect(() => {
    const manejarTeclado = (evento) => {
      // Ignorar si el usuario está escribiendo en un input o textarea
      if (['INPUT', 'TEXTAREA'].includes(evento.target.tagName)) return;

      switch (evento.code) {
        case 'Space':
          evento.preventDefault(); // Evitar scroll de la página
          reproductor.alternarReproduccion();
          break;
        case 'ArrowRight':
          evento.preventDefault();
          reproductor.cambiarTiempo(Math.min(reproductor.duracion, reproductor.progreso + 10));
          break;
        case 'ArrowLeft':
          evento.preventDefault();
          reproductor.cambiarTiempo(Math.max(0, reproductor.progreso - 10));
          break;
        case 'ArrowUp':
          evento.preventDefault();
          reproductor.cambiarVolumen(Math.min(1, reproductor.volumen + 0.1));
          break;
        case 'ArrowDown':
          evento.preventDefault();
          reproductor.cambiarVolumen(Math.max(0, reproductor.volumen - 0.1));
          break;
        case 'KeyM':
          evento.preventDefault();
          // Lógica simple de mute (si el volumen es > 0, guardar y poner a 0, si no, restaurar a 1)
          reproductor.cambiarVolumen(reproductor.volumen > 0 ? 0 : 1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', manejarTeclado);
    return () => window.removeEventListener('keydown', manejarTeclado);
  }, [reproductor]);
}
