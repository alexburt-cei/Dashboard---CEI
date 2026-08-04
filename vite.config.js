import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages sirve este proyecto en un subdirectorio
 * (usuario.github.io/Dashboard---CEI/), no en la raíz del dominio, así que el
 * build necesita `base` con el nombre del repo o los assets se piden a `/assets/…`
 * y devuelven 404.
 *
 * Sólo se aplica al compilar: en `vite dev` la base sigue siendo `/` para no
 * obligar a escribir la ruta larga en local. `import.meta.env.BASE_URL` expone
 * el valor elegido, y de ahí lo lee el `basename` del router en main.jsx — así
 * la ruta base se declara una sola vez.
 */
const REPO_BASE = '/Dashboard---CEI/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? REPO_BASE : '/',
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
}));
