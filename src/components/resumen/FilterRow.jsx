import { useId } from 'react';

import { useI18n } from '../../i18n/I18nContext';

/**
 * Fila de filtros del Resumen Global: rango de fechas y dimensiones.
 *
 * Va en una sola fila y **encima** de las gráficas, no en una barra lateral: lo
 * que se filtra tiene que estar a la vista de lo que cambia, para que se vea la
 * relación causa-efecto al tocarlo.
 *
 * Los selectores son múltiples y "sin selección" significa "todas", que es lo
 * que espera quien no ha tocado nada — no hace falta marcar las tres sedes para
 * ver las tres.
 *
 * @param {{
 *   valores: {desde: string, hasta: string, sedes: string[], formaciones: string[], areas: string[]},
 *   opciones: {sedes: string[], formaciones: string[], areas: string[]},
 *   onChange: (parcial: object) => void,
 *   onReset: () => void,
 *   activos: number,
 * }} props
 */
export default function FilterRow({ valores, opciones, onChange, onReset, activos }) {
  const id = useId();
  const { t } = useI18n();

  const multi = (campo, label, lista) => (
    <label className="filtro" htmlFor={`${id}-${campo}`}>
      <span className="filtro__label">{label}</span>
      <select
        id={`${id}-${campo}`}
        className="filtro__control"
        multiple
        size={Math.min(4, Math.max(2, lista.length))}
        value={valores[campo]}
        onChange={(event) =>
          onChange({
            [campo]: [...event.target.selectedOptions].map((option) => option.value),
          })
        }
      >
        {lista.map((valor) => (
          <option key={valor} value={valor}>
            {valor}
          </option>
        ))}
      </select>
      <span className="filtro__hint">
        {valores[campo].length === 0
          ? t('filtros.todas')
          : t('filtros.seleccionadas', { n: valores[campo].length })}
      </span>
    </label>
  );

  return (
    <section className="filtros" aria-label={t('filtros.titulo')}>
      <label className="filtro" htmlFor={`${id}-desde`}>
        <span className="filtro__label">{t('filtros.desde')}</span>
        <input
          id={`${id}-desde`}
          className="filtro__control"
          type="date"
          value={valores.desde}
          max={valores.hasta || undefined}
          onChange={(event) => onChange({ desde: event.target.value })}
        />
      </label>

      <label className="filtro" htmlFor={`${id}-hasta`}>
        <span className="filtro__label">{t('filtros.hasta')}</span>
        <input
          id={`${id}-hasta`}
          className="filtro__control"
          type="date"
          value={valores.hasta}
          min={valores.desde || undefined}
          onChange={(event) => onChange({ hasta: event.target.value })}
        />
      </label>

      {multi('sedes', t('filtros.sedes'), opciones.sedes)}
      {multi('formaciones', t('filtros.formacion'), opciones.formaciones)}
      {multi('areas', t('filtros.areas'), opciones.areas)}

      <button
        type="button"
        className="button button--ghost filtros__reset"
        onClick={onReset}
        disabled={activos === 0}
      >
        {t('filtros.limpiar')}{activos > 0 ? ` (${activos})` : ''}
      </button>
    </section>
  );
}
