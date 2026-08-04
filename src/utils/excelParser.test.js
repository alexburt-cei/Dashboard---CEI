import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  SIN_ESPECIFICAR,
  excelSerialToDate,
  findHeaderRowIndex,
  mapColumns,
  normalizeKey,
  parseCategoria,
  parseFecha,
  parseIngreso,
  parseSheetRows,
  parseTipoDato,
  toPeriodo,
} from './excelParser.js';

/** Helper: 'YYYY-MM-DD' de una fecha, leído en UTC. */
function iso(date) {
  return date === null ? null : date.toISOString().slice(0, 10);
}

describe('normalizeKey', () => {
  it('quita acentos, baja a minúsculas y colapsa separadores', () => {
    assert.equal(normalizeKey('Tipo Formación'), 'tipo formacion');
    assert.equal(normalizeKey('TIPO_FORMACION'), 'tipo formacion');
    assert.equal(normalizeKey('  Área  '), 'area');
    assert.equal(normalizeKey('Tipo-de-Dato'), 'tipo de dato');
  });

  it('devuelve cadena vacía para nulos', () => {
    assert.equal(normalizeKey(null), '');
    assert.equal(normalizeKey(undefined), '');
  });
});

describe('mapColumns', () => {
  it('empareja las cabeceras del enunciado', () => {
    const { indexes, missing } = mapColumns([
      'Fecha',
      'Tipo Formación',
      'Área',
      'Sede',
      'Ingreso',
      'Tipo Dato',
    ]);

    assert.deepEqual(indexes, {
      fecha: 0,
      tipoFormacion: 1,
      area: 2,
      sede: 3,
      ingreso: 4,
      tipoDato: 5,
    });
    assert.deepEqual(missing, []);
  });

  it('tolera acentos ausentes, mayúsculas y guiones bajos', () => {
    const { missing } = mapColumns([
      'FECHA',
      'tipo_formacion',
      'area',
      'SEDE',
      'ingresos',
      'tipo dato',
    ]);
    assert.deepEqual(missing, []);
  });

  it('informa de las columnas que faltan', () => {
    const { missing } = mapColumns(['Fecha', 'Ingreso']);
    assert.deepEqual(missing, ['tipoFormacion', 'area', 'sede', 'tipoDato']);
  });

  it('no confunde "Tipo Formación" con "Tipo Dato"', () => {
    const { indexes } = mapColumns(['Tipo Formación', 'Tipo']);
    assert.equal(indexes.tipoFormacion, 0);
    assert.equal(indexes.tipoDato, 1);
  });

  it('se queda con la primera columna duplicada y reporta la segunda', () => {
    const { indexes, duplicates } = mapColumns(['Ingreso', 'Importe']);
    assert.equal(indexes.ingreso, 0);
    assert.equal(duplicates.length, 1);
    assert.equal(duplicates[0].field, 'ingreso');
  });

  it('reporta columnas desconocidas sin romper el mapeo', () => {
    const { indexes, unknown } = mapColumns(['Fecha', 'Comentarios']);
    assert.equal(indexes.fecha, 0);
    assert.deepEqual(unknown, [{ index: 1, header: 'Comentarios' }]);
  });
});

describe('findHeaderRowIndex', () => {
  it('salta título y filas en blanco por encima de la cabecera', () => {
    const matrix = [
      ['Informe de ingresos 2026', null, null],
      [],
      ['Fecha', 'Tipo Formación', 'Área', 'Sede', 'Ingreso', 'Tipo Dato'],
      ['2026-01-15', 'Máster', 'Digital', 'Madrid', 1000, 'Real'],
    ];
    assert.equal(findHeaderRowIndex(matrix), 2);
  });

  it('devuelve -1 si ninguna fila parece cabecera', () => {
    assert.equal(findHeaderRowIndex([['a', 'b'], ['c', 'd']]), -1);
    assert.equal(findHeaderRowIndex([]), -1);
  });
});

