import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
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
