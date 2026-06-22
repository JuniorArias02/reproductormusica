import { useState } from 'react';
import { CloudDownload, Video, Music, Link as LinkIcon, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useReproductor } from '../../Player/context/ContextoReproductor';
import { cn } from '../../../utils/clases';

export function Descargar() {
  const [url, setUrl] = useState('');
  const [formato, setFormato] = useState('mp3');
  const [descargando, setDescargando] = useState(false);
  const [estado, setEstado] = useState(null); // 'idle' | 'success' | 'error'
  const [mensaje, setMensaje] = useState('');
  
  const { color } = useReproductor();

  const colorHex = color?.hex ?? '#FF4A1C';
  const colorR = color?.r ?? 255;
  const colorG = color?.g ?? 74;
  const colorB = color?.b ?? 28;

  const manejarDescarga = async (e) => {
    e.preventDefault();
    if (!url.trim() || !url.includes('youtube.com') && !url.includes('youtu.be')) {
      setEstado('error');
      setMensaje('Por favor, ingresa un enlace válido de YouTube.');
      return;
    }

    setDescargando(true);
    setEstado('idle');
    setMensaje(`Procesando ${formato.toUpperCase()} y metadatos... (esto puede tardar unos segundos)`);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/downloads/youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, format: formato }),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || 'Error al descargar la canción');
      }

      setEstado('success');
      setMensaje(`¡Descargado con éxito! Se guardó como: ${responseData.data?.track?.title || 'Archivo'}.${formato}`);
      setUrl('');
      
    } catch (error) {
      setEstado('error');
      setMensaje(error.message || 'Error de conexión con el servidor.');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto w-full relative z-10 custom-scrollbar">
      {/* Cabecera */}
      <div className="mb-10 relative z-10 flex items-end gap-6">
        <div 
          className="w-40 h-40 rounded-2xl flex-shrink-0 shadow-2xl flex items-center justify-center overflow-hidden relative"
          style={{ 
            background: `linear-gradient(135deg, ${colorHex}, rgba(${colorR},${colorG},${colorB},0.4))`,
            boxShadow: `0 20px 40px rgba(${colorR},${colorG},${colorB},0.3)`
          }}
        >
          <div className="absolute inset-0 bg-black/20" />
          <CloudDownload size={64} className="text-white relative z-10 drop-shadow-md" />
        </div>
        
        <div className="flex flex-col pb-2">
          <span className="uppercase tracking-widest text-xs font-bold text-texto-secundario mb-2">Herramientas</span>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-4 drop-shadow-lg">Descargar</h1>
          <p className="text-texto-secundario text-sm font-medium">
            Agrega música y videos a tu librería directamente desde YouTube.
          </p>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="w-full max-w-3xl relative z-10 flex flex-col gap-6">
        
        {/* Tarjeta de descarga */}
        <div className="bg-black/20 rounded-2xl backdrop-blur-xl border border-white/5 p-8 relative overflow-hidden group">
          {/* Fondo interactivo */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none"
            style={{ background: `radial-gradient(circle at center, ${colorHex} 0%, transparent 70%)` }}
          />

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <Video size={24} className="text-[#FF0000]" />
            <h2 className="text-xl font-bold text-white tracking-tight">Convertidor de YouTube a MP3/MP4</h2>
          </div>

          <form onSubmit={manejarDescarga} className="relative z-10">
            <div className="flex flex-col gap-2 mb-6">
              <label htmlFor="url" className="text-xs font-bold text-texto-secundario uppercase tracking-widest">
                Enlace del video
              </label>
              <div className="relative flex items-center">
                <LinkIcon size={18} className="absolute left-4 text-texto-secundario" />
                <input
                  id="url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                  disabled={descargando}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-6">
              <span className="text-xs font-bold text-texto-secundario uppercase tracking-widest">
                Formato
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormato('mp3')}
                  disabled={descargando}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold transition-all",
                    formato === 'mp3' 
                      ? "bg-white/10 border-white/30 text-white" 
                      : "bg-black/30 border-white/5 text-texto-secundario hover:bg-white/5"
                  )}
                  style={formato === 'mp3' ? { borderColor: colorHex, color: colorHex } : {}}
                >
                  <Music size={18} />
                  Solo Audio (MP3)
                </button>
                <button
                  type="button"
                  onClick={() => setFormato('mp4')}
                  disabled={descargando}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold transition-all",
                    formato === 'mp4' 
                      ? "bg-white/10 border-white/30 text-white" 
                      : "bg-black/30 border-white/5 text-texto-secundario hover:bg-white/5"
                  )}
                  style={formato === 'mp4' ? { borderColor: colorHex, color: colorHex } : {}}
                >
                  <Video size={18} />
                  Video + Audio (MP4)
                </button>
              </div>
            </div>

            {/* Mensajes de estado */}
            {estado && (
              <div className={cn(
                "mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border transition-all duration-300",
                estado === 'error' ? "bg-red-500/10 text-red-400 border-red-500/20" : "",
                estado === 'success' ? "bg-green-500/10 text-green-400 border-green-500/20" : "",
                estado === 'idle' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : ""
              )}>
                {estado === 'error' && <AlertCircle size={18} />}
                {estado === 'success' && <CheckCircle2 size={18} />}
                {estado === 'idle' && <Loader2 size={18} className="animate-spin" />}
                <p>{mensaje}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={descargando || !url.trim()}
              className={cn(
                "w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white transition-all duration-300 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-lg",
                descargando && "opacity-80"
              )}
              style={url.trim() ? {
                background: `linear-gradient(135deg, ${colorHex}, rgba(${colorR},${colorG},${colorB},0.7))`,
                boxShadow: `0 8px 20px rgba(${colorR},${colorG},${colorB},0.25)`
              } : { background: '#27272A' }}
            >
              {descargando ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Descargando...
                </>
              ) : (
                <>
                  <CloudDownload size={20} />
                  Iniciar Descarga
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info adicional */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-start gap-4 backdrop-blur-md">
          <div className="p-3 rounded-full bg-white/5 text-texto-secundario flex-shrink-0">
            <Music size={20} />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">Sobre tus descargas</h3>
            <p className="text-texto-secundario text-sm leading-relaxed">
              Los archivos se descargan en la más alta calidad disponible y se convierten a MP3 (320kbps).
              Una vez descargados, aparecerán directamente en tu carpeta <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs">src/assets/media</code>.
              Recuerda ir a la Librería e "Importar Archivos" para añadirlos a tu playlist actual.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
