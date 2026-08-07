import { Outlet } from 'react-router-dom';

import ScopeNav from '../components/layout/ScopeNav';
import TabNav from '../components/layout/TabNav';
import { getSectionBySlug } from '../constants/dimensions';
import { DEFAULT_DIMENSION_SLUG } from '../constants/dimensions';
import { useLocation } from 'react-router-dom';

const SECTION = getSectionBySlug('objetivos');

/**
 * Sección "Objetivos". Misma estructura que RealesPage pero con su propio
 * Tipo Dato; se mantienen separadas porque esta sección va a crecer con el
 * grado de cumplimiento (real vs objetivo) y sus barras de progreso.
 */
export default function ObjetivosPage() {
  // La dimensión sale del pathname y no de useParams: esta página es la ruta
  // padre, y ahí todavía no está resuelto el parámetro de la hija.
  const { pathname } = useLocation();
  const dimensionSlug = pathname.split('/')[2] || DEFAULT_DIMENSION_SLUG;

  return (
    <section aria-labelledby="seccion-objetivos">
      <h1 id="seccion-objetivos" className="sr-only">
        {SECTION.label}
      </h1>
      <TabNav section={SECTION} />
      <ScopeNav sectionPath={SECTION.path} dimensionSlug={dimensionSlug} />
      <Outlet context={{ section: SECTION }} />
    </section>
  );
}
