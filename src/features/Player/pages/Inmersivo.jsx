import { useReproductor } from '../context/ContextoReproductor';

export function Inmersivo() {
  const { cancionActual, color } = useReproductor();

  if (!cancionActual) {
    return (
      <div className="w-full h-full flex items-center justify-center relative z-10">
        <p className="text-white/50 tracking-widest text-sm uppercase">Selecciona una pista para iniciar</p>
      </div>
    );
  }

  const handleMouseMove = (e) => {
    window.__VISUALIZER_MOUSE__ = window.__VISUALIZER_MOUSE__ || {};
    window.__VISUALIZER_MOUSE__.x = e.clientX;
    window.__VISUALIZER_MOUSE__.y = e.clientY;
    window.__VISUALIZER_MOUSE__.active = true;
  };

  const handleMouseDown = (e) => {
    window.__VISUALIZER_MOUSE__ = window.__VISUALIZER_MOUSE__ || {};
    window.__VISUALIZER_MOUSE__.x = e.clientX;
    window.__VISUALIZER_MOUSE__.y = e.clientY;
    window.__VISUALIZER_MOUSE__.down = true;
  };

  const handleMouseUp = (e) => {
    window.__VISUALIZER_MOUSE__ = window.__VISUALIZER_MOUSE__ || {};
    window.__VISUALIZER_MOUSE__.down = false;
    window.__VISUALIZER_MOUSE__.release = true;
  };

  const handleMouseLeave = () => {
    if (window.__VISUALIZER_MOUSE__) {
      window.__VISUALIZER_MOUSE__.active = false;
      window.__VISUALIZER_MOUSE__.down = false;
      window.__VISUALIZER_MOUSE__.release = true; // Trigger if they leave while holding
    }
  };

  return (
    <div 
      className="w-full h-full cursor-crosshair" 
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
} 