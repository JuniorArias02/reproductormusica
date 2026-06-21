import { TarjetaCancion } from './TarjetaCancion';

export function ListaCanciones({ canciones }) {
  if (!canciones || canciones.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-texto-secundario text-sm">
        No hay canciones disponibles.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {canciones.map(cancion => (
        <TarjetaCancion key={cancion.id} cancion={cancion} />
      ))}
    </div>
  );
}
