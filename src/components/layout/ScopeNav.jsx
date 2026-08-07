import { Link, useLocation } from 'react-router-dom';

import { SCOPES } from '../../constants/scopes';
import { useI18n } from '../../i18n/I18nContext';

/**
 * Segundo nivel de pestañas: el ámbito sobre el que se calcula la vista.
 *
 * Va debajo de la pestaña de dimensión y con un peso visual menor, porque son
 * dos preguntas distintas y anidadas: primero *por qué* se agrupa (formación o
 * sede) y después *sobre qué filas* (una sede, lo online, lo presencial o todo).
 * Al mismo peso se leerían como seis pestañas más de la misma fila.
 *
 * Como las de arriba, son enlaces reales: cada combinación queda enlazable,
 * recargable y navegable con atrás y adelante.
 */
export default function ScopeNav({ sectionPath, dimensionSlug }) {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const [, , , scopeSlug] = pathname.split('/');

  return (
    <nav className="scope-nav" aria-label={t('scope.etiqueta')}>
      {SCOPES.map((scope) => {
        const isActive = scope.slug === scopeSlug;
        return (
          <Link
            key={scope.slug}
            to={`${sectionPath}/${dimensionSlug}/${scope.slug}`}
            className="scope-nav__item"
            data-active={isActive || undefined}
            aria-current={isActive ? 'page' : undefined}
          >
            {t(scope.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