describe('excelSerialToDate', () => {
  it('convierte seriales modernos', () => {
    // 45000 = 2023-03-15 en Excel
    assert.equal(iso(excelSerialToDate(45000)), '2023-03-15');
  });

  it('mapea el serial 1 al 1 de enero de 1900 (bug del 1900 bisiesto)', () => {
    assert.equal(iso(excelSerialToDate(1)), '1900-01-01');
  });

  it('mapea el serial 61 al 1 de marzo de 1900', () => {
    assert.equal(iso(excelSerialToDate(61)), '1900-03-01');
  });

  it('ignora la parte fraccionaria (hora)', () => {
    assert.equal(iso(excelSerialToDate(45000.75)), '2023-03-15');
  });

  it('rechaza valores fuera de rango', () => {
    assert.equal(excelSerialToDate(0), null);
    assert.equal(excelSerialToDate(-5), null);
    assert.equal(excelSerialToDate(Number.NaN), null);
    assert.equal(excelSerialToDate('45000'), null);
  });
});

describe('parseFecha', () => {
  it('acepta seriales de Excel', () => {
    assert.equal(iso(parseFecha(45000)), '2023-03-15');
  });

  it('acepta ISO con y sin día, y con hora', () => {
    assert.equal(iso(parseFecha('2026-01-31')), '2026-01-31');
    assert.equal(iso(parseFecha('2026-01')), '2026-01-01');
    assert.equal(iso(parseFecha('2026-01-31T10:30:00Z')), '2026-01-31');
  });

  it('interpreta dd/mm/yyyy como día primero (convención española)', () => {
    assert.equal(iso(parseFecha('31/01/2026')), '2026-01-31');
    assert.equal(iso(parseFecha('01/02/2026')), '2026-02-01');
    assert.equal(iso(parseFecha('31-01-2026')), '2026-01-31');
    assert.equal(iso(parseFecha('31.01.2026')), '2026-01-31');
  });

  it('invierte a mm/dd sólo cuando el primer número no puede ser mes', () => {
    assert.equal(iso(parseFecha('01/31/2026')), '2026-01-31');
  });

  it('expande años de dos cifras', () => {
    assert.equal(iso(parseFecha('31/01/26')), '2026-01-31');
    assert.equal(iso(parseFecha('31/01/85')), '1985-01-31');
  });

  it('acepta mes/año y nombres de mes en español', () => {
    assert.equal(iso(parseFecha('01/2026')), '2026-01-01');
    assert.equal(iso(parseFecha('ene-2026')), '2026-01-01');
    assert.equal(iso(parseFecha('enero 2026')), '2026-01-01');
    assert.equal(iso(parseFecha('dic 2025')), '2025-12-01');
    assert.equal(iso(parseFecha('31 de enero de 2026')), '2026-01-31');
  });

  it('normaliza objetos Date leyendo componentes UTC', () => {
    assert.equal(iso(parseFecha(new Date('2026-01-31T23:59:00Z'))), '2026-01-31');
  });

  it('rechaza fechas imposibles y basura', () => {
    assert.equal(parseFecha('31/02/2026'), null);
    assert.equal(parseFecha('00/01/2026'), null);
    assert.equal(parseFecha('13/13/2026'), null);
    assert.equal(parseFecha('no es fecha'), null);
    assert.equal(parseFecha(''), null);
    assert.equal(parseFecha(null), null);
    assert.equal(parseFecha(new Date('inválida')), null);
  });
});

