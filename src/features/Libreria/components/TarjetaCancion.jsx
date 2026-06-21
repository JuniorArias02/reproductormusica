import { Play, Pause } from 'lucide-react';
import { cn } from '../../../utils/clases';
import { useReproductor } from '../../Player/context/ContextoReproductor';

export function TarjetaCancion({ cancion }) {
  const { cargarCancion, cancionActual, estaReproduciendo, alternarReproduccion } = useReproductor();
  const esActiva = cancionActual?.id === cancion.id;

  const manejarClick = () => {
    if (esActiva) {
      alternarReproduccion();
    } else {
      cargarCancion(cancion);
    }
  };

  return (
    <div 
      className={cn(
        "group flex flex-col gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer",
        esActiva && "bg-white/5 shadow-[0_0_15px_rgba(255,74,28,0.05)]"
      )}
      onClick={manejarClick}
    >
      {/* Contenedor del cover simulado estilo Apple Music/Vinyl */}
      <div className={cn(
        "relative aspect-square w-full rounded-lg overflow-hidden bg-superficie border transition-all",
        esActiva ? "border-acento-primario shadow-[0_0_20px_rgba(255,74,28,0.2)]" : "border-white/5 shadow-lg group-hover:shadow-[0_0_20px_rgba(255,74,28,0.15)]"
      )}>
        
        {/* Placeholder para cuando no hay portada */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1A1A1E] to-[#0A0A0C]">
          <div className={cn(
            "w-1/2 h-1/2 rounded-full border-4 border-[#2A2A2E] flex items-center justify-center opacity-30 transition-transform duration-500",
            esActiva && estaReproduciendo ? "animate-[spin_4s_linear_infinite]" : "group-hover:rotate-12"
          )}>
            <div className="w-4 h-4 rounded-full bg-[#2A2A2E]"></div>
          </div>
        </div>

        {/* Capa de hover con botón Play */}
        <div className={cn(
          "absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] transition-opacity",
          esActiva ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <button className="w-12 h-12 rounded-full bg-acento-primario text-white flex items-center justify-center shadow-[0_0_15px_rgba(255,74,28,0.5)] transform scale-90 group-hover:scale-100 transition-all hover:bg-[#FF5A30]">
            {esActiva && estaReproduciendo ? (
              <Pause fill="currentColor" size={20} />
            ) : (
              <Play fill="currentColor" size={20} className="ml-1" />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <h4 className={cn("font-semibold text-sm truncate", esActiva ? "text-acento-primario" : "text-texto-principal")} title={cancion.titulo}>
          {cancion.titulo}
        </h4>
        <span className="text-xs text-texto-secundario truncate" title={cancion.artista}>
          {cancion.artista}
        </span>
      </div>
    </div>
  );
}
