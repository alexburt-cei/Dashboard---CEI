import { Link } from 'react-router-dom';

import { useI18n } from '../i18n/I18nContext';

import { DEFAULT_ROUTE } from '../constants/dimensions';

export default function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="empty-state">
      <p className="empty-state__title">Esta página no existe</p>
      <p className="empty-state__body">
        La ruta que has abierto no corresponde a ninguna sección o pestaña del dashboard.
      </p>
      <Link className="button" to={DEFAULT_ROUTE}>
        Volver al inicio
      </Link>
    </div>
  );
}
