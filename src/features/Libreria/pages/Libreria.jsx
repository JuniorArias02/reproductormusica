import { useReproductor } from '../../Player/context/ContextoReproductor';
import { Play, Pause, Heart, Clock, Music } from 'lucide-react';
import { cn } from '../../../utils/clases';

export function Libreria() {
  const { 
    listaCanciones, 
    cancionActual, 
    estaReproduciendo, 
    cargarCancion, 
    alternarReproduccion, 
    color, 
    estaEnLiked, 
    alternarLike,
    importarCancionesLocales
  } = useReproductor();

  const colorHex = color?.hex ?? '#FF4A1C';
  const colorR = color?.r ?? 255;
  const colorG = color?.g ?? 74;
  const colorB = color?.b ?? 28;

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto w-full relative z-10 custom-scrollbar">
      {/* Cabecera inmersiva */}
      <div className="mb-8 relative z-10 flex items-end gap-6">
        <div 
          className="w-40 h-40 rounded-2xl flex-shrink-0 shadow-2xl flex items-center justify-center overflow-hidden relative"
          style={{ 
            background: `linear-gradient(135deg, ${colorHex}, rgba(${colorR},${colorG},${colorB},0.4))`,
            boxShadow: `0 20px 40px rgba(${colorR},${colorG},${colorB},0.3)`
          }}
        >
          <div className="absolute inset-0 bg-black/20" />
          <Heart size={64} className="text-white relative z-10 drop-shadow-md" fill="white" />
        </div>
        
        <div className="flex flex-col pb-2">
          <span className="uppercase tracking-widest text-xs font-bold text-texto-secundario mb-2">Playlist</span>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-4 drop-shadow-lg">Tu Librería</h1>
          
          <div className="flex items-center gap-6 mt-2">
            <p className="text-texto-secundario text-sm font-medium">
              <span className="text-white">{listaCanciones?.length || 0} canciones</span> locales
            </p>

            <label className="cursor-pointer group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
              <div className="w-6 h-6 rounded-full bg-acento-primario flex items-center justify-center text-white">
                <Music size={12} />
              </div>
              <span className="text-sm font-semibold text-white">Importar archivos</span>
              <input 
                type="file" 
                multiple 
                accept="audio/*,video/mp4" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    importarCancionesLocales(Array.from(e.target.files));
                    // Limpiar el input para permitir volver a subir el mismo archivo si es necesario
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Tabla de canciones */}
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
          {listaCanciones?.map((cancion, index) => {
            const esActiva = cancionActual?.id === cancion.id;
            const liked = estaEnLiked(cancion.id);

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
                    ) : cancion.esVideo ? (
                      <video src={cancion.archivo} className="w-full h-full object-cover opacity-60" muted autoPlay loop playsInline />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 border border-zinc-700/30">
                        <Music size={16} className="text-zinc-500" />
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
                    onClick={(e) => { e.stopPropagation(); alternarLike(cancion.id); }}
                    className={cn(
                      "hover:scale-110 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100",
                      liked && "opacity-100"
                    )}
                  >
                    <Heart size={16} fill={liked ? colorHex : 'none'} style={{ color: liked ? colorHex : '#A1A1AA' }} />
                  </button>
                  <span className="text-xs font-medium text-texto-secundario tabular-nums">--:--</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