describe('parseIngreso', () => {
  it('deja pasar los números tal cual', () => {
    assert.equal(parseIngreso(1234.56), 1234.56);
    assert.equal(parseIngreso(0), 0);
    assert.equal(parseIngreso(-500), -500);
  });

  it('lee formato español con punto de miles y coma decimal', () => {
    assert.equal(parseIngreso('1.234,56'), 1234.56);
    assert.equal(parseIngreso('1.234.567,89'), 1234567.89);
    assert.equal(parseIngreso('1.234,56 €'), 1234.56);
  });

  it('lee formato anglosajón', () => {
    assert.equal(parseIngreso('1,234.56'), 1234.56);
    assert.equal(parseIngreso('1,234,567'), 1234567);
  });

  it('con sólo comas aplica la convención española (coma decimal)', () => {
    assert.equal(parseIngreso('1,50'), 1.5);
    assert.equal(parseIngreso('0,5'), 0.5);
  });

  it('con sólo puntos distingue miles de decimal por grupos de tres', () => {
    assert.equal(parseIngreso('1.234'), 1234);
    assert.equal(parseIngreso('1.234.567'), 1234567);
    assert.equal(parseIngreso('12.5'), 12.5);
    assert.equal(parseIngreso('1.2345'), 1.2345);
  });

  it('acepta negativos con signo delante, detrás o entre paréntesis', () => {
    assert.equal(parseIngreso('-1.234,56'), -1234.56);
    assert.equal(parseIngreso('1.234,56-'), -1234.56);
    assert.equal(parseIngreso('(1.234,56)'), -1234.56);
  });

  it('ignora espacios no rompibles que Excel usa como separador de miles', () => {
    assert.equal(parseIngreso('1 234,56'), 1234.56);
    assert.equal(parseIngreso('1 234,56'), 1234.56);
  });

  it('rechaza lo que no es un importe', () => {
    assert.equal(parseIngreso(''), null);
    assert.equal(parseIngreso(null), null);
    assert.equal(parseIngreso('pendiente'), null);
    assert.equal(parseIngreso('12 unidades'), null);
    assert.equal(parseIngreso(true), null);
    assert.equal(parseIngreso(Number.POSITIVE_INFINITY), null);
    assert.equal(parseIngreso('1.2.3'), null);
  });
});

describe('parseTipoDato', () => {
  it('reconoce las variantes de real', () => {
    ['Real', 'real', 'REALES', 'Realizado', 'Ejecutado'].forEach((value) => {
      assert.equal(parseTipoDato(value), 'real', value);
    });
  });

  it('reconoce las variantes de objetivo', () => {
    ['Objetivo', 'objetivos', 'TARGET', 'Meta', 'Presupuesto'].forEach((value) => {
      assert.equal(parseTipoDato(value), 'objetivo', value);
    });
  });

  it('devuelve null ante un valor desconocido en vez de adivinar', () => {
    assert.equal(parseTipoDato('estimado a ojo'), null);
    assert.equal(parseTipoDato(''), null);
    assert.equal(parseTipoDato(null), null);
  });
});

describe('parseCategoria', () => {
  it('conserva la capitalización y colapsa espacios', () => {
    assert.equal(parseCategoria('  Máster   Oficial '), 'Máster Oficial');
  });

  it('marca los vacíos', () => {
    assert.equal(parseCategoria(''), SIN_ESPECIFICAR);
    assert.equal(parseCategoria(null), SIN_ESPECIFICAR);
    assert.equal(parseCategoria('   '), SIN_ESPECIFICAR);
  });
});

describe('toPeriodo', () => {
  it('devuelve la clave YYYY-MM en UTC', () => {
    assert.equal(toPeriodo(new Date(Date.UTC(2026, 0, 31))), '2026-01');
    assert.equal(toPeriodo(new Date(Date.UTC(2026, 11, 1))), '2026-12');
  });
});

const HEADER = ['Fecha', 'Tipo Formación', 'Área', 'Sede', 'Ingreso', 'Tipo Dato'];

