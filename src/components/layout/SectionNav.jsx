import { Link, useLocation } from 'react-router-dom';

import { useI18n } from '../../i18n/I18nContext';

import {
  DEFAULT_DIMENSION_SLUG,
  NAV_ITEMS,
  getDimensionBySlug,
} from '../../constants/dimensions';

/**
 * Navegación principal: Datos Reales / Objetivos.
 *
 * Conserva la pestaña activa al cambiar de sección — si estás viendo
 * /reales/sede y pulsas Objetivos, aterrizas en /objetivos/sede y no de vuelta
 * en la primera pestaña.
 *
 * Se deriva del pathname en lugar de useParams porque este componente vive por
 * encima de <Routes>, donde no hay contexto de ruta emparejada.
 */
export default function SectionNav() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const [, sectionSlug, dimensionSlug] = pathname.split('/');

  const currentDimension = getDimensionBySlug(dimensionSlug);
  const targetDimension = currentDimension?.slug ?? DEFAULT_DIMENSION_SLUG;

  return (
    <nav className="section-nav" aria-label={t('nav.secciones')}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.slug === sectionSlug;
        // Resumen Global no tiene pestañas, así que su enlace es la ruta a
        // secas; a las otras se les conserva la dimensión activa.
        const to = item.hasDimensions ? `${item.path}/${targetDimension}` : item.path;
        return (
          <Link
            key={item.slug}
            to={to}
            className="section-nav__item"
            data-active={isActive || undefined}
            aria-current={isActive ? 'page' : undefined}
          >
            {t(`nav.${item.slug}`)}
          </Link>
        );
      })}
    </nav>
  );
}
