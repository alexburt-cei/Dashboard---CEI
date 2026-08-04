import { Outlet } from 'react-router-dom';

import TabNav from '../components/layout/TabNav';
import { getSectionBySlug } from '../constants/dimensions';

const SECTION = getSectionBySlug('reales');

/**
 * Sección "Datos Reales": pinta la navegación de pestañas y delega el cuerpo
 * de cada pestaña al <Outlet>. La sección viaja por contexto del Outlet para
 * que DimensionDashboard sepa por qué Tipo Dato filtrar sin repetir el slug.
 */
export default function RealesPage() {
  return (
    <section aria-labelledby="seccion-reales">
      <h1 id="seccion-reales" className="sr-only">
        {SECTION.label}
      </h1>
      <TabNav section={SECTION} />
      <Outlet context={{ section: SECTION }} />
    </section>
  );
}
