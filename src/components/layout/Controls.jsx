import { useId } from 'react';

import { useI18n } from '../../i18n/I18nContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * Conmutador de tema y selector de idioma, juntos en la cabecera.
 *
 * El idioma es un `<select>` nativo y no un menú a medida: ya sabe navegarse con
 * teclado, se anuncia bien en lector de pantalla y en móvil abre el selector del
 * sistema. Un menú propio habría que reconstruirlo todo eso, para verse igual.
 *
 * **La bandera nunca va sola.** Cada opción lleva el nombre del idioma escrito en
 * su propio idioma, con la bandera como refuerzo: una bandera no es un idioma —el
 * inglés no es propiedad del Reino Unido— y quien no reconozca el trapo no sabría
 * qué está eligiendo.
 */
export default function Controls() {
  const { t, code, idiomas, setIdioma } = useI18n();
  const { esOscuro, alternar } = useTheme();
  const selectId = useId();

  const modoDestino = esOscuro ? t('tema.claro') : t('tema.oscuro');

  return (
    <div className="controls">
      <button
        type="button"
        className="controls__theme"
        onClick={alternar}
        // El botón dice a dónde se va, no dónde se está: es lo que espera quien
        // lo pulsa. `aria-pressed` da el estado a quien use lector de pantalla.
        aria-pressed={esOscuro}
        title={t('tema.activar', { modo: modoDestino })}
        aria-label={t('tema.activar', { modo: modoDestino })}
      >
        <span aria-hidden="true">{esOscuro ? '☀' : '☾'}</span>
      </button>

      <label className="controls__lang" htmlFor={selectId}>
        <span className="sr-only">{t('idioma.etiqueta')}</span>
        <select
          id={selectId}
          className="controls__select"
          value={code}
          onChange={(event) => setIdioma(event.target.value)}
        >
          {idiomas.map((idioma) => (
            <option key={idioma.code} value={idioma.code}>
              {idioma.bandera} {idioma.nombre}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
