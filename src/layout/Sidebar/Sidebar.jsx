import { Music, Home, Library, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/clases';
import { useReproductor } from '../../features/Player/context/ContextoReproductor';

export function Sidebar() {
  const ubicacion = useLocation();
  const { color, cancionActual } = useReproductor();

  const colorHex = color?.hex ?? '#FF4A1C';
  const colorR = color?.r ?? 255;
  const colorG = color?.g ?? 74;
  const colorB = color?.b ?? 28;

  const enlaces = [
    { ruta: '/',         icono: <Home size={18} />,    etiqueta: 'Inicio'   },
    { ruta: '/libreria', icono: <Library size={18} />, etiqueta: 'Librería' },
    { ruta: '/ajustes',  icono: <Settings size={18} />, etiqueta: 'Ajustes'  },
  ];

  return (
    <aside
      className="w-60 h-full flex flex-col relative overflow-hidden flex-shrink-0"
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
      <div className="p-5 flex items-center gap-3 relative z-10">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-1000"
          style={{
            background: `linear-gradient(135deg, ${colorHex}, rgba(0,240,255,0.8))`,
            boxShadow: `0 0 16px rgba(${colorR},${colorG},${colorB},0.5)`,
          }}
        >
          <Music size={16} className="text-white" />
        </div>
        <h1 className="text-lg font-bold tracking-wide text-texto-principal">Música</h1>
      </div>

      {/* Separador */}
      <div className="mx-4 mb-3 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* Navegación */}
      <nav className="flex-1 px-3 space-y-1 relative z-10">
        {enlaces.map((enlace) => {
          const estaActivo = ubicacion.pathname === enlace.ruta;
          return (
            <Link
              key={enlace.ruta}
              to={enlace.ruta}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                estaActivo ? "text-white" : "text-texto-secundario hover:text-texto-principal"
              )}
              style={estaActivo ? {
                background: `rgba(${colorR},${colorG},${colorB},0.15)`,
                borderLeft: `2px solid ${colorHex}`,
                boxShadow: `inset 0 0 20px rgba(${colorR},${colorG},${colorB},0.05), 0 0 10px rgba(${colorR},${colorG},${colorB},0.1)`,
              } : {
                borderLeft: '2px solid transparent',
              }}
            >
              <span
                className="transition-colors duration-200"
                style={{ color: estaActivo ? colorHex : undefined }}
              >
                {enlace.icono}
              </span>
              <span className="font-medium text-sm">{enlace.etiqueta}</span>

              {/* Indicador activo */}
              {estaActivo && (
                <div
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: colorHex, boxShadow: `0 0 6px ${colorHex}` }}
                />
              )}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
