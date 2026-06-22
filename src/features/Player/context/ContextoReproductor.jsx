import { createContext, useContext, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useColorDominante } from '../hooks/useColorDominante';
import { useShortcutsTeclado } from '../hooks/useShortcutsTeclado';

const ContextoReproductor = createContext(null);

export function ProveedorReproductor({ children }) {
  // Obtenemos todo el estado y acciones de Zustand
  const estadoReproductor = usePlayerStore();

  // Cargamos los metadatos de las canciones iniciales (solo una vez)
  useEffect(() => {
    estadoReproductor.iniciarMetadatosEstaticos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hook visual: Extraer color dominante de la portada
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
