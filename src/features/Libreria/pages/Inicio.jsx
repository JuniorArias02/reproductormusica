import { useCallback } from 'react';
import { useReproductor } from '../../Player/context/ContextoReproductor';
import { Music2 } from 'lucide-react';
import { cn } from '../../../utils/clases';
import { TarjetaHomeCancion } from '../components/TarjetaHomeCancion';
import { MiniVisualizador } from '../../Player/components/MiniVisualizador';

export function Inicio() {
  const { 
    cargarCancion, 
    cancionActual, 
    estaReproduciendo, 
    alternarReproduccion, 
    color, 
    listaCanciones,
    panelExpandido,
    abrirPanel,
    cerrarPanel
  } = useReproductor();

  // Si no hay canciones cargadas aún, mostramos un estado vacío
  if (!listaCanciones) return null;

  const seleccionarCancion = useCallback((cancion, _evento) => {
    if (cancionActual?.id === cancion.id) {
      alternarReproduccion();
    } else {
      cargarCancion(cancion);
    }
    abrirPanel();
  }, [cancionActual, cargarCancion, alternarReproduccion, abrirPanel]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden p-6">
      
      {/* Cabecera dinámica dependiendo de si el panel está abierto */}
      <div className={cn(
        "flex-shrink-0 transition-all duration-500",
        panelExpandido ? "pb-4" : "pb-6"
      )}>
        {panelExpandido ? (
          <div className="flex items-center justify-between pr-4">
            <h3 className="text-sm font-bold text-texto-secundario uppercase tracking-widest">Canciones</h3>
            <button
              onClick={cerrarPanel}
              className="text-xs text-texto-secundario hover:text-texto-principal transition-colors px-2 py-1 rounded border border-white/10 hover:border-white/20 active:scale-95"
            >
              ✕ Cerrar
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-1 tracking-tight">Escuchar ahora</h2>
            <p className="text-texto-secundario text-sm font-medium">Tu colección personal de música.</p>
          </>
        )}
      </div>

      {/* Área scrolleable */}
      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
        {panelExpandido ? (
          // ── Vista compacta (rows) ──────────────────────────────
          <div className="flex flex-col gap-1 pb-4">
            {listaCanciones.map((cancion, index) => {
              const esActiva = cancionActual?.id === cancion.id;
              const colorHex = esActiva ? (color?.hex ?? '#FF4A1C') : null;
              return (
                <button
                  key={cancion.id}
                  className={cn(
                    "fila-cancion flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all group",
                    esActiva ? "border bg-white/5" : "hover:bg-white/5 border border-transparent"
                  )}
                  style={esActiva ? {
                    background: `rgba(${color?.r ?? 255},${color?.g ?? 74},${color?.b ?? 28},0.12)`,
                    borderColor: `rgba(${color?.r ?? 255},${color?.g ?? 74},${color?.b ?? 28},0.35)`,
                  } : {}}
                  onClick={(e) => seleccionarCancion(cancion, e)}
                >
                  {/* Número / mini-equalizer */}
                  <div className="w-6 text-center flex-shrink-0 flex justify-center">
                    {esActiva && estaReproduciendo ? (
                      <div className="h-4 flex items-end justify-center">
                         <MiniVisualizador colorPrimario={colorHex ?? '#FF4A1C'} barras={3} ancho={3} gap={2} alto={16} />
                      </div>
                    ) : (
                      <span className={cn("text-xs font-medium transition-colors", esActiva ? "font-bold" : "text-texto-secundario group-hover:text-texto-principal")}
                        style={esActiva ? { color: colorHex } : {}}
                      >
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Ícono tipo */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 transition-transform",
                      esActiva ? "scale-105" : "group-hover:scale-105"
                    )}
                    style={{ background: esActiva ? `rgba(${color?.r ?? 255},${color?.g ?? 74},${color?.b ?? 28},0.2)` : 'rgba(255,255,255,0.05)' }}
                  >
                    <Music2 size={16} style={{ color: esActiva ? colorHex : '#A1A1AA' }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-sm font-semibold truncate transition-colors leading-tight" style={{ color: esActiva ? colorHex : '#F4F4F5' }}>
                      {cancion.titulo}
                    </p>
                    <p className="text-xs text-texto-secundario truncate mt-0.5 font-medium">{cancion.artista}</p>
                  </div>

                  {/* Tag */}
                  <span className="flex-shrink-0 text-[9px] px-2 py-0.5 rounded-full bg-black/20 border border-white/5 text-texto-secundario uppercase font-bold tracking-wider">
                    {cancion.esVideo ? 'mp4' : 'mp3'}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          // ── Vista grid (home) ─────────────────────────────────
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5 pb-8">
            {listaCanciones.map((cancion, index) => (
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
  );
}
