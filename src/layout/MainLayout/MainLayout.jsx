import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { BarraReproductor } from '../../features/Player/components/BarraReproductor';
import { FondoAmbiente } from './FondoAmbiente';

/**
 * Layout principal:
 * ┌──────────────────────────────────────┐
 * │ Sidebar │      Área de Contenido     │  ← flex-1, overflow-hidden, altura real
 * │         │                            │
 * ├──────────────────────────────────────┤
 * │        Barra de Reproductor          │  ← full-width
 * └──────────────────────────────────────┘
 *
 * overflow-hidden en main (no overflow-y-auto) para que h-full
 * en Inicio.jsx resuelva al tamaño real del contenedor.
 */
export function MainLayout() {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden" style={{ background: '#0A0A0C' }}>

      {/* Capa 0: sistema ambiental (canvas fijo detrás de todo) */}
      <FondoAmbiente />

      {/* Capa 1: contenido (sidebar + main) */}
      <div className="relative z-10 flex flex-1 min-h-0">
        <Sidebar />

        {/* main no tiene overflow-y-auto para que h-full funcione en Inicio */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="flex-1 p-6 overflow-hidden">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Capa 2: barra del reproductor full-width */}
      <div className="relative z-20 flex-shrink-0">
        <BarraReproductor />
      </div>
    </div>
  );
}
