import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { BarraReproductor } from '../../features/Player/components/BarraReproductor';
import { FondoAmbiente } from './FondoAmbiente';
import { PanelNowPlaying } from '../../features/Player/components/PanelNowPlaying';
import { useReproductor } from '../../features/Player/context/ContextoReproductor';
import { cn } from '../../utils/clases';

export function MainLayout() {
  const { panelExpandido, cancionActual } = useReproductor();

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden" style={{ background: '#0A0A0C' }}>

      {/* Capa 0: sistema ambiental (canvas fijo detrás de todo) */}
      <FondoAmbiente />

      {/* Capa 1: contenido (sidebar + main) */}
      <div className="relative z-10 flex flex-1 min-h-0">
        <Sidebar />

        {/* Contenedor dinámico (Main + Panel) */}
        <main className="flex flex-1 min-w-0 overflow-hidden">
          
          {/* Vistas enrutadas (Inicio, Librería, Ajustes) */}
          <div className={cn(
            "flex-1 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] h-full",
            panelExpandido && cancionActual ? "max-w-[45%] border-r border-white/5" : "max-w-full"
          )}>
            <Outlet />
          </div>

          {/* Panel Lateral Global (Now Playing) */}
          {panelExpandido && cancionActual && (
            <div className="flex-1 h-full overflow-hidden bg-black/10 backdrop-blur-sm transition-all duration-500 ease-in-out">
              <PanelNowPlaying cancion={cancionActual} />
            </div>
          )}

        </main>
      </div>

      {/* Capa 2: barra del reproductor full-width */}
      <div className="relative z-20 flex-shrink-0">
        <BarraReproductor />
      </div>
    </div>
  );
}
