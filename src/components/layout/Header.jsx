import FileUpload from '../FileUpload';
import SectionNav from './SectionNav';
import { useData } from '../../context/DataContext';
import { formatInteger } from '../../utils/format';
import { periodoLabel } from '../../utils/dataTransform';

/**
 * Cabecera de la aplicación: identidad, estado del archivo cargado y
 * navegación principal entre secciones.
 */
export default function Header() {
  const { hasData, fileName, meta, clear } = useData();

  return (
    <header className="app-header">
      <div className="app-header__bar">
        <div className="app-header__identity">
          <span className="app-header__title">Dashboard CEI</span>
          <span className="app-header__subtitle">Ingresos por formación, área y sede</span>
        </div>

        <div className="app-header__actions">
          {hasData && meta ? (
            <div className="file-badge">
              <span className="file-badge__name" title={fileName ?? undefined}>
                {fileName ?? 'Archivo importado'}
              </span>
              <span className="file-badge__meta">
                {formatInteger(meta.importedRows)} filas
                {meta.periodoMin && meta.periodoMax
                  ? ` · ${periodoLabel(meta.periodoMin)} – ${periodoLabel(meta.periodoMax)}`
                  : ''}
              </span>
            </div>
          ) : null}

          {/* Siempre compacto: la zona de arrastre grande vive en el estado
              vacío del dashboard, para no duplicarla en pantalla. */}
          <FileUpload compact />

          {hasData ? (
            <button type="button" className="button button--ghost" onClick={clear}>
              Quitar datos
            </button>
          ) : null}
        </div>
      </div>

      <SectionNav />
    </header>
  );
}
