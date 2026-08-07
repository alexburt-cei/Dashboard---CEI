import { Outlet } from 'react-router-dom';

import ScopeNav from '../components/layout/ScopeNav';
import TabNav from '../components/layout/TabNav';
import { getSectionBySlug } from '../constants/dimensions';
import { DEFAULT_DIMENSION_SLUG } from '../constants/dimensions';
import { useLocation } from 'react-router-dom';

const SECTION = getSectionBySlug('reales');

/**
 * Sección "Datos Reales": pinta la navegación de pestañas y delega el cuerpo
 * de cada pestaña al <Outlet>. La sección viaja por contexto del Outlet para
 * que DimensionDashboard sepa por qué Tipo Dato filtrar sin repetir el slug.
 */
export default function RealesPage() {
  // La dimensión sale del pathname y no de useParams: esta página es la ruta
  // padre, y ahí todavía no está resuelto el parámetro de la hija.
  const { pathname } = useLocation();
  const dimensionSlug = pathname.split('/')[2] || DEFAULT_DIMENSION_SLUG;

  return (
    <section aria-labelledby="seccion-reales">
      <h1 id="seccion-reales" className="sr-only">
        {SECTION.label}
      </h1>
      <TabNav section={SECTION} />
      <ScopeNav sectionPath={SECTION.path} dimensionSlug={dimensionSlug} />
      <Outlet context={{ section: SECTION }} />
    </section>
  );
}
