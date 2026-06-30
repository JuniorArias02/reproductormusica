import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' 

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    cors: true,
    watch: {
      ignored: ['**/src/assets/media/**'] // Evita que la app de React colapse (pantalla negra) al descargar música
    }
  },
  build: {
    rollupOptions: {
      // jsmediatags incluye código para React Native por defecto. 
      // Ignoramos esta librería para que Vite (Rolldown) no falle al compilar para la Web.
      external: ['react-native-fs']
    }
  }
})
