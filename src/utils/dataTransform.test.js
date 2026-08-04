import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  OTROS_LABEL,
  buildComparison,
  enumeratePeriodos,
  filterByTipoDato,
  getUniqueValues,
  groupByField,
  groupByPeriodo,
  periodoLabel,
  summarize,
  totalIngreso,
} from './dataTransform.js';
import { parseSheetRows } from './excelParser.js';

const HEADER = ['Fecha', 'Tipo Formación', 'Área', 'Sede', 'Ingreso', 'Tipo Dato'];

/** Construye filas pasando por el parser real, para no divergir del modelo. */
function buildRows(cells) {
  const result = parseSheetRows([HEADER, ...cells]);
  assert.equal(result.ok, true, 'el fixture debería parsear sin errores');
  return result.rows;
}

const ROWS = buildRows([
  ['2026-01-10', 'Máster', 'Digital', 'Madrid', 1000, 'Real'],
  ['2026-01-20', 'Curso', 'Digital', 'Madrid', 500, 'Real'],
  ['2026-03-05', 'Máster', 'Marketing', 'Sevilla', 2000, 'Real'],
  ['2026-01-10', 'Máster', 'Digital', 'Madrid', 1500, 'Objetivo'],
  ['2026-03-05', 'Máster', 'Marketing', 'Sevilla', 1000, 'Objetivo'],
]);

describe('filterByTipoDato / totalIngreso', () => {
  it('separa reales de objetivos', () => {
    assert.equal(filterByTipoDato(ROWS, 'real').length, 3);
    assert.equal(filterByTipoDato(ROWS, 'objetivo').length, 2);
  });

  it('suma ingresos', () => {
    assert.equal(totalIngreso(filterByTipoDato(ROWS, 'real')), 3500);
    assert.equal(totalIngreso([]), 0);
  });
});

describe('periodoLabel', () => {
  it('traduce la clave a mes abreviado', () => {
    assert.equal(periodoLabel('2026-01'), 'ene 2026');
    assert.equal(periodoLabel('2025-12'), 'dic 2025');
  });

  it('no rompe con una clave inesperada', () => {
    assert.equal(periodoLabel('basura'), 'basura');
    assert.equal(periodoLabel(null), '');
  });
});

describe('enumeratePeriodos', () => {
  it('lista los meses de un rango, ambos incluidos', () => {
    assert.deepEqual(enumeratePeriodos('2026-01', '2026-04'), [
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
    ]);
  });

  it('cruza el cambio de año', () => {
    assert.deepEqual(enumeratePeriodos('2025-11', '2026-02'), [
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ]);
  });

  it('devuelve un solo mes cuando coinciden', () => {
    assert.deepEqual(enumeratePeriodos('2026-05', '2026-05'), ['2026-05']);
  });

  it('devuelve vacío si el rango está invertido o es inválido', () => {
    assert.deepEqual(enumeratePeriodos('2026-05', '2026-01'), []);
    assert.deepEqual(enumeratePeriodos('nada', '2026-01'), []);
  });
});

describe('groupByField', () => {
  it('agrupa y ordena de mayor a menor', () => {
    const grouped = groupByField(filterByTipoDato(ROWS, 'real'), 'tipoFormacion');

    assert.deepEqual(
      grouped.map((item) => [item.key, item.total, item.count]),
      [
        ['Máster', 3000, 2],
        ['Curso', 500, 1],
      ],
    );
  });

  it('calcula la cuota sobre el total', () => {
    const grouped = groupByField(filterByTipoDato(ROWS, 'real'), 'sede');
    const madrid = grouped.find((item) => item.key === 'Madrid');
    assert.equal(madrid.total, 1500);
    assert.equal(madrid.share, 1500 / 3500);
  });

  it('agrupa la cola larga en "Otros" al pasar del límite', () => {
    const rows = buildRows(
      ['A', 'B', 'C', 'D'].map((name, index) => [
        '2026-01-10',
        name,
        'Digital',
        'Madrid',
        (4 - index) * 100,
        'Real',
      ]),
    );

    const grouped = groupByField(rows, 'tipoFormacion', { limit: 2 });

    assert.equal(grouped.length, 3);
    assert.deepEqual(
      grouped.map((item) => item.key),
      ['A', 'B', OTROS_LABEL],
    );
    // Otros = C (200) + D (100)
    assert.equal(grouped[2].total, 300);
    assert.equal(grouped[2].count, 2);
  });

  it('no agrupa si no se supera el límite', () => {
    const grouped = groupByField(filterByTipoDato(ROWS, 'real'), 'tipoFormacion', { limit: 8 });
    assert.equal(grouped.length, 2);
    assert.ok(!grouped.some((item) => item.key === OTROS_LABEL));
  });

  it('con total 0 no divide por cero', () => {
    const rows = buildRows([['2026-01-10', 'Máster', 'Digital', 'Madrid', 0, 'Real']]);
    const grouped = groupByField(rows, 'tipoFormacion');
    assert.equal(grouped[0].share, 0);
  });

  it('ordena empates por nombre para que el resultado sea estable', () => {
    const rows = buildRows([
      ['2026-01-10', 'Zeta', 'Digital', 'Madrid', 100, 'Real'],
      ['2026-01-10', 'Alfa', 'Digital', 'Madrid', 100, 'Real'],
    ]);
    assert.deepEqual(
      groupByField(rows, 'tipoFormacion').map((item) => item.key),
      ['Alfa', 'Zeta'],
    );
  });
});