describe('parseSheetRows', () => {
  it('parsea una hoja válida', () => {
    const result = parseSheetRows([
      HEADER,
      ['2026-01-15', 'Máster', 'Digital', 'Madrid', '1.200,50', 'Real'],
      ['2026-02-20', 'Curso', 'Marketing', 'Sevilla', 800, 'Objetivo'],
    ]);

    assert.equal(result.ok, true);
    assert.equal(result.rows.length, 2);
    assert.equal(result.meta.importedRows, 2);
    assert.equal(result.meta.skippedRows, 0);
    assert.deepEqual(result.meta.tipos, { real: 1, objetivo: 1 });
    assert.equal(result.meta.periodoMin, '2026-01');
    assert.equal(result.meta.periodoMax, '2026-02');

    const [first] = result.rows;
    assert.equal(first.id, 2); // fila 2 de la hoja, 1-based
    assert.equal(first.periodo, '2026-01');
    assert.equal(first.anio, 2026);
    assert.equal(first.ingreso, 1200.5);
    assert.equal(first.tipoDato, 'real');
    assert.equal(first.tipoFormacion, 'Máster');
  });

  it('falla con mensaje claro si faltan columnas obligatorias', () => {
    const result = parseSheetRows([
      ['Fecha', 'Área', 'Sede', 'Ingreso'],
      ['2026-01-15', 'Digital', 'Madrid', 100],
    ]);

    assert.equal(result.ok, false);
    assert.deepEqual(result.rows, []);
    const error = result.issues.find((issue) => issue.severity === 'error');
    assert.match(error.message, /Faltan columnas obligatorias/);
    assert.match(error.message, /Tipo Formación/);
    assert.match(error.message, /Tipo Dato/);
  });

  it('descarta filas inválidas y las reporta con su número de fila', () => {
    const result = parseSheetRows([
      HEADER,
      ['2026-01-15', 'Máster', 'Digital', 'Madrid', 1000, 'Real'],
      ['no es fecha', 'Máster', 'Digital', 'Madrid', 1000, 'Real'],
      ['2026-01-15', 'Máster', 'Digital', 'Madrid', 'pendiente', 'Real'],
      ['2026-01-15', 'Máster', 'Digital', 'Madrid', 1000, 'quizá'],
    ]);

    assert.equal(result.ok, true);
    assert.equal(result.rows.length, 1);
    assert.equal(result.meta.skippedRows, 3);

    const errors = result.issues.filter((issue) => issue.severity === 'error');
    assert.equal(errors.length, 3);
    assert.deepEqual(
      errors.map((issue) => issue.row),
      [3, 4, 5],
    );
    assert.equal(errors[0].column, 'Fecha');
    assert.equal(errors[1].column, 'Ingreso');
    assert.equal(errors[2].column, 'Tipo Dato');
  });

  it('ignora filas en blanco sin contarlas como descartadas', () => {
    const result = parseSheetRows([
      HEADER,
      ['2026-01-15', 'Máster', 'Digital', 'Madrid', 1000, 'Real'],
      [],
      [null, null, null, null, null, null],
      ['   ', '', '', '', '', ''],
      ['2026-02-15', 'Curso', 'Digital', 'Madrid', 500, 'Real'],
    ]);

    assert.equal(result.rows.length, 2);
    assert.equal(result.meta.totalRows, 2);
    assert.equal(result.meta.skippedRows, 0);
  });

  it('marca las categorías vacías en vez de dejar barras sin nombre', () => {
    const result = parseSheetRows([
      HEADER,
      ['2026-01-15', '', 'Digital', 'Madrid', 1000, 'Real'],
    ]);

    assert.equal(result.rows[0].tipoFormacion, SIN_ESPECIFICAR);
  });

  it('encuentra la cabecera aunque haya título encima', () => {
    const result = parseSheetRows([
      ['Ingresos 2026'],
      [],
      HEADER,
      ['2026-01-15', 'Máster', 'Digital', 'Madrid', 1000, 'Real'],
    ]);

    assert.equal(result.ok, true);
    assert.equal(result.meta.headerRowIndex, 2);
    assert.equal(result.rows[0].id, 4);
  });

  it('no lanza con una hoja vacía', () => {
    const result = parseSheetRows([]);
    assert.equal(result.ok, false);
    assert.equal(result.rows.length, 0);
    assert.equal(result.issues.length, 1);
  });

  it('cuenta el mes correcto en fechas de fin de mes (sin desfase de zona)', () => {
    // Un 1 de enero leído con getters locales en UTC-X se cuenta en diciembre.
    const result = parseSheetRows([
      HEADER,
      ['2026-01-01', 'Máster', 'Digital', 'Madrid', 100, 'Real'],
      ['2026-12-31', 'Máster', 'Digital', 'Madrid', 100, 'Real'],
    ]);

    assert.equal(result.rows[0].periodo, '2026-01');
    assert.equal(result.rows[1].periodo, '2026-12');
  });
});
