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

  const { hex } = color || { hex: '#FF4A1C' };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative z-10 p-12">
      {/* Esta vista está vacía intencionalmente para disfrutar del FondoAmbiente sincronizado. */}
      {/* Solo agregamos un sutil título flotante de la canción en el centro */}
      <div className="text-center mt-auto mb-16 opacity-70 hover:opacity-100 transition-opacity duration-700">
        <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter mb-2" style={{ textShadow: `0 0 40px ${hex}` }}>
          {cancionActual.titulo}
        </h2>
        <p className="text-lg md:text-2xl text-white/60 tracking-wide font-light">
          {cancionActual.artista}
        </p>
      </div>
    </div>
  );
}
