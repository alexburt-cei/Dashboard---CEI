import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFAULT_SCOPE_SLUG,
  SCOPES,
  filterByScope,
  getScopeBySlug,
} from './scopes.js';

/** Fila mínima con lo que mira el recorte. */
const fila = (sede, canal = null) => ({ sede, canal, ingreso: 1, tipoDato: 'real' });

describe('registro de ámbitos', () => {
  it('son seis, en el orden pedido', () => {
    assert.deepEqual(
      SCOPES.map((s) => s.slug),
      ['madrid', 'sevilla', 'valencia', 'online', 'presencial', 'total'],
    );
  });

  it('se entra por Total', () => {
    assert.equal(DEFAULT_SCOPE_SLUG, 'total');
    assert.ok(getScopeBySlug('total'));
  });
});

describe('sedes físicas', () => {
  const rows = [fila('Madrid'), fila('Sevilla'), fila('Valencia'), fila('Online')];

  it('cada sede se lleva sólo lo suyo', () => {
    assert.equal(filterByScope(rows, 'madrid').length, 1);
    assert.equal(filterByScope(rows, 'sevilla').length, 1);
    assert.equal(filterByScope(rows, 'valencia').length, 1);
  });

  it('no distingue mayúsculas ni acentos', () => {
    assert.equal(filterByScope([fila('MADRID'), fila('madrid')], 'madrid').length, 2);
  });
});

describe('online', () => {
  it('lo reconoce cuando viene como sede', () => {
    assert.equal(filterByScope([fila('Online'), fila('Madrid')], 'online').length, 1);
  });

  it('lo reconoce cuando viene como canal', () => {
    const rows = [fila('Madrid', 'online'), fila('Madrid', 'offline')];
    assert.equal(filterByScope(rows, 'online').length, 1);
  });

  it('una fila online NO cuenta además en su sede física', () => {
    // Si contara en las dos, Presencial + Online superaría al Total y el panel
    // enseñaría más dinero del que hay.
    const rows = [fila('Madrid', 'online'), fila('Madrid', 'offline')];
    assert.equal(filterByScope(rows, 'madrid').length, 1);
    assert.equal(filterByScope(rows, 'presencial').length, 1);
  });

  it('vale cualquiera de las dos formas a la vez', () => {
    const rows = [fila('Online'), fila('Madrid', 'online'), fila('Sevilla')];
    assert.equal(
      filterByScope(rows, 'online').length,
      2,
      'da igual si el centro modela lo online como sede o como canal',
    );
  });
});

describe('presencial', () => {
  it('es exactamente Madrid + Valencia + Sevilla', () => {
    const rows = [fila('Madrid'), fila('Valencia'), fila('Sevilla'), fila('Online')];
    const presencial = filterByScope(rows, 'presencial');
    assert.equal(presencial.length, 3);
    assert.ok(!presencial.some((r) => r.sede === 'Online'));
  });

  it('su total es la suma de las tres sedes', () => {
    const rows = [fila('Madrid'), fila('Valencia'), fila('Sevilla'), fila('Online')];
    const suma = ['madrid', 'valencia', 'sevilla'].reduce(
      (acc, slug) => acc + filterByScope(rows, slug).length,
      0,
    );
    assert.equal(filterByScope(rows, 'presencial').length, suma);
  });

  it('una sede nueva NO entra en presencial sin decidirlo', () => {
    // Se define como pertenencia a las tres sedes, no como «lo que no es
    // online»: así una sede nueva no se cuela en el agregado por descarte.
    const rows = [fila('Madrid'), fila('Bilbao')];
    assert.equal(filterByScope(rows, 'presencial').length, 1);
  });
});

describe('total', () => {
  it('no filtra nada', () => {
    const rows = [fila('Madrid'), fila('Online'), fila('Bilbao'), fila(null)];
    assert.equal(filterByScope(rows, 'total').length, rows.length);
  });

  it('Presencial + Online = Total cuando todo está clasificado', () => {
    // La aritmética que se espera de estas pestañas, con las dos formas de
    // modelar lo online mezcladas en el mismo archivo.
    const rows = [
      fila('Madrid', 'offline'),
      fila('Sevilla', 'offline'),
      fila('Valencia'),
      fila('Madrid', 'online'),
      fila('Online'),
    ];
    const presencial = filterByScope(rows, 'presencial').length;
    const online = filterByScope(rows, 'online').length;
    assert.equal(presencial, 3);
    assert.equal(online, 2);
    assert.equal(presencial + online, filterByScope(rows, 'total').length);
  });

  it('las tres sedes suman exactamente Presencial, sin solapes', () => {
    const rows = [
      fila('Madrid', 'offline'),
      fila('Madrid', 'online'),
      fila('Sevilla'),
      fila('Valencia'),
    ];
    const suma = ['madrid', 'sevilla', 'valencia'].reduce(
      (acc, slug) => acc + filterByScope(rows, slug).length,
      0,
    );
    assert.equal(suma, filterByScope(rows, 'presencial').length);
  });

  it('presencial + online no siempre es el total, y es correcto', () => {
    // Una sede fuera de las tres y sin canal no está en ninguno de los dos
    // agregados. Que Total sea mayor es la señal de que hay algo sin clasificar.
    const rows = [fila('Madrid'), fila('Online'), fila('Bilbao')];
    const presencial = filterByScope(rows, 'presencial').length;
    const online = filterByScope(rows, 'online').length;
    assert.equal(filterByScope(rows, 'total').length, 3);
    assert.equal(presencial + online, 2);
  });
});

describe('robustez', () => {
  it('un slug desconocido devuelve todo, no una pantalla vacía', () => {
    const rows = [fila('Madrid'), fila('Online')];
    assert.equal(filterByScope(rows, 'inventado').length, 2);
    assert.equal(filterByScope(rows, undefined).length, 2);
  });

  it('no lanza con sede vacía', () => {
    const rows = [fila(null), fila(undefined), fila('')];
    for (const slug of SCOPES.map((s) => s.slug)) {
      assert.doesNotThrow(() => filterByScope(rows, slug), slug);
    }
  });
});
