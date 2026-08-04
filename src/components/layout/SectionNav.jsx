import { Link, useLocation } from 'react-router-dom';

import {
  DEFAULT_DIMENSION_SLUG,
  SECTIONS,
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
  const [, sectionSlug, dimensionSlug] = pathname.split('/');

  const currentDimension = getDimensionBySlug(dimensionSlug);
  const targetDimension = currentDimension?.slug ?? DEFAULT_DIMENSION_SLUG;

  return (
    <nav className="section-nav" aria-label="Secciones">
      {SECTIONS.map((section) => {
        const isActive = section.slug === sectionSlug;
        return (
          <Link
            key={section.slug}
            to={`${section.path}/${targetDimension}`}
            className="section-nav__item"
            data-active={isActive || undefined}
            aria-current={isActive ? 'page' : undefined}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
