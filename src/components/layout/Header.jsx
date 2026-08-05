import Controls from './Controls';
import FileUpload from '../FileUpload';
import SectionNav from './SectionNav';
import { useData } from '../../context/DataContext';
import { useFormatters } from '../../utils/useFormatters';
import { useI18n } from '../../i18n/I18nContext';
import { periodoLabel } from '../../utils/dataTransform';

/**
 * Cabecera de la aplicación: identidad, estado del archivo cargado y
 * navegación principal entre secciones.
 */
export default function Header() {
  const { hasData, fileName, meta, clear } = useData();
  const { t, locale } = useI18n();
  const { formatInteger } = useFormatters();

  return (
    <header className="app-header">
      <div className="app-header__bar">
        <div className="app-header__identity">
          <span className="app-header__title">{t('app.titulo')}</span>
          <span className="app-header__subtitle">{t('app.subtitulo')}</span>
        </div>

        <div className="app-header__actions">
          {hasData && meta ? (
            <div className="file-badge">
              <span className="file-badge__name" title={fileName ?? undefined}>
                {fileName ?? t('upload.subir')}
              </span>
              <span className="file-badge__meta">
                {t('upload.filas', { n: formatInteger(meta.importedRows) })}
                {meta.periodoMin && meta.periodoMax
                  ? ` · ${periodoLabel(meta.periodoMin, locale)} – ${periodoLabel(meta.periodoMax, locale)}`
                  : ''}
              </span>
            </div>
          ) : null}

          {/* Siempre compacto: la zona de arrastre grande vive en el estado
              vacío del dashboard, para no duplicarla en pantalla. */}
          <FileUpload compact />

          <Controls />

          {hasData ? (
            <button type="button" className="button button--ghost" onClick={clear}>
              {t('upload.quitar')}
            </button>
          ) : null}
        </div>
      </div>

      <SectionNav />
    </header>
  );
}
