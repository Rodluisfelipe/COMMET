import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // Configuración de desarrollo
  server: {
    port: 5173,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  
  // Configuración de build para producción
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild', // Usar esbuild en lugar de terser (viene incluido)
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', '@heroicons/react']
        }
      }
    }
  },
  
  // Variables de entorno permitidas
  envPrefix: 'VITE_'
})
