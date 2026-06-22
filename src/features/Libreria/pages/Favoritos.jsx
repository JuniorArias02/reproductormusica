import { useReproductor } from '../../Player/context/ContextoReproductor';
import { Play, Pause, Heart, Clock, Music, Film } from 'lucide-react';
import { cn } from '../../../utils/clases';
import { formatearTiempo } from '../../Player/utils/formatoTiempo';

export function Favoritos() {
  const { 
    listaCanciones, 
    cancionActual, 
    estaReproduciendo, 
    cargarCancion, 
    alternarReproduccion, 
    color, 
    estaEnLiked, 
    alternarLike
  } = useReproductor();

  const colorHex = color?.hex ?? '#FF4A1C';
  const colorR = color?.r ?? 255;
  const colorG = color?.g ?? 74;
  const colorB = color?.b ?? 28;

  // Filtrar solo las canciones que tienen el corazón marcado
  const cancionesFavoritas = listaCanciones?.filter(cancion => estaEnLiked(cancion.id)) || [];

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto w-full relative z-10 custom-scrollbar">
      {/* Cabecera inmersiva estática de Liked Songs */}
      <div className="mb-8 relative z-10 flex items-end gap-6">
        <div 
          className="w-40 h-40 rounded-2xl flex-shrink-0 shadow-2xl flex items-center justify-center overflow-hidden relative"
          style={{ 
            background: `linear-gradient(135deg, #6b21a8, #c026d3)`, // Morado clásico de favoritos
            boxShadow: `0 20px 40px rgba(192, 38, 211, 0.3)`
          }}
        >
          <div className="absolute inset-0 bg-black/10" />
          <Heart size={64} className="text-white relative z-10 drop-shadow-md" fill="white" />
        </div>
        
        <div className="flex flex-col pb-2">
          <span className="uppercase tracking-widest text-xs font-bold text-texto-secundario mb-2">Playlist Privada</span>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-4 drop-shadow-lg">Tus Me Gusta</h1>
          
          <div className="flex items-center gap-6 mt-2">
            <p className="text-texto-secundario text-sm font-medium">
              <span className="text-white">{cancionesFavoritas.length} canciones</span> guardadas
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de canciones */}
      {cancionesFavoritas.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 mt-10">
           <Heart size={48} className="mb-4 text-white/50" />
           <h3 className="text-xl font-bold mb-2 text-white">No tienes canciones favoritas aún</h3>
           <p className="text-sm text-white/60">Toca el corazón en cualquier canción para guardarla aquí.</p>
        </div>
      ) : (
        <div className="w-full relative z-10 bg-black/20 rounded-2xl backdrop-blur-xl border border-white/5 p-2">
          {/* Cabecera Tabla */}
          <div className="grid grid-cols-[32px_minmax(200px,2fr)_1fr_80px] gap-4 px-4 py-3 text-texto-secundario text-[11px] uppercase tracking-widest border-b border-white/5 mb-2">
            <div className="text-center">#</div>
            <div>Título</div>
            <div>Formato</div>
            <div className="flex justify-end"><Clock size={14} /></div>
          </div>

          {/* Lista */}
          <div className="flex flex-col pb-24">
            {cancionesFavoritas.map((cancion, index) => {
              const esActiva = cancionActual?.id === cancion.id;
              // Siempre son favoritas en esta vista
              const liked = true; 

              return (
                <div 
                  key={cancion.id}
                  className={cn(
                    "group grid grid-cols-[32px_minmax(200px,2fr)_1fr_80px] items-center gap-4 px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer hover:bg-white/10",
                    esActiva && "bg-white/5"
                  )}
                  onClick={() => {
                    if (esActiva) alternarReproduccion();
                    else cargarCancion(cancion);
                  }}
                >
                  {/* Número / Play */}
                  <div className="w-full flex justify-center text-sm font-medium text-texto-secundario">
                    <div className={cn("hidden group-hover:flex items-center justify-center text-white", esActiva && "flex")}>
                      {esActiva && estaReproduciendo ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                    </div>
                    <span className={cn(
                      "group-hover:hidden transition-colors", 
                      esActiva && "hidden", 
                      esActiva && "text-acento-primario"
                    )}
                    style={esActiva ? { color: colorHex } : {}}
                    >
                      {index + 1}
                    </span>
                  </div>

                  {/* Título & Portada */}
                  <div className="flex items-center gap-4 overflow-hidden py-1">
                    <div className={cn(
                      "w-11 h-11 rounded-md overflow-hidden flex-shrink-0 bg-zinc-800 relative transition-transform duration-300 group-hover:scale-105",
                      esActiva && "shadow-lg"
                    )}
                    style={esActiva ? { boxShadow: `0 0 15px rgba(${colorR},${colorG},${colorB},0.4)` } : {}}
                    >
                      {cancion.portada ? (
                        <img src={cancion.portada} className="w-full h-full object-cover" alt="cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 border border-zinc-700/30">
                          {cancion.esVideo ? <Film size={16} className="text-zinc-500" /> : <Music size={16} className="text-zinc-500" />}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 justify-center">
                      <span className={cn(
                        "text-[15px] font-semibold truncate transition-colors leading-tight", 
                        esActiva ? "text-texto-principal" : "text-texto-principal group-hover:text-white"
                      )}
                      style={esActiva ? { color: colorHex } : {}}
                      >
                        {cancion.titulo}
                      </span>
                      <span className="text-xs text-texto-secundario truncate mt-0.5">{cancion.artista}</span>
                    </div>
                  </div>

                  {/* Formato */}
                  <div className="text-xs font-medium text-texto-secundario/80">
                    {cancion.esVideo ? (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800/50 border border-zinc-700/50">MP4 Video</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800/50 border border-zinc-700/50">MP3 Audio</span>
                    )}
                  </div>

                  {/* Like & Actions */}
                  <div className="flex items-center justify-end gap-4 pr-2">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        alternarLike(cancion.id); 
                      }}
                      className="hover:scale-110 transition-all opacity-100 focus:opacity-100"
                    >
                      <Heart size={16} fill={colorHex} style={{ color: colorHex }} />
                    </button>
                    <span className="text-xs font-medium text-texto-secundario tabular-nums">
                      {cancion.duracion ? formatearTiempo(cancion.duracion) : '--:--'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
