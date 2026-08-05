import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  areaPath,
  buildScale,
  labelInterval,
  linePath,
  nearestIndex,
  niceStep,
} from './scale.js';

describe('niceStep', () => {
  it('redondea al paso legible más cercano', () => {
    assert.equal(niceStep(1), 1);
    assert.equal(niceStep(1.2), 1);
    assert.equal(niceStep(1.5), 2);
    assert.equal(niceStep(2.1), 2);
    assert.equal(niceStep(3), 2.5);
    assert.equal(niceStep(4), 5);
    assert.equal(niceStep(7), 5);
    assert.equal(niceStep(8), 10);
  });

  it('funciona en cualquier orden de magnitud', () => {
    assert.equal(niceStep(1300), 1000);
    assert.equal(niceStep(9000), 10000);
    assert.equal(niceStep(0.03), 0.025);
  });

  it('no devuelve 0 ni NaN ante entradas inválidas', () => {
    assert.equal(niceStep(0), 1);
    assert.equal(niceStep(-5), 1);
    assert.equal(niceStep(Number.NaN), 1);
  });
});

describe('buildScale', () => {
  it('produce ticks redondos que cubren el máximo', () => {
    const scale = buildScale(0, 51000);

    assert.equal(scale.min, 0);
    assert.ok(scale.max >= 51000, 'el eje debe llegar al máximo');
    assert.deepEqual(scale.ticks, [0, 10000, 20000, 30000, 40000, 50000, 60000]);
  });

  it('el eje siempre cubre el máximo de los datos', () => {
    // Barrido: si el eje se quedara corto, una barra se saldría del trazado.
    for (let max = 1; max <= 250000; max += 137) {
      const scale = buildScale(0, max);
      assert.ok(scale.max >= max, `eje ${scale.max} < datos ${max}`);
      assert.ok(scale.position(max) <= 1 + 1e-9, `posición fuera de rango con ${max}`);
    }
  });

  it('incluye siempre el cero aunque los datos no bajen de ahí', () => {
    const scale = buildScale(30000, 51000);
    assert.equal(scale.min, 0);
    assert.equal(scale.ticks[0], 0);
  });

  it('coloca el mínimo en 0 y el máximo en 1', () => {
    const scale = buildScale(0, 100);
    assert.equal(scale.position(scale.min), 0);
    assert.equal(scale.position(scale.max), 1);
  });

  it('es proporcional: la mitad del eje es la mitad del valor', () => {
    const scale = buildScale(0, 100);
    assert.equal(scale.position(scale.max / 2), 0.5);
  });

  it('no arrastra error de coma flotante en los ticks', () => {
    const scale = buildScale(0, 0.7);
    scale.ticks.forEach((tick) => {
      // Sin acumulación, cada tick es un múltiplo exacto del paso.
      const multiples = tick / scale.step;
      assert.ok(
        Math.abs(multiples - Math.round(multiples)) < 1e-9,
        `tick ${tick} no es múltiplo limpio de ${scale.step}`,
      );
    });
  });

  it('extiende el dominio a un tick por debajo con valores negativos', () => {
    const scale = buildScale(-1500, 4000);

    assert.ok(scale.min <= -1500);
    assert.ok(scale.max >= 4000);
    assert.ok(scale.ticks.includes(0), 'el cero debe caer en un tick');
  });

  it('no divide por cero cuando todo vale cero', () => {
    const scale = buildScale(0, 0);
    assert.deepEqual(scale.ticks, [0, 1]);
    assert.equal(scale.position(0), 0);
    assert.ok(Number.isFinite(scale.position(0)));
  });

  it('tolera entradas no finitas', () => {
    const scale = buildScale(Number.NaN, Number.NaN);
    assert.ok(Number.isFinite(scale.min));
    assert.ok(Number.isFinite(scale.max));
  });
});

describe('labelInterval', () => {
  it('etiqueta todos cuando caben', () => {
    assert.equal(labelInterval(6, 6), 1);
    assert.equal(labelInterval(3, 6), 1);
  });

  it('espacia las etiquetas cuando no caben', () => {
    assert.equal(labelInterval(24, 6), 4);
    assert.equal(labelInterval(12, 5), 3);
  });

  it('nunca devuelve menos de 1', () => {
    assert.equal(labelInterval(0, 6), 1);
    assert.equal(labelInterval(6, 0), 6);
  });
});

describe('linePath / areaPath', () => {
  it('genera una polilínea', () => {
    const path = linePath([
      { x: 0, y: 10 },
      { x: 5, y: 20 },
    ]);
    assert.equal(path, 'M0.00 10.00 L5.00 20.00');
  });

  it('cierra el área contra la base', () => {
    const path = areaPath(
      [
        { x: 0, y: 10 },
        { x: 5, y: 20 },
      ],
      50,
    );
    assert.ok(path.endsWith('Z'), 'el área tiene que cerrarse');
    assert.ok(path.includes('L5.00 50.00'), 'debe bajar a la base en el último punto');
    assert.ok(path.includes('L0.00 50.00'), 'y volver por la base al primero');
  });

  it('devuelve cadena vacía sin puntos', () => {
    assert.equal(linePath([]), '');
    assert.equal(areaPath([], 10), '');
  });
});

describe('nearestIndex', () => {
  it('encuentra el punto más cercano', () => {
    const xs = [0, 10, 20, 30];
    assert.equal(nearestIndex(xs, 0), 0);
    assert.equal(nearestIndex(xs, 12), 1);
    assert.equal(nearestIndex(xs, 16), 2);
    assert.equal(nearestIndex(xs, 100), 3);
  });

  it('devuelve -1 sin puntos', () => {
    assert.equal(nearestIndex([], 5), -1);
  });
});

describe('techo de etiquetas del eje', () => {
  it('no deja que las etiquetas se amontonen hasta solaparse', () => {
    // El caso observado: máximo 73.000 daba nueve marcas y las dos últimas se
    // tocaban en pantalla, leyéndose «70 k80 k».
    const scale = buildScale(0, 73000);
    assert.ok(scale.ticks.length <= 7, `${scale.ticks.length} marcas es demasiado`);
    assert.deepEqual(scale.ticks, [0, 20000, 40000, 60000, 80000]);
  });

  it('respeta el paso más cercano cuando el resultado cabe', () => {
    // Decisión previa del módulo, que este techo no debe deshacer: 51.000 con
    // seis marcas en vez de cuatro.
    assert.deepEqual(buildScale(0, 51000).ticks, [0, 10000, 20000, 30000, 40000, 50000, 60000]);
  });

  it('mantiene el techo en todo un barrido, sin dejar de cubrir el máximo', () => {
    for (let max = 1; max <= 500000; max += 313) {
      const scale = buildScale(0, max);
      assert.ok(scale.ticks.length <= 7, `${max} produjo ${scale.ticks.length} marcas`);
      assert.ok(scale.max >= max, `el eje ${scale.max} no cubre ${max}`);
    }
  });

  it('honra un targetTicks distinto', () => {
    assert.ok(buildScale(0, 73000, 3).ticks.length <= 5);
    assert.ok(buildScale(0, 73000, 10).ticks.length <= 12);
  });
});
