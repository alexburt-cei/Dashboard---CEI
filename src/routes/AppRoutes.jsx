import { Navigate, Route, Routes } from 'react-router-dom';

import { DEFAULT_DIMENSION_SLUG, DEFAULT_ROUTE, SECTIONS } from '../constants/dimensions';
import DimensionDashboard from '../components/DimensionDashboard';
import NotFoundPage from '../pages/NotFoundPage';
import ObjetivosPage from '../pages/ObjetivosPage';
import RealesPage from '../pages/RealesPage';

const SECTION_PAGES = {
  reales: RealesPage,
  objetivos: ObjetivosPage,
};

/**
 * Rutas de la aplicación:
 *
 *   /                       -> redirige a /reales/formacion
 *   /reales                 -> redirige a /reales/formacion
 *   /reales/formacion
 *   /reales/area
 *   /reales/sede
 *   /objetivos              -> redirige a /objetivos/formacion
 *   /objetivos/formacion
 *   /objetivos/area
 *   /objetivos/sede
 *   cualquier otra          -> NotFoundPage
 *
 * Cada sección es una ruta padre que pinta su TabNav y deja el cuerpo de la
 * pestaña en el <Outlet>. La dimensión va como parámetro `:dimension` y la
 * valida DimensionDashboard contra el registro de DIMENSIONS, así que
 * /reales/cualquier-cosa cae en NotFound en vez de renderizar vacío.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={DEFAULT_ROUTE} replace />} />

      {SECTIONS.map((section) => {
        const SectionPage = SECTION_PAGES[section.slug];
        return (
          <Route key={section.slug} path={section.slug} element={<SectionPage />}>
            <Route index element={<Navigate to={DEFAULT_DIMENSION_SLUG} replace />} />
            <Route path=":dimension" element={<DimensionDashboard />} />
          </Route>
        );
      })}

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
