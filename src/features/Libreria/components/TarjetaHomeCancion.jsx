import { Play, Pause, Heart } from 'lucide-react';
import { cn } from '../../../utils/clases';
import { useReproductor } from '../../Player/context/ContextoReproductor';
import { MiniVisualizador } from '../../Player/components/MiniVisualizador';

export function TarjetaHomeCancion({ cancion, index, onSeleccionar }) {
  const { cancionActual, estaReproduciendo, color, alternarLike, estaEnLiked } = useReproductor();
  const esActiva = cancionActual?.id === cancion.id;
  const colorHex = esActiva ? (color?.hex ?? '#FF4A1C') : '#FF4A1C';
  const colorR = esActiva ? (color?.r ?? 255) : 255;
  const colorG = esActiva ? (color?.g ?? 74) : 74;
  const colorB = esActiva ? (color?.b ?? 28) : 28;
  const liked = estaEnLiked(cancion.id);

  return (
    <div
      className={cn(
        "group flex flex-col gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1",
        esActiva
          ? "border"
          : "hover:bg-white/5 border border-transparent hover:border-white/8"
      )}
      style={esActiva ? {
        background: `linear-gradient(to bottom, rgba(${colorR},${colorG},${colorB},0.1), transparent)`,
        borderColor: `rgba(${colorR},${colorG},${colorB},0.25)`,
        boxShadow: `0 8px 30px rgba(${colorR},${colorG},${colorB},0.15)`,
      } : {}}
      onClick={(e) => onSeleccionar(cancion, e)}
    >
      {/* Cover */}
      <div
        className={cn(
          "relative aspect-square w-full rounded-xl overflow-hidden transition-all duration-300 shadow-lg"
        )}
        style={esActiva ? { boxShadow: `0 0 30px rgba(${colorR},${colorG},${colorB},0.3)` } : {}}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#1C1C20] to-[#0A0A0C]" />

        {/* Portada o Surcos de vinilo */}
        {cancion.portada ? (
          <img src={cancion.portada} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity" alt="Cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              "w-4/5 h-4/5 rounded-full border border-zinc-700/30 transition-all duration-700",
              esActiva && estaReproduciendo ? "animate-[spin_8s_linear_infinite]" : "group-hover:scale-105"
            )}>
              <div className="w-full h-full rounded-full border border-zinc-700/20 flex items-center justify-center">
                <div className="w-3/5 h-3/5 rounded-full border border-zinc-700/20 flex items-center justify-center">
                  <div className="w-1/3 h-1/3 rounded-full bg-zinc-700/40 border border-zinc-600/40" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Capa de color del tipo de archivo */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background: cancion.esVideo
              ? `linear-gradient(135deg, rgba(${colorR},${colorG},${colorB},0.8), transparent)`
              : 'linear-gradient(135deg, rgba(0,240,255,0.5), transparent)',
          }}
        />

        {/* Overlay Play */}
        <div className={cn(
          "absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px] transition-all duration-200",
          esActiva ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transform transition-all duration-200 bg-white text-fondo shadow-2xl",
            esActiva ? "scale-100" : "scale-75 group-hover:scale-100"
          )}>
            {esActiva && estaReproduciendo
              ? <Pause fill="currentColor" size={18} />
              : <Play fill="currentColor" size={18} className="ml-0.5" />
            }
          </div>
        </div>

        {/* Badge tipo */}
        <div className="absolute top-2 right-2">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide border"
            style={esActiva ? {
              background: `rgba(${colorR},${colorG},${colorB},0.2)`,
              color: colorHex,
              borderColor: `rgba(${colorR},${colorG},${colorB},0.4)`,
            } : {
              background: cancion.esVideo ? 'rgba(255,74,28,0.15)' : 'rgba(0,240,255,0.15)',
              color: cancion.esVideo ? '#FF4A1C' : '#00F0FF',
              borderColor: cancion.esVideo ? 'rgba(255,74,28,0.3)' : 'rgba(0,240,255,0.3)',
            }}
          >
            {cancion.esVideo ? 'MP4' : 'MP3'}
          </span>
        </div>

        {/* Mini-equalizer activo */}
        {esActiva && estaReproduciendo && (
          <div className="absolute bottom-2 left-2 right-2 flex items-end h-5 overflow-hidden">
            <MiniVisualizador colorPrimario={`rgba(${colorR},${colorG},${colorB},0.9)`} barras={6} ancho={12} gap={2} alto={20} />
          </div>
        )}
      </div>

      {/* Texto + like */}
      <div className="flex items-start justify-between gap-1 px-0.5">
        <div className="flex flex-col min-w-0">
          <span
            className="text-sm font-semibold truncate leading-tight transition-colors duration-500"
            style={{ color: esActiva ? colorHex : '#F4F4F5' }}
          >
            {cancion.titulo}
          </span>
          <span className="text-xs text-texto-secundario mt-0.5 truncate">
            {cancion.artista}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); alternarLike(cancion.id); }}
          className="flex-shrink-0 mt-0.5 transition-all duration-200 hover:scale-125 active:scale-95"
        >
          <Heart
            size={14}
            fill={liked ? colorHex : 'none'}
            style={{ color: liked ? colorHex : '#52525B', filter: liked ? `drop-shadow(0 0 4px ${colorHex})` : 'none' }}
          />
        </button>
      </div>
    </div>
  );
}
