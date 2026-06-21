import { useState, useRef, useCallback } from 'react';
import { PanelNowPlaying } from '../../Player/components/PanelNowPlaying';
import { SistemaParticulas } from '../../Player/components/SistemaParticulas';
import { useReproductor } from '../../Player/context/ContextoReproductor';
import { Play, Pause, Music2, Heart } from 'lucide-react';
import { cn } from '../../../utils/clases';

// ─── Leer archivos del directorio media con Vite Glob ───────────
const modulosArchivos = import.meta.glob('../../../assets/media/*.{mp3,mp4}', { eager: true });

const extraerTitulo = (nombre) => {
  const sinExt = nombre.replace(/\.[^/.]+$/, '');
  return sinExt.charAt(0).toUpperCase() + sinExt.slice(1);
};

const canciones = Object.keys(modulosArchivos).map((ruta, index) => {
  const nombreArchivo = ruta.split('/').pop();
  return {
    id: index.toString(),
    titulo: extraerTitulo(nombreArchivo),
    artista: 'Artista Local',
    archivo: modulosArchivos[ruta].default,
    esVideo: nombreArchivo.endsWith('.mp4'),
  };
});

export function Inicio() {
  const { cargarCancion, cancionActual, estaReproduciendo, alternarReproduccion, color } = useReproductor();
  const [modoExpandido, setModoExpandido] = useState(false);
  const refParticulas = useRef(null);

  const seleccionarCancion = useCallback((cancion, evento) => {
    const rect = evento.currentTarget.getBoundingClientRect();
    const origenX = rect.left + rect.width / 2;
    const origenY = rect.top + rect.height / 2;

    // Disparar partículas con el color actual de la canción seleccionada
    refParticulas.current?.disparar({
      x: origenX,
      y: origenY,
      color: color ?? { r: 255, g: 74, b: 28 },
    });

    setTimeout(() => {
      if (cancionActual?.id === cancion.id) {
        alternarReproduccion();
      } else {
        cargarCancion(cancion);
      }
      setModoExpandido(true);
    }, 280);
  }, [cancionActual, cargarCancion, alternarReproduccion, color]);

  const cerrarPanel = useCallback(() => {
    setModoExpandido(false);
  }, []);

  return (
    <div className="relative h-full flex overflow-hidden">

      {/* Motor de partículas Canvas (120fps, montado una vez) */}
      <SistemaParticulas ref={refParticulas} />

      {/* ── Panel izquierdo: lista de canciones ──────────────────── */}
      <div className={cn(
        "flex flex-col transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden h-full",
        modoExpandido ? "lista-compacta w-[45%] border-r border-white/5" : "w-full"
      )}>
        {/* Cabecera */}
        <div className={cn(
          "flex-shrink-0 transition-all duration-500",
          modoExpandido ? "px-4 pt-4 pb-3" : "px-1 pt-0 pb-6"
        )}>
          {modoExpandido ? (
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-texto-secundario uppercase tracking-widest">Canciones</h3>
              <button
                onClick={cerrarPanel}
                className="text-xs text-texto-secundario hover:text-texto-principal transition-colors px-2 py-1 rounded border border-white/10 hover:border-white/20"
              >
                ✕ Cerrar
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-1">Escuchar ahora</h2>
              <p className="text-texto-secundario text-sm">Tu colección personal de música.</p>
            </>
          )}
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {modoExpandido ? (
            // ── Vista compacta (rows) ──────────────────────────────
            <div className="flex flex-col gap-0.5 px-2 pb-4">
              {canciones.map((cancion, index) => {
                const esActiva = cancionActual?.id === cancion.id;
                const colorHex = esActiva ? (color?.hex ?? '#FF4A1C') : null;
                return (
                  <button
                    key={cancion.id}
                    className={cn(
                      "fila-cancion flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-all group",
                      esActiva ? "border" : "hover:bg-white/5 border border-transparent"
                    )}
                    style={esActiva ? {
                      background: `rgba(${color?.r ?? 255},${color?.g ?? 74},${color?.b ?? 28},0.12)`,
                      borderColor: `rgba(${color?.r ?? 255},${color?.g ?? 74},${color?.b ?? 28},0.35)`,
                    } : {}}
                    onClick={(e) => seleccionarCancion(cancion, e)}
                    
                  >
                    {/* Número / mini-equalizer */}
                    <div className="w-6 text-center flex-shrink-0">
                      {esActiva && estaReproduciendo ? (
                        <div className="flex items-end justify-center gap-[2px] h-4">
                          {[0, 0.1, 0.2].map((d, i) => (
                            <div
                              key={i}
                              className="w-[3px] rounded-full"
                              style={{
                                background: colorHex ?? '#FF4A1C',
                                animationName: 'visualBar1',
                                animationDuration: `${0.6 + i * 0.15}s`,
                                animationDelay: `${d}s`,
                                animationIterationCount: 'infinite',
                                animationTimingFunction: 'ease-in-out',
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className={cn("text-xs", esActiva ? "font-bold" : "text-texto-secundario")}
                          style={esActiva ? { color: colorHex } : {}}
                        >
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Ícono tipo */}
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: esActiva ? `rgba(${color?.r ?? 255},${color?.g ?? 74},${color?.b ?? 28},0.2)` : 'rgba(255,255,255,0.05)' }}
                    >
                      <Music2 size={14} style={{ color: esActiva ? colorHex : '#A1A1AA' }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: esActiva ? colorHex : '#F4F4F5' }}>
                        {cancion.titulo}
                      </p>
                      <p className="text-xs text-texto-secundario truncate">{cancion.artista}</p>
                    </div>

                    {/* Tag */}
                    <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-texto-secundario uppercase">
                      {cancion.esVideo ? 'mp4' : 'mp3'}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            // ── Vista grid (home) ─────────────────────────────────
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5 pb-8">
              {canciones.map((cancion, index) => (
                <TarjetaHomeCancion
                  key={cancion.id}
                  cancion={cancion}
                  index={index}
                  onSeleccionar={seleccionarCancion}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Panel derecho: Now Playing ───────────────────────────── */}
      {modoExpandido && cancionActual && (
        <div className="flex-1 h-full overflow-hidden">
          <PanelNowPlaying cancion={cancionActual} />
        </div>
      )}
    </div>
  );
}

/* ─── Tarjeta visual del grid en Home ─────────────────────────── */
function TarjetaHomeCancion({ cancion, index, onSeleccionar }) {
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

        {/* Surcos de vinilo */}
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
          <div className="absolute bottom-2 left-2 right-2 flex items-end gap-[2px] h-5">
            {[0, 0.1, 0.05, 0.2, 0.15].map((d, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-full"
                style={{
                  background: `rgba(${colorR},${colorG},${colorB},0.7)`,
                  animationName: `visualBar${(i % 7) + 1}`,
                  animationDuration: `${0.5 + i * 0.1}s`,
                  animationDelay: `${d}s`,
                  animationIterationCount: 'infinite',
                  animationTimingFunction: 'ease-in-out',
                }}
              />
            ))}
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
