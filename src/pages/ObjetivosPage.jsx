import { Outlet } from 'react-router-dom';

import TabNav from '../components/layout/TabNav';
import { getSectionBySlug } from '../constants/dimensions';

const SECTION = getSectionBySlug('objetivos');

/**
 * Sección "Objetivos". Misma estructura que RealesPage pero con su propio
 * Tipo Dato; se mantienen separadas porque esta sección va a crecer con el
 * grado de cumplimiento (real vs objetivo) y sus barras de progreso.
 */
export default function ObjetivosPage() {
  return (
    <section aria-labelledby="seccion-objetivos">
      <h1 id="seccion-objetivos" className="sr-only">
        {SECTION.label}
      </h1>
      <TabNav section={SECTION} />
      <Outlet context={{ section: SECTION }} />
    </section>
  );
}
