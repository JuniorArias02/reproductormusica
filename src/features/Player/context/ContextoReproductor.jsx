import { createContext, useContext } from 'react';
import { useReproductorMultimedia } from '../hooks/useReproductorMultimedia';
import { useColorDominante } from '../hooks/useColorDominante';
import { useShortcutsTeclado } from '../hooks/useShortcutsTeclado';

const ContextoReproductor = createContext(null);

export function ProveedorReproductor({ children }) {
  const estadoReproductor = useReproductorMultimedia();
  const { color, cargando: cargandoColor } = useColorDominante(
    estadoReproductor.cancionActual,
    estadoReproductor.refElemento
  );

  // Inicializar atajos de teclado globales
  useShortcutsTeclado(estadoReproductor);

  return (
    <ContextoReproductor.Provider value={{ ...estadoReproductor, color, cargandoColor }}>
      {children}
    </ContextoReproductor.Provider>
  );
}

export function useReproductor() {
  const contexto = useContext(ContextoReproductor);
  if (!contexto) throw new Error('useReproductor debe usarse dentro de un ProveedorReproductor');
  return contexto;
}
