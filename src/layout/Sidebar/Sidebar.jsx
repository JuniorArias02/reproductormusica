import { Music, Home, Library, Settings, CloudDownload, PanelLeftClose, PanelLeftOpen, Sparkles, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/clases';
import { useReproductor } from '../../features/Player/context/ContextoReproductor';

export function Sidebar() {
  const ubicacion = useLocation();
  const { color, cancionActual, sidebarExpandido, alternarSidebar } = useReproductor();

  const colorHex = color?.hex ?? '#FF4A1C';
  const colorR = color?.r ?? 255;
  const colorG = color?.g ?? 74;
  const colorB = color?.b ?? 28;

  const enlaces = [
    { ruta: '/', icono: <Home size={20} />, etiqueta: 'Inicio' },
    { ruta: '/libreria', icono: <Library size={20} />, etiqueta: 'Librería' },
    { ruta: '/favoritos', icono: <Heart size={20} />, etiqueta: 'Tus Me Gusta' },
    { ruta: '/inmersivo', icono: <Sparkles size={20} />, etiqueta: 'Zen / Inmersivo' },
    { ruta: '/descargar', icono: <CloudDownload size={20} />, etiqueta: 'Descargar' },
    { ruta: '/ajustes', icono: <Settings size={20} />, etiqueta: 'Ajustes' },
  ];

  return (
    <aside
      className={cn(
        "h-full flex flex-col relative overflow-hidden flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        sidebarExpandido ? "w-60" : "w-[72px]"
      )}
      style={{
        background: 'rgba(10,10,12,0.55)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Glow sutil del color activo en la parte inferior del sidebar */}
      {cancionActual && (
        <div
          className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none transition-all duration-1000"
          style={{
            background: `radial-gradient(ellipse at 50% 100%, rgba(${colorR},${colorG},${colorB},0.12) 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Logo */}
      <div className={cn("p-5 flex items-center relative z-10", sidebarExpandido ? "gap-3" : "justify-center px-0")}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-1000"
          style={{
            background: `linear-gradient(135deg, ${colorHex}, rgba(0,240,255,0.8))`,
            boxShadow: `0 0 16px rgba(${colorR},${colorG},${colorB},0.5)`,
          }}
        >
          <Music size={16} className="text-white" />
        </div>
        {sidebarExpandido && <h1 className="text-lg font-bold tracking-wide text-texto-principal whitespace-nowrap">Música</h1>}
      </div>

      {/* Separador */}
      <div className="mx-4 mb-3 h-px transition-all" style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* Navegación */}
      <nav className="flex-1 px-3 space-y-2 relative z-10 mt-2">
        {enlaces.map((enlace) => {
          const estaActivo = ubicacion.pathname === enlace.ruta;
          return (
            <Link
              key={enlace.ruta}
              to={enlace.ruta}
              title={!sidebarExpandido ? enlace.etiqueta : undefined}
              className={cn(
                "flex items-center rounded-xl transition-all duration-200 group relative",
                sidebarExpandido ? "gap-3 px-3 py-2.5" : "justify-center p-3 mx-auto w-12 h-12",
                estaActivo ? "text-white" : "text-texto-secundario hover:text-texto-principal hover:bg-white/5"
              )}
              style={estaActivo ? {
                background: `rgba(${colorR},${colorG},${colorB},0.15)`,
                borderLeft: sidebarExpandido ? `2px solid ${colorHex}` : 'none',
                boxShadow: `inset 0 0 20px rgba(${colorR},${colorG},${colorB},0.05), 0 0 10px rgba(${colorR},${colorG},${colorB},0.1)`,
              } : {
                borderLeft: sidebarExpandido ? '2px solid transparent' : 'none',
              }}
            >
              <span
                className="transition-colors duration-200"
                style={{ color: estaActivo ? colorHex : undefined }}
              >
                {enlace.icono}
              </span>
              
              {sidebarExpandido && <span className="font-medium text-sm whitespace-nowrap">{enlace.etiqueta}</span>}

              {/* Indicador activo cuando está colapsado (puntito) */}
              {estaActivo && !sidebarExpandido && (
                <div
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: colorHex, boxShadow: `0 0 6px ${colorHex}` }}
                />
              )}

              {/* Indicador activo cuando está expandido */}
              {estaActivo && sidebarExpandido && (
                <div
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: colorHex, boxShadow: `0 0 6px ${colorHex}` }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Botón para alternar Sidebar */}
      <div className="p-4 relative z-10 flex justify-center">
        <button
          onClick={alternarSidebar}
          className="text-texto-secundario hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
          title={sidebarExpandido ? "Colapsar sidebar" : "Expandir sidebar"}
        >
          {sidebarExpandido ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
      </div>

    </aside>
  );
}
