import { Play, Pause, SkipBack, SkipForward, Heart, Shuffle, Repeat } from 'lucide-react';
import { useReproductor } from '../context/ContextoReproductor';
import { VisualizadorAudio } from './VisualizadorAudio';
import { formatearTiempo } from '../utils/formatoTiempo';
import { cn } from '../../../utils/clases';

/**
 * Panel lateral derecho "Now Playing" con diseño inmersivo y colores dinámicos.
 * El elemento <video> real vive en BarraReproductor para mantener un único ref.
 */
export function PanelNowPlaying({ cancion }) {
  const {
    estaReproduciendo,
    progreso,
    duracion,
    alternarReproduccion,
    cambiarTiempo,
    color,
    mezclando,
    repitiendo,
    siguienteCancion,
    cancionAnterior,
    alternarMezcla,
    alternarRepeticion
  } = useReproductor();

  const porcentaje = duracion ? (progreso / duracion) * 100 : 0;

  // Color dinámico de la canción (con fallback)
  const { r, g, b, hex } = color ?? { r: 255, g: 74, b: 28, hex: '#FF4A1C' };
  const rgba = (alpha) => `rgba(${r},${g},${b},${alpha})`;

  return (
    <div
      className="panel-now-playing relative flex flex-col h-full w-full overflow-hidden"
      style={{ '--color-vivo': hex, '--color-vivo-r': r, '--color-vivo-g': g, '--color-vivo-b': b }}
    >
      {/* Fondo inmersivo con color dinámico */}
      <div
        className="absolute inset-0 z-0 transition-all duration-1000"
        style={{ background: `linear-gradient(135deg, rgba(${r},${g},${b},0.18) 0%, #0A0A0C 50%, rgba(0,240,255,0.06) 100%)` }}
      />

      {/* Blob de color animado arriba */}
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl z-0 transition-all duration-1000 glow-pulse"
        style={{ background: rgba(0.22) }}
      />

      {/* Blob de color animado abajo */}
      <div
        className="absolute -bottom-20 -left-10 w-60 h-60 rounded-full blur-3xl z-0 transition-all duration-1000"
        style={{ background: `rgba(0,240,255,0.07)` }}
      />

      {/* Cuadrícula decorativa */}
      <div
        className="absolute inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(${hex} 1px, transparent 1px), linear-gradient(90deg, ${hex} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full p-8 gap-5">

        {/* Etiqueta "Now Playing" */}
        <div className="text-reveal-1 flex items-center gap-2 self-start">
          <div className="w-2 h-2 rounded-full" style={{ background: hex, boxShadow: `0 0 8px ${hex}` }} />
          <span className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: hex }}>Now Playing</span>
          <span className="w-16 h-px" style={{ background: `linear-gradient(to right, ${hex}, transparent)` }} />
        </div>

        {/* Disco Vinilo 3D */}
        <div className="text-reveal-2 relative flex-shrink-0">
          {/* Glow exterior */}
          <div
            className={cn(
              "absolute inset-0 rounded-full blur-3xl transition-all duration-1000",
              estaReproduciendo ? "scale-125" : "scale-100"
            )}
            style={{ background: rgba(estaReproduciendo ? 0.35 : 0.12) }}
          />

          {/* Aro exterior decorativo */}
          <div
            className="absolute -inset-3 rounded-full border opacity-30"
            style={{ borderColor: hex }}
          />
          <div
            className="absolute -inset-6 rounded-full border opacity-10"
            style={{ borderColor: hex }}
          />

          {/* Disco principal */}
          <div
            className={cn(
              "relative w-52 h-52 rounded-full shadow-2xl overflow-hidden",
              estaReproduciendo && "vinil-girar"
            )}
            style={{
              border: `4px solid rgba(${r},${g},${b},0.4)`,
              boxShadow: `0 0 0 8px #1A1A1E, 0 0 0 10px ${rgba(0.2)}, 0 0 40px ${rgba(0.3)}`,
            }}
          >
            {/* Surcos concéntricos */}
            {[40, 50, 60, 70, 80, 90].map((v) => (
              <div
                key={v}
                className="absolute rounded-full"
                style={{ inset: `${v / 2}px`, border: `1px solid rgba(${r},${g},${b},0.08)` }}
              />
            ))}

            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />

            {/* Portada: video o imagen */}
            {cancion?.esVideo ? (
              <video
                src={cancion?.archivo}
                className="absolute inset-0 w-full h-full object-cover opacity-80"
                muted autoPlay loop playsInline
              />
            ) : cancion?.portada ? (
              <img src={cancion.portada} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="Cover" />
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: `radial-gradient(circle at 30% 30%, ${rgba(0.4)}, rgba(0,240,255,0.1) 70%, transparent)` }}
              />
            )}

            {/* Overlay con surcos */}
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: 'radial-gradient(circle, transparent 28%, rgba(0,0,0,0.45) 68%, rgba(0,0,0,0.75) 100%)' }}
            />
          </div>

          {/* Centro del disco */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 bg-zinc-900 flex items-center justify-center shadow-lg z-10"
            style={{ borderColor: rgba(0.5) }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: rgba(0.8), boxShadow: `0 0 6px ${hex}` }}
            />
          </div>
        </div>

        {/* Metadatos */}
        <div className="text-reveal-3 text-center w-full">
          <h2 className="text-2xl font-bold text-texto-principal tracking-tight truncate">{cancion?.titulo}</h2>
          <p className="text-sm mt-1 transition-colors duration-700" style={{ color: rgba(0.8) }}>{cancion?.artista}</p>
        </div>

        {/* Visualizador */}
        <div className="text-reveal-3 w-full">
          <VisualizadorAudio estaReproduciendo={estaReproduciendo} colorPrimario={hex} />
        </div>

        {/* Progreso */}
        <div className="text-reveal-4 w-full">
          <div
            className="relative h-1.5 bg-white/8 rounded-full cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              cambiarTiempo(((e.clientX - rect.left) / rect.width) * duracion);
            }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all"
              style={{
                width: `${porcentaje}%`,
                background: `linear-gradient(to right, ${hex}, rgba(0,240,255,0.8))`,
              }}
            >
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ boxShadow: `0 0 8px ${hex}` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-texto-secundario mt-1.5">
            <span>{formatearTiempo(progreso)}</span>
            <span>{formatearTiempo(duracion)}</span>
          </div>
        </div>

        {/* Controles */}
        <div className="text-reveal-4 flex items-center gap-6">
          <button 
            onClick={alternarMezcla}
            className="transition-all hover:scale-110 active:scale-95" 
            title="Mezclar"
          >
            <Shuffle 
              size={18} 
              style={{
                color: mezclando ? hex : '#A1A1AA',
                filter: mezclando ? `drop-shadow(0 0 5px ${hex})` : 'none',
              }}
            />
          </button>
          
          <button 
            onClick={cancionAnterior}
            className="text-texto-secundario hover:text-texto-principal transition-all hover:scale-110 active:scale-95"
            title="Anterior"
          >
            <SkipBack size={22} />
          </button>

          <button
            onClick={alternarReproduccion}
            className="w-14 h-14 rounded-full text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
            style={{
              background: `linear-gradient(135deg, ${hex}, rgba(${r},${g},${b},0.7))`,
              boxShadow: `0 0 30px ${rgba(0.5)}`,
            }}
          >
            {estaReproduciendo
              ? <Pause fill="currentColor" size={22} />
              : <Play fill="currentColor" size={22} className="ml-1" />
            }
          </button>

          <button 
            onClick={siguienteCancion}
            className="text-texto-secundario hover:text-texto-principal transition-all hover:scale-110 active:scale-95"
            title="Siguiente"
          >
            <SkipForward size={22} />
          </button>
          
          <button 
            onClick={alternarRepeticion}
            className="transition-all hover:scale-110 active:scale-95" 
            title="Repetir"
          >
            <Repeat 
              size={18} 
              style={{
                color: repitiendo ? hex : '#A1A1AA',
                filter: repitiendo ? `drop-shadow(0 0 5px ${hex})` : 'none',
              }}
            />
          </button>
        </div>

      </div>
    </div>
  );
}
