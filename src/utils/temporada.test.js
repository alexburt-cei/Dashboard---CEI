import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CONVOCATORIAS,
  convocatoriaDe,
  enumerateTemporadas,
  finTemporada,
  fraccionTranscurrida,
  inicioTemporada,
  mesesDeConvocatoria,
  parseTemporadaKey,
  temporadaAnterior,
  temporadaKey,
  temporadaLabel,
  temporadaSiguiente,
} from './temporada.js';

/** Fecha UTC, para no depender de la zona horaria de quien corre los tests. */
const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));

describe('cobertura del año', () => {
  it('las cuatro convocatorias cubren los 12 meses sin huecos ni solapes', () => {
    const cubiertos = CONVOCATORIAS.flatMap((c) => mesesDeConvocatoria(c.id)).sort((a, b) => a - b);
    assert.deepEqual(cubiertos, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('reparte los meses según las convocatorias de CEI', () => {
    assert.deepEqual(mesesDeConvocatoria('enero'), [1, 2, 3]);
    assert.deepEqual(mesesDeConvocatoria('abril'), [4, 5]);
    assert.deepEqual(mesesDeConvocatoria('junio'), [6, 7, 8, 9]);
    assert.deepEqual(mesesDeConvocatoria('octubre'), [10, 11, 12]);
  });
});

describe('convocatoriaDe', () => {
  it('sitúa cada mes en su convocatoria', () => {
    assert.equal(convocatoriaDe(utc(2026, 1, 15)).id, 'enero');
    assert.equal(convocatoriaDe(utc(2026, 3, 31)).id, 'enero');
    assert.equal(convocatoriaDe(utc(2026, 4, 1)).id, 'abril');
    assert.equal(convocatoriaDe(utc(2026, 5, 31)).id, 'abril');
    assert.equal(convocatoriaDe(utc(2026, 6, 1)).id, 'junio');
    assert.equal(convocatoriaDe(utc(2026, 9, 30)).id, 'junio');
    assert.equal(convocatoriaDe(utc(2026, 10, 1)).id, 'octubre');
    assert.equal(convocatoriaDe(utc(2026, 12, 31)).id, 'octubre');
  });

  it('devuelve null con fecha inválida en vez de lanzar', () => {
    assert.equal(convocatoriaDe(new Date('nope')), null);
    assert.equal(convocatoriaDe(null), null);
    assert.equal(convocatoriaDe('2026-01-01'), null);
  });
});

describe('temporadaKey', () => {
  it('combina año y convocatoria', () => {
    assert.equal(temporadaKey(utc(2026, 2, 10)), '2026-enero');
    assert.equal(temporadaKey(utc(2026, 7, 1)), '2026-junio');
    assert.equal(temporadaKey(utc(2025, 11, 20)), '2025-octubre');
  });

  it('el 31 de diciembre no se escapa al año siguiente', () => {
    assert.equal(temporadaKey(utc(2026, 12, 31)), '2026-octubre');
  });
});

describe('temporadaAnterior', () => {
  it('va a la misma convocatoria del año pasado, no al mes anterior', () => {
    assert.equal(temporadaAnterior('2026-abril'), '2025-abril');
    assert.equal(temporadaAnterior('2026-enero'), '2025-enero');
  });

  it('devuelve null con clave inválida', () => {
    assert.equal(temporadaAnterior('2026-mayo'), null);
    assert.equal(temporadaAnterior('basura'), null);
  });
});

describe('temporadaSiguiente', () => {
  it('avanza dentro del año', () => {
    assert.equal(temporadaSiguiente('2026-enero'), '2026-abril');
    assert.equal(temporadaSiguiente('2026-abril'), '2026-junio');
    assert.equal(temporadaSiguiente('2026-junio'), '2026-octubre');
  });

  it('cruza el año al pasar de octubre a enero', () => {
    assert.equal(temporadaSiguiente('2026-octubre'), '2027-enero');
  });
});

describe('inicio y fin', () => {
  it('el inicio es el día 1 del mes de apertura', () => {
    assert.equal(inicioTemporada('2026-junio').toISOString().slice(0, 10), '2026-06-01');
    assert.equal(inicioTemporada('2026-enero').toISOString().slice(0, 10), '2026-01-01');
  });

  it('el fin es exclusivo: el primer día de la siguiente', () => {
    assert.equal(finTemporada('2026-enero').toISOString().slice(0, 10), '2026-04-01');
    assert.equal(finTemporada('2026-junio').toISOString().slice(0, 10), '2026-10-01');
    assert.equal(finTemporada('2026-octubre').toISOString().slice(0, 10), '2027-01-01');
  });

  it('el fin de una temporada es el inicio de la siguiente, sin hueco', () => {
    for (const key of ['2026-enero', '2026-abril', '2026-junio', '2026-octubre']) {
      assert.equal(
        finTemporada(key).getTime(),
        inicioTemporada(temporadaSiguiente(key)).getTime(),
        key,
      );
    }
  });
});

describe('fraccionTranscurrida', () => {
  it('es 0 en el primer instante y 1 al terminar', () => {
    assert.equal(fraccionTranscurrida('2026-enero', utc(2026, 1, 1)), 0);
    assert.equal(fraccionTranscurrida('2026-enero', utc(2026, 4, 1)), 1);
  });

  it('a mitad de la convocatoria ronda 0,5', () => {
    // enero cubre ene-mar (90 días en 2026); mediados de febrero ~ 0,5
    const f = fraccionTranscurrida('2026-enero', utc(2026, 2, 15));
    assert.ok(f > 0.4 && f < 0.6, `esperaba ~0,5 y salió ${f}`);
  });

  it('no extrapola fuera de la temporada', () => {
    assert.equal(fraccionTranscurrida('2026-enero', utc(2025, 6, 1)), 0);
    assert.equal(fraccionTranscurrida('2026-enero', utc(2027, 6, 1)), 1);
  });

  it('con fecha inválida devuelve 0 en vez de NaN', () => {
    assert.equal(fraccionTranscurrida('2026-enero', new Date('nope')), 0);
    assert.equal(fraccionTranscurrida('basura', utc(2026, 2, 1)), 0);
  });
});

describe('enumerateTemporadas', () => {
  it('enumera en orden cronológico, ambos extremos incluidos', () => {
    assert.deepEqual(enumerateTemporadas('2026-enero', '2026-octubre'), [
      '2026-enero',
      '2026-abril',
      '2026-junio',
      '2026-octubre',
    ]);
  });

  it('cruza años pasando por las convocatorias intermedias', () => {
    assert.deepEqual(enumerateTemporadas('2025-octubre', '2026-abril'), [
      '2025-octubre',
      '2026-enero',
      '2026-abril',
    ]);
  });

  it('una sola temporada devuelve un único elemento', () => {
    assert.deepEqual(enumerateTemporadas('2026-junio', '2026-junio'), ['2026-junio']);
  });

  it('un rango invertido devuelve vacío en vez de girar sin fin', () => {
    assert.deepEqual(enumerateTemporadas('2026-octubre', '2025-enero'), []);
  });
});

describe('temporadaLabel y parseTemporadaKey', () => {
  it('etiqueta corta con año', () => {
    assert.equal(temporadaLabel('2026-abril'), 'Abr 2026');
    assert.equal(temporadaLabel('2026-octubre'), 'Oct 2026');
  });

  it('con clave inválida no lanza', () => {
    assert.equal(temporadaLabel('basura'), '—');
    assert.equal(parseTemporadaKey(null), null);
    assert.equal(parseTemporadaKey('2026-mayo'), null);
  });

  it('ida y vuelta', () => {
    const parsed = parseTemporadaKey('2026-junio');
    assert.equal(parsed.anio, 2026);
    assert.equal(parsed.convocatoria.id, 'junio');
  });
});
