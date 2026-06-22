import * as jsmediatags from 'jsmediatags';

/**
 * Busca metadatos en iTunes si el archivo no los trae internamente
 */
async function buscarEnItunes(terminoBusqueda) {
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(terminoBusqueda)}&entity=song&limit=1`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const pista = data.results[0];
      // iTunes devuelve 100x100, cambiamos la URL para obtener alta resolución (600x600)
      const portadaAltaRes = pista.artworkUrl100.replace('100x100bb', '600x600bb');
      return {
        portada: portadaAltaRes,
        artista: pista.artistName,
        tituloMetadatos: pista.trackName,
        duracionMs: pista.trackTimeMillis
      };
    }
  } catch (error) {
    console.warn("No se pudo buscar en iTunes:", error);
  }
  return null;
}

/**
 * Lee los metadatos (ID3) de un archivo MP3 desde su URL.
 * Extrae la portada en base64 y el artista si existen.
 * Si no tiene portada, busca en internet (iTunes) basándose en el nombre de la canción.
 */
export function extraerMetadatosMP3(urlArchivo, tituloSugerido = '') {
  return new Promise((resolve) => {
    const jsm = window.jsmediatags || jsmediatags;
    
    const resolverConFallback = async (datos) => {
      // Si no hay portada, intentamos buscarla en internet
      if (!datos.portada && tituloSugerido) {
        const itunes = await buscarEnItunes(tituloSugerido);
        if (itunes) {
          resolve({
            portada: itunes.portada,
            artista: datos.artista !== 'Artista Local' ? datos.artista : itunes.artista,
            tituloMetadatos: datos.tituloMetadatos || itunes.tituloMetadatos,
            duracion: datos.duracion || (itunes.duracionMs ? itunes.duracionMs / 1000 : 0)
          });
          return;
        }
      }
      resolve(datos);
    };

    const leerMetadatos = async () => {
      const duracionAudio = await new Promise(resolve => {
        const a = new Audio(urlArchivo);
        a.onloadedmetadata = () => resolve(a.duration);
        a.onerror = () => resolve(0);
      });

      if (!jsm || !jsm.read) {
        resolverConFallback({ portada: null, artista: 'Artista Local', tituloMetadatos: null, duracion: duracionAudio });
        return;
      }

      try {
        // En Vite, pasar la URL directa a veces falla por cómo sirve los archivos.
        // Lo bajamos como Blob primero para que jsmediatags lo lea nativamente.
        const res = await fetch(urlArchivo);
        const blob = await res.blob();

        jsm.read(blob, {
          onSuccess: function(tag) {
            const tags = tag.tags;
            let imageUrl = null;

            if (tags.picture) {
              const data = tags.picture.data;
              const format = tags.picture.format;
              
              const bytes = new Uint8Array(data);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64 = btoa(binary);
              imageUrl = `data:${format};base64,${base64}`;
            }

            resolverConFallback({
              portada: imageUrl,
              artista: tags.artist || 'Artista Local',
              tituloMetadatos: tags.title || null,
              duracion: duracionAudio
            });
          },
          onError: function() {
            // Falla silenciosa si no tiene metadatos ID3. Entra el fallback.
            resolverConFallback({ portada: null, artista: 'Artista Local', tituloMetadatos: null, duracion: duracionAudio });
          }
        });
      } catch (err) {
        console.warn("Error descargando blob:", err);
        resolverConFallback({ portada: null, artista: 'Artista Local', tituloMetadatos: null, duracion: duracionAudio });
      }
    };

    leerMetadatos();
  });
}
