import { Play, Pause, SkipBack, SkipForward, Shuffle, Volume2, VolumeX, Heart, Repeat } from 'lucide-react';
import { useReproductor } from '../context/ContextoReproductor';
import { formatearTiempo } from '../utils/formatoTiempo';
import { cn } from '../../../utils/clases';

/**
 * Barra de reproductor full-width que ocupa el ancho completo del layout
 * (sidebar + área de contenido). Estilo Apple Music premium.
 */
export function BarraReproductor() {
  const {
    refElemento,
    estaReproduciendo,
    progreso,
    duracion,
    cancionActual,
    volumen,
    mezclando,
    color,
    alternarReproduccion,
    cambiarTiempo,
    cambiarVolumen,
    alternarMezcla,
    alternarLike,
    estaEnLiked,
    manejarActualizacionTiempo,
    manejarMetadatosCargados,
  } = useReproductor();

  // Elemento multimedia real (siempre montado, fuera de la barra visual)
  const elementoMedia = (
    <video
      ref={refElemento}
      className="hidden"
      onTimeUpdate={manejarActualizacionTiempo}
      onLoadedMetadata={manejarMetadatosCargados}
    />
  );

  const R = color?.r ?? 255, G = color?.g ?? 74, B = color?.b ?? 28;
  const hex = color?.hex ?? '#FF4A1C';
  const rgba = (a) => `rgba(${R},${G},${B},${a})`;
  const porcentaje = duracion ? (progreso / duracion) * 100 : 0;
  const estaLiked = cancionActual ? estaEnLiked(cancionActual.id) : false;

  return (
    <>
      {elementoMedia}

      <div
        className="w-full flex-shrink-0 relative overflow-hidden transition-all duration-700"
        style={{ height: cancionActual ? '88px' : '0px' }}
      >
        {/* Fondo glassmorphic con tinte de color */}
        <div
          className="absolute inset-0 transition-all duration-1000"
          style={{
            background: `rgba(10,10,12,0.75)`,
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            borderTop: `1px solid ${rgba(0.2)}`,
          }}
        />

        {/* Línea de acento superior con color de canción */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-1000"
          style={{ background: `linear-gradient(to right, transparent, ${hex}, rgba(0,240,255,0.6), transparent)` }}
        />

        {/* Glow ambiental sutil */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-1000"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${rgba(0.06)} 0%, transparent 70%)` }}
        />

        {cancionActual && (
          <div className="relative z-10 h-full flex items-center px-6 gap-6">

            {/* ── Izquierda: Info de la canción ───────────────────── */}
            <div className="flex items-center gap-4 w-[28%] min-w-0">
              {/* Mini disco */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full border-2 flex-shrink-0 flex items-center justify-center relative overflow-hidden transition-all duration-700",
                  estaReproduciendo && "animate-girar-vinilo"
                )}
                style={{
                  borderColor: rgba(0.5),
                  boxShadow: estaReproduciendo ? `0 0 15px ${rgba(0.4)}` : 'none',
                  background: `radial-gradient(circle, ${rgba(0.3)} 0%, #1A1A1E 60%)`,
                }}
              >
                {cancionActual.esVideo ? (
                  <video src={cancionActual.archivo} className="absolute inset-0 w-full h-full object-cover opacity-70" muted autoPlay loop playsInline />
                ) : null}
                {/* Surcos */}
                <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.5) 100%)' }} />
                <div className="w-2 h-2 rounded-full bg-zinc-700 border border-zinc-600 relative z-10" />
              </div>

              {/* Texto */}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-texto-principal truncate leading-tight">
                  {cancionActual.titulo}
                </span>
                <span className="text-xs text-texto-secundario truncate">{cancionActual.artista}</span>
              </div>

              {/* Botón Like */}
              <button
                onClick={() => alternarLike(cancionActual.id)}
                className="flex-shrink-0 transition-all duration-200 hover:scale-125 active:scale-95"
                title={estaLiked ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              >
                <Heart
                  size={18}
                  className="transition-all duration-200"
                  fill={estaLiked ? hex : 'none'}
                  style={{ color: estaLiked ? hex : '#A1A1AA', filter: estaLiked ? `drop-shadow(0 0 6px ${hex})` : 'none' }}
                />
              </button>
            </div>

            {/* ── Centro: Controles ────────────────────────────────── */}
            <div className="flex flex-col items-center gap-2 flex-1 max-w-[500px] mx-auto">
              {/* Botones de control */}
              <div className="flex items-center gap-5">
                <button
                  onClick={alternarMezcla}
                  className="transition-all duration-200 hover:scale-110"
                  title="Mezclar"
                >
                  <Shuffle
                    size={17}
                    style={{
                      color: mezclando ? hex : '#A1A1AA',
                      filter: mezclando ? `drop-shadow(0 0 5px ${hex})` : 'none',
                    }}
                  />
                </button>

                <button className="text-texto-secundario hover:text-texto-principal transition-all hover:scale-110 cursor-not-allowed opacity-40">
                  <SkipBack size={20} />
                </button>

                {/* Botón Play/Pause central */}
                <button
                  onClick={alternarReproduccion}
                  className="w-11 h-11 rounded-full text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${hex} 0%, rgba(${R},${G},${B},0.7) 100%)`,
                    boxShadow: `0 0 20px ${rgba(0.45)}`,
                  }}
                >
                  {estaReproduciendo
                    ? <Pause fill="currentColor" size={19} />
                    : <Play fill="currentColor" size={19} className="ml-0.5" />
                  }
                </button>

                <button className="text-texto-secundario hover:text-texto-principal transition-all hover:scale-110 cursor-not-allowed opacity-40">
                  <SkipForward size={20} />
                </button>

                <button className="text-texto-secundario/40 cursor-not-allowed opacity-40">
                  <Repeat size={17} />
                </button>
              </div>

              {/* Barra de progreso */}
              <div className="flex items-center gap-2.5 w-full">
                <span className="text-[10px] text-texto-secundario w-9 text-right tabular-nums">
                  {formatearTiempo(progreso)}
                </span>

                <div
                  className="relative flex-1 h-1 rounded-full cursor-pointer group"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    cambiarTiempo(((e.clientX - rect.left) / rect.width) * duracion);
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100"
                    style={{
                      width: `${porcentaje}%`,
                      background: `linear-gradient(to right, ${hex}, rgba(0,240,255,0.7))`,
                    }}
                  >
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ boxShadow: `0 0 8px ${hex}` }}
                    />
                  </div>
                </div>

                <span className="text-[10px] text-texto-secundario w-9 tabular-nums">
                  {formatearTiempo(duracion)}
                </span>
              </div>
            </div>

            {/* ── Derecha: Volumen ─────────────────────────────────── */}
            <div className="flex items-center justify-end gap-3 w-[28%]">
              <button
                onClick={() => cambiarVolumen(volumen === 0 ? 1 : 0)}
                className="text-texto-secundario hover:text-texto-principal transition-colors"
              >
                {volumen === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>

              <div
                className="w-24 h-1 rounded-full cursor-pointer relative group"
                style={{ background: 'rgba(255,255,255,0.1)' }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  cambiarVolumen(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${volumen * 100}%`, background: rgba(0.8) }}
                >
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
