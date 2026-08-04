import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseCanal, parseMatriculas, parseSheetRows, parseTipoMatricula } from './excelParser.js';

const CABECERA_BASE = ['Fecha', 'Tipo Formación', 'Área', 'Sede', 'Ingreso', 'Tipo Dato'];
const FILA_BASE = ['2026-02-10', 'Máster', 'Digital', 'Madrid', 1000, 'Real'];

describe('parseCanal', () => {
  it('reconoce online y sus sinónimos', () => {
    for (const v of ['Online', 'ONLINE', 'on-line', 'Web', 'Internet', 'Digital']) {
      assert.equal(parseCanal(v), 'online', v);
    }
  });

  it('reconoce offline y sus sinónimos', () => {
    for (const v of ['Offline', 'off line', 'Presencial', 'Teléfono', 'Oficina']) {
      assert.equal(parseCanal(v), 'offline', v);
    }
  });

  it('no adivina un valor desconocido', () => {
    assert.equal(parseCanal('Whatsapp'), null);
    assert.equal(parseCanal(''), null);
    assert.equal(parseCanal(null), null);
  });
});

describe('parseTipoMatricula', () => {
  it('reconoce matrícula nueva', () => {
    for (const v of ['Nueva', 'nuevas', 'Alta', 'New', 'New Enrolment']) {
      assert.equal(parseTipoMatricula(v), 'nueva', v);
    }
  });

  it('reconoce renovación', () => {
    for (const v of ['Renovación', 'renovaciones', 'Re-matrícula', 'Renewal', 'Continuidad']) {
      assert.equal(parseTipoMatricula(v), 'renovacion', v);
    }
  });

  it('no adivina un valor desconocido', () => {
    assert.equal(parseTipoMatricula('Traslado'), null);
    assert.equal(parseTipoMatricula(null), null);
  });
});

describe('parseMatriculas', () => {
  it('acepta enteros, incluido el cero', () => {
    assert.equal(parseMatriculas(12), 12);
    assert.equal(parseMatriculas('12'), 12);
    assert.equal(parseMatriculas('1.234'), 1234);
    assert.equal(parseMatriculas(0), 0);
  });

  it('rechaza decimales: media matrícula no existe', () => {
    assert.equal(parseMatriculas('12,5'), null);
    assert.equal(parseMatriculas(3.7), null);
  });

  it('rechaza negativos', () => {
    assert.equal(parseMatriculas(-4), null);
  });

  it('celda vacía es null, no cero', () => {
    assert.equal(parseMatriculas(''), null);
    assert.equal(parseMatriculas(null), null);
    assert.equal(parseMatriculas('   '), null);
  });
});

describe('parseSheetRows con columnas opcionales', () => {
  it('un Excel SIN las columnas nuevas sigue importándose', () => {
    const res = parseSheetRows([CABECERA_BASE, FILA_BASE]);
    assert.equal(res.ok, true);
    assert.equal(res.rows.length, 1);
    assert.equal(res.rows[0].canal, null);
    assert.equal(res.rows[0].tipoMatricula, null);
    assert.equal(res.rows[0].matriculas, null);
    // Y no genera incidencias por columnas que simplemente no están.
    assert.equal(res.issues.filter((i) => i.severity === 'error').length, 0);
  });

  it('lee canal, tipo de matrícula y recuento cuando están', () => {
    const res = parseSheetRows([
      [...CABECERA_BASE, 'Canal', 'Tipo Matrícula', 'Matrículas'],
      [...FILA_BASE, 'Online', 'Nueva', 3],
    ]);
    assert.equal(res.ok, true);
    assert.equal(res.rows[0].canal, 'online');
    assert.equal(res.rows[0].tipoMatricula, 'nueva');
    assert.equal(res.rows[0].matriculas, 3);
  });

  it('un valor ilegible avisa pero NO descarta la fila', () => {
    const res = parseSheetRows([
      [...CABECERA_BASE, 'Canal'],
      [...FILA_BASE, 'Paloma mensajera'],
    ]);
    assert.equal(res.ok, true, 'la fila debe importarse: el ingreso es válido');
    assert.equal(res.rows.length, 1);
    assert.equal(res.rows[0].canal, null);
    const avisos = res.issues.filter((i) => i.severity === 'warning');
    assert.ok(
      avisos.some((i) => i.column === 'Canal' && i.row === 2),
      'debe avisar del canal con su número de fila',
    );
  });

  it('una celda opcional vacía no genera aviso', () => {
    const res = parseSheetRows([
      [...CABECERA_BASE, 'Canal', 'Matrículas'],
      [...FILA_BASE, '', null],
    ]);
    assert.equal(res.ok, true);
    assert.equal(res.issues.filter((i) => i.column === 'Canal').length, 0);
    assert.equal(res.issues.filter((i) => i.column === 'Matrículas').length, 0);
  });

  it('cada fila lleva su temporada de convocatoria', () => {
    const res = parseSheetRows([
      CABECERA_BASE,
      ['2026-02-10', 'Máster', 'Digital', 'Madrid', 1000, 'Real'],
      ['2026-07-01', 'Máster', 'Digital', 'Madrid', 2000, 'Real'],
      ['2026-11-20', 'Máster', 'Digital', 'Madrid', 3000, 'Real'],
    ]);
    assert.deepEqual(
      res.rows.map((r) => r.temporada),
      ['2026-enero', '2026-junio', '2026-octubre'],
    );
  });
});
