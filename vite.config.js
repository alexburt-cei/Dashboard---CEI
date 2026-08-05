import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * La ruta base depende de dónde se sirva la app, y hay dos destinos con
 * necesidades opuestas:
 *
 *   - **Vercel** (y cualquier dominio propio) sirve en la raíz: base '/'.
 *   - **GitHub Pages** sirve en /Dashboard---CEI/, porque es un project site y
 *     vive en un subdirectorio del dominio github.io.
 *
 * Por eso la base no se fija aquí a un valor: se lee de `VITE_BASE_PATH` y por
 * omisión es '/'. Así Vercel funciona sin configurar nada, y es el workflow de
 * Pages el que declara su prefijo. El router toma su `basename` de
 * `import.meta.env.BASE_URL`, que es esta misma base, así que la ruta se decide
 * en un solo sitio y no hay dos valores que puedan discrepar.
 */
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
});
