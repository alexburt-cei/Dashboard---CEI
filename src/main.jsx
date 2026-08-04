import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';

// Inter servida desde el propio bundle, no desde un CDN: así no hay petición a
// un tercero, la app funciona sin red y no cambia nada al pasar de Vercel a
// GitHub Pages. Sólo los pesos que se usan — traer la familia entera son cientos
// de kB que nadie ve.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

import './styles/tokens.css';
import './styles/global.css';

// `basename` sale de la base que fija vite.config.js: '/' en desarrollo y
// '/Dashboard---CEI/' en el build de GitHub Pages. Sin esto el router compara
// el pathname completo contra sus rutas y ninguna coincide al publicar en un
// subdirectorio.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
