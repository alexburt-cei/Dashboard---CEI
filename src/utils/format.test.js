import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  formatEUR as eur,
  formatEURCompact as eurCompact,
  formatInteger as entero,
  formatSignedEUR as eurSigno,
} from './format.js';

/**
 * `Intl` separa la cifra del símbolo con espacio duro (U+00A0), no con un
 * espacio normal. Comparar contra literales escritos a mano falla por ese
 * carácter invisible, así que se normaliza antes de comparar: lo que se está
 * comprobando es la agrupación de miles, no qué clase de espacio usa ICU.
 */
const norm = (texto) => texto.replace(/\u00a0/g, ' ');
const formatEUR = (v) => norm(eur(v));
const formatEURCompact = (v) => norm(eurCompact(v));
const formatInteger = (v) => norm(entero(v));
const formatSignedEUR = (v) => norm(eurSigno(v));

/**
 * El caso que cubre esto: por omisión, ICU en es-ES no agrupa los enteros de
 * cuatro cifras, así que `9500 €` convivía en la misma columna con `12.000 €`.
 * Son dos notaciones para lo mismo, y en una tabla de importes el ojo compara
 * longitudes de cadena antes que valores.
 */
describe('agrupación de miles', () => {
  it('agrupa también los enteros de cuatro cifras', () => {
    assert.equal(formatEUR(1000), '1.000 €');
    assert.equal(formatEUR(6000), '6.000 €');
    assert.equal(formatEUR(9500), '9.500 €');
  });

  it('no cambia lo que ya se agrupaba', () => {
    assert.equal(formatEUR(12000), '12.000 €');
    assert.equal(formatEUR(73000), '73.000 €');
  });

  it('por debajo de mil no inventa separador', () => {
    assert.equal(formatEUR(950), '950 €');
    assert.equal(formatEUR(0), '0 €');
  });

  it('los deltas con signo agrupan igual', () => {
    assert.equal(formatSignedEUR(-6000), '-6.000 €');
    assert.equal(formatSignedEUR(6000), '+6.000 €');
  });

  it('los recuentos también', () => {
    assert.equal(formatInteger(1234), '1.234');
    assert.equal(formatInteger(9500), '9.500');
  });

  it('toda una columna de importes usa una sola notación', () => {
    // La comprobación que falla si vuelve el fallo: cualquier importe de cuatro
    // cifras o más tiene que llevar separador.
    for (const valor of [1000, 5000, 9999, 10000, 12345, 999999]) {
      assert.ok(
        formatEUR(valor).includes('.'),
        `${valor} debería llevar separador de miles y salió ${formatEUR(valor)}`,
      );
    }
  });
});

describe('formatEURCompact', () => {
  it('por debajo de 10.000 muestra el importe completo, ya agrupado', () => {
    assert.equal(formatEURCompact(9500), '9.500 €');
  });

  it('por encima abrevia', () => {
    assert.ok(/mil/.test(formatEURCompact(66556)), formatEURCompact(66556));
  });
});

describe('valores no finitos', () => {
  it('no revientan ni imprimen NaN', () => {
    for (const fn of [formatEUR, formatEURCompact, formatInteger, formatSignedEUR]) {
      assert.equal(fn(NaN), '—');
      assert.equal(fn(Infinity), '—');
      assert.equal(fn(null), '—');
    }
  });
});
