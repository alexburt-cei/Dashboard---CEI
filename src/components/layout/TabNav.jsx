import { Link, useLocation } from 'react-router-dom';

import { DIMENSIONS } from '../../constants/dimensions';
import { DEFAULT_SCOPE_SLUG, getScopeBySlug } from '../../constants/scopes';
import { useI18n } from '../../i18n/I18nContext';

/**
 * Navegación de pestañas dentro de una sección: por Tipo de Formación, por Área
 * y por Sede. Las pestañas son enlaces reales, así que cada vista es
 * enlazable, recargable y navegable con atrás/adelante.
 *
 * @param {{section: import('../../constants/dimensions').Section}} props
 */
export default function TabNav({ section }) {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const [, , dimensionSlug, scopeSlug] = pathname.split('/');

  // Al cambiar de dimensión se conserva el ámbito, igual que al cambiar de
  // sección se conserva la pestaña: de /reales/sede/madrid se pasa a
  // /reales/formacion/madrid, no de vuelta al Total.
  const scope = getScopeBySlug(scopeSlug)?.slug ?? DEFAULT_SCOPE_SLUG;

  return (
    <nav className="tab-nav" aria-label={t('nav.vistasDe', { seccion: t(`nav.${section.slug}`) })}>
      {DIMENSIONS.map((dimension) => {
        const isActive = dimension.slug === dimensionSlug;
        return (
          <Link
            key={dimension.slug}
            to={`${section.path}/${dimension.slug}/${scope}`}
            className="tab-nav__item"
            data-active={isActive || undefined}
            aria-current={isActive ? 'page' : undefined}
          >
            {t(`dim.${dimension.slug}`)}
          </Link>
        );
      })}
    </nav>
  );
}
