import { Settings, Sliders, Monitor, HardDrive, Trash2 } from 'lucide-react';
import { useReproductor } from '../../Player/context/ContextoReproductor';

export function Ajustes() {
  const { color, limpiarLikes } = useReproductor();
  const colorHex = color?.hex ?? '#FF4A1C';

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto w-full relative z-10 custom-scrollbar">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-texto-principal mb-2 tracking-tight flex items-center gap-3">
          <Settings size={32} style={{ color: colorHex }} />
          Ajustes
        </h1>
        <p className="text-texto-secundario text-sm">Configura tu experiencia de reproducción</p>
      </div>

      <div className="max-w-3xl space-y-8 pb-24">
        {/* Bloque 1: Apariencia y Rendimiento */}
        <section>
          <h2 className="text-sm uppercase tracking-widest text-texto-secundario font-bold mb-4 flex items-center gap-2">
            <Monitor size={16} /> Interfaz y Rendimiento
          </h2>
          <div className="bg-black/20 rounded-2xl border border-white/5 p-4 flex flex-col gap-4 backdrop-blur-xl">
            
            <div className="flex items-center justify-between p-2 group">
              <div>
                <p className="text-texto-principal font-medium transition-colors group-hover:text-white">Efectos Visuales Avanzados</p>
                <p className="text-xs text-texto-secundario mt-1">Habilita glows inmersivos y visualizadores de audio en tiempo real.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ backgroundColor: colorHex }}></div>
              </label>
            </div>
            
            <div className="h-px w-full bg-white/5" />

            <div className="flex items-center justify-between p-2 group">
              <div>
                <p className="text-texto-principal font-medium transition-colors group-hover:text-white">Animaciones Fluidas (120fps)</p>
                <p className="text-xs text-texto-secundario mt-1">Desactívalo si notas lentitud en tu dispositivo.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ backgroundColor: colorHex }}></div>
              </label>
            </div>

          </div>
        </section>

        {/* Bloque 2: Audio */}
        <section>
          <h2 className="text-sm uppercase tracking-widest text-texto-secundario font-bold mb-4 flex items-center gap-2">
            <Sliders size={16} /> Audio
          </h2>
          <div className="bg-black/20 rounded-2xl border border-white/5 p-4 flex flex-col gap-4 backdrop-blur-xl">
            
            <div className="flex items-center justify-between p-2 group">
              <div>
                <p className="text-texto-principal font-medium transition-colors group-hover:text-white">Normalización de Volumen</p>
                <p className="text-xs text-texto-secundario mt-1">Mantiene un volumen consistente entre todas las pistas de audio.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all hover:bg-zinc-700"></div>
              </label>
            </div>

          </div>
        </section>

        {/* Bloque 3: Datos */}
        <section>
          <h2 className="text-sm uppercase tracking-widest text-texto-secundario font-bold mb-4 flex items-center gap-2">
            <HardDrive size={16} /> Almacenamiento Local
          </h2>
          <div className="bg-black/20 rounded-2xl border border-white/5 p-4 flex flex-col gap-4 backdrop-blur-xl">
            
            <div className="flex items-center justify-between p-2 group">
              <div>
                <p className="text-texto-principal font-medium transition-colors group-hover:text-white">Caché de Portadas (iTunes)</p>
                <p className="text-xs text-texto-secundario mt-1">Borra las imágenes descargadas para liberar espacio.</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-texto-secundario">
                <Trash2 size={16} />
                Limpiar Caché
              </button>
            </div>
            
            <div className="h-px w-full bg-white/5" />

            <div className="flex items-center justify-between p-2 group">
              <div>
                <p className="text-red-400 font-medium">Resetear Favoritos</p>
                <p className="text-xs text-texto-secundario mt-1">Elimina permanentemente todas tus canciones marcadas con 'Me Gusta'.</p>
              </div>
              <button 
                onClick={limpiarLikes}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 active:scale-95"
              >
                Eliminar
              </button>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