describe('groupByPeriodo', () => {
  it('suma por mes y rellena los meses sin datos', () => {
    const series = groupByPeriodo(filterByTipoDato(ROWS, 'real'));

    assert.deepEqual(
      series.map((point) => [point.periodo, point.total]),
      [
        ['2026-01', 1500],
        ['2026-02', 0], // hueco relleno: saltárselo deformaría la tendencia
        ['2026-03', 2000],
      ],
    );
    assert.equal(series[0].label, 'ene 2026');
  });

  it('puede devolver sólo los meses presentes', () => {
    const series = groupByPeriodo(filterByTipoDato(ROWS, 'real'), { fillGaps: false });
    assert.deepEqual(
      series.map((point) => point.periodo),
      ['2026-01', '2026-03'],
    );
  });

  it('devuelve vacío sin filas', () => {
    assert.deepEqual(groupByPeriodo([]), []);
  });
});

describe('buildComparison', () => {
  it('cruza real contra objetivo por categoría', () => {
    const comparison = buildComparison(ROWS, 'sede');

    const madrid = comparison.find((item) => item.key === 'Madrid');
    assert.equal(madrid.real, 1500);
    assert.equal(madrid.objetivo, 1500);
    assert.equal(madrid.cumplimiento, 1);
    assert.equal(madrid.diff, 0);

    const sevilla = comparison.find((item) => item.key === 'Sevilla');
    assert.equal(sevilla.real, 2000);
    assert.equal(sevilla.objetivo, 1000);
    assert.equal(sevilla.cumplimiento, 2);
    assert.equal(sevilla.diff, 1000);
  });

  it('deja cumplimiento en null cuando no hay objetivo, no en 0 ni Infinity', () => {
    const rows = buildRows([['2026-01-10', 'Máster', 'Digital', 'Bilbao', 500, 'Real']]);
    const [bilbao] = buildComparison(rows, 'sede');

    assert.equal(bilbao.real, 500);
    assert.equal(bilbao.objetivo, 0);
    assert.equal(bilbao.cumplimiento, null);
  });

  it('incluye categorías que sólo tienen objetivo', () => {
    const rows = buildRows([['2026-01-10', 'Máster', 'Digital', 'Valencia', 900, 'Objetivo']]);
    const [valencia] = buildComparison(rows, 'sede');

    assert.equal(valencia.real, 0);
    assert.equal(valencia.objetivo, 900);
    assert.equal(valencia.cumplimiento, 0);
  });
});

describe('summarize', () => {
  it('resume las cifras de la pestaña', () => {
    const summary = summarize(filterByTipoDato(ROWS, 'real'), 'tipoFormacion');

    assert.equal(summary.total, 3500);
    assert.equal(summary.registros, 3);
    assert.equal(summary.categorias, 2);
    assert.equal(summary.periodos, 2); // sólo meses con datos
    assert.equal(summary.mediaMensual, 1750);
    assert.equal(summary.periodoMin, '2026-01');
    assert.equal(summary.periodoMax, '2026-03');
    assert.equal(summary.top.key, 'Máster');
  });

  it('no divide por cero sin filas', () => {
    const summary = summarize([], 'sede');
    assert.equal(summary.total, 0);
    assert.equal(summary.mediaMensual, 0);
    assert.equal(summary.top, null);
    assert.equal(summary.periodoMin, null);
  });
});

describe('getUniqueValues', () => {
  it('devuelve valores únicos ordenados', () => {
    assert.deepEqual(getUniqueValues(ROWS, 'sede'), ['Madrid', 'Sevilla']);
  });
});
