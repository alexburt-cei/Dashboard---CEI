import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  aplicarFiltros,
  buildResumenGlobal,
  canalBreakdown,
  crecimientoAnual,
  fechaCorte,
  reporteMensualMatriculas,
  runRate,
  serieComparativa,
  tablaComparativa,
  temporadaActual,
  variacion,
  whereWeStand,
  yearToDate,
} from './resumenGlobal.js';
import { temporadaKey } from './temporada.js';

const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));

/** Construye una fila mínima pero completa, como la que produce el parser. */
function fila(y, m, d, ingreso, tipoDato = 'real', extra = {}) {
  const fecha = utc(y, m, d);
  return {
    id: 1,
    fecha,
    periodo: `${y}-${String(m).padStart(2, '0')}`,
    anio: y,
    temporada: temporadaKey(fecha),
    tipoFormacion: 'Máster',
    area: 'Digital',
    sede: 'Madrid',
    ingreso,
    tipoDato,
    canal: null,
    tipoMatricula: null,
    matriculas: null,
    ...extra,
  };
}

describe('variacion', () => {
  it('calcula la variación relativa', () => {
    assert.equal(variacion(110, 100), 0.1);
    assert.equal(variacion(90, 100), -0.1);
  });

  it('sin base devuelve null, no 0 ni Infinity', () => {
    assert.equal(variacion(100, 0), null);
    assert.equal(variacion(100, null), null);
    assert.equal(variacion(NaN, 100), null);
  });

  it('con base negativa usa su valor absoluto', () => {
    assert.equal(variacion(-50, -100), 0.5);
  });
});

describe('fechaCorte', () => {
  it('es la fecha real más alta, ignorando los objetivos', () => {
    const rows = [
      fila(2026, 1, 10, 100),
      fila(2026, 2, 20, 100),
      fila(2026, 12, 31, 999, 'objetivo'),
    ];
    assert.equal(fechaCorte(rows).toISOString().slice(0, 10), '2026-02-20');
  });

  it('sin filas reales es null', () => {
    assert.equal(fechaCorte([fila(2026, 1, 1, 100, 'objetivo')]), null);
    assert.equal(fechaCorte([]), null);
  });
});

describe('temporadaActual', () => {
  it('sale del corte, no del reloj', () => {
    assert.equal(temporadaActual([fila(2026, 7, 15, 100)]), '2026-junio');
    assert.equal(temporadaActual([fila(2026, 2, 1, 100)]), '2026-enero');
  });
});

describe('runRate', () => {
  it('extrapola el cierre al ritmo actual', () => {
    // Convocatoria de enero 2026 = ene-mar (90 días). Corte 16 feb ~ 50 %.
    const rows = [fila(2026, 1, 15, 500), fila(2026, 2, 16, 500)];
    const rate = runRate(rows);
    assert.equal(rate.acumulado, 1000);
    assert.ok(rate.fraccion > 0.45 && rate.fraccion < 0.55, `fracción ${rate.fraccion}`);
    assert.ok(rate.proyeccion > 1800 && rate.proyeccion < 2200, `proyección ${rate.proyeccion}`);
    assert.ok(rate.pendiente > 0);
  });

  it('no da cifra al principio de la temporada: la extrapolación no diría nada', () => {
    assert.equal(runRate([fila(2026, 1, 1, 100)]), null);
  });

  it('sin datos es null', () => {
    assert.equal(runRate([]), null);
  });
});

describe('whereWeStand', () => {
  it('compara real contra objetivo y contra el objetivo prorrateado', () => {
    const rows = [
      fila(2026, 1, 15, 400),
      fila(2026, 2, 16, 400),
      fila(2026, 1, 15, 2000, 'objetivo'),
    ];
    const s = whereWeStand(rows);
    assert.equal(s.real, 800);
    assert.equal(s.objetivo, 2000);
    assert.equal(s.gap, -1200);
    assert.equal(s.cumplimiento, 0.4);
    // A mitad de temporada lo justo es comparar contra ~la mitad del objetivo.
    assert.ok(s.objetivoProrrateado > 900 && s.objetivoProrrateado < 1100);
    assert.equal(s.ahead, false, '800 va por debajo de ~1000 prorrateado');
  });

  it('marca ahead cuando se supera el objetivo prorrateado', () => {
    const rows = [
      fila(2026, 1, 15, 1500),
      fila(2026, 2, 16, 1),
      fila(2026, 1, 15, 2000, 'objetivo'),
    ];
    assert.equal(whereWeStand(rows).ahead, true);
  });

  it('sin objetivo, cumplimiento es null en vez de dividir por cero', () => {
    const s = whereWeStand([fila(2026, 2, 16, 500)]);
    assert.equal(s.cumplimiento, null);
    assert.equal(s.ahead, null);
  });
});

describe('crecimientoAnual', () => {
  it('compara contra la misma convocatoria del año anterior al mismo avance', () => {
    const rows = [
      // 2025-enero: 100 al principio, 900 al final. Al 50 % sólo cuenta el primero.
      fila(2025, 1, 5, 100),
      fila(2025, 3, 25, 900),
      // 2026-enero, corte a mediados de febrero (~50 %)
      fila(2026, 1, 10, 150),
      fila(2026, 2, 16, 50),
    ];
    const c = crecimientoAnual(rows);
    assert.equal(c.temporada, '2026-enero');
    assert.equal(c.temporadaAnterior, '2025-enero');
    assert.equal(c.actual, 200);
    assert.equal(c.anterior, 100, 'sólo el tramo comparable del año anterior');
    assert.equal(c.anteriorCompleto, 1000, 'la temporada anterior completa, como contexto');
    assert.equal(c.variacion, 1, '200 frente a 100 es +100 %');
    assert.equal(c.hayBase, true);
  });

  it('sin año anterior avisa con hayBase=false y variacion null', () => {
    const c = crecimientoAnual([fila(2026, 2, 16, 500)]);
    assert.equal(c.hayBase, false);
    assert.equal(c.variacion, null);
  });
});

describe('yearToDate', () => {
  it('acota el budget al mismo rango que el real', () => {
    const rows = [
      fila(2026, 1, 10, 300),
      fila(2026, 2, 10, 200),
      fila(2026, 1, 10, 400, 'objetivo'),
      // Objetivo posterior al corte: no debe entrar.
      fila(2026, 11, 30, 5000, 'objetivo'),
    ];
    const y = yearToDate(rows);
    assert.equal(y.real, 500);
    assert.equal(y.budget, 400, 'el presupuesto del futuro no cuenta');
    assert.equal(y.diferencia, 100);
    assert.equal(y.ahead, true);
  });

  it('no mezcla años', () => {
    const rows = [fila(2025, 6, 1, 999), fila(2026, 2, 10, 100)];
    assert.equal(yearToDate(rows).real, 100);
  });
});

describe('tablaComparativa', () => {
  it('devuelve los cuatro grupos con Objetivo/Actual/Diferencia', () => {
    const rows = [
      fila(2026, 1, 15, 400),
      fila(2026, 2, 16, 600),
      fila(2026, 1, 15, 1500, 'objetivo'),
    ];
    const tabla = tablaComparativa(rows);
    assert.deepEqual(
      tabla.map((g) => g.id),
      ['ytd', 'mes', 'temporada', 'proyeccion'],
    );
    const temporada = tabla.find((g) => g.id === 'temporada');
    assert.equal(temporada.actual, 1000);
    assert.equal(temporada.objetivo, 1500);
    assert.equal(temporada.diferencia, -500);
    // La proyección va marcada como estimación, no como dato observado.
    assert.equal(tabla.find((g) => g.id === 'proyeccion').estimado, true);
    assert.equal(temporada.estimado, false);
  });

  it('sin datos devuelve tabla vacía', () => {
    assert.deepEqual(tablaComparativa([]), []);
  });
});

describe('serieComparativa', () => {
  it('da año anterior, actual y proyección, con su tipo de color', () => {
    const rows = [
      fila(2025, 1, 5, 100),
      fila(2026, 1, 10, 300),
      fila(2026, 2, 16, 100),
    ];
    const serie = serieComparativa(rows);
    assert.equal(serie.length, 3);
    assert.equal(serie[0].tipo, 'anterior');
    assert.equal(serie[1].tipo, 'mejor', '400 supera los 100 del año anterior');
    assert.equal(serie[2].tipo, 'proyeccion');
    assert.equal(serie[2].estimado, true);
  });

  it('la barra del año anterior es su acumulado al MISMO avance, no la temporada entera', () => {
    const rows = [
      // 2025-enero: 100 al principio y 900 al final -> 1000 la temporada completa
      fila(2025, 1, 5, 100),
      fila(2025, 3, 25, 900),
      // 2026-enero con corte a mediados de febrero (~50 % de la convocatoria)
      fila(2026, 1, 10, 200),
      fila(2026, 2, 16, 50),
    ];
    const anterior = serieComparativa(rows).find((p) => p.tipo === 'anterior');
    assert.equal(anterior.valor, 100, 'comparable: sólo el tramo equivalente');
    assert.equal(anterior.valorCompleto, 1000, 'el total cerrado viaja aparte, para la tabla');
  });

  it('no pinta al año anterior más alto por estar terminado', () => {
    // El actual (250) supera al comparable del año anterior (100) pero no a su
    // total (1000). La barra debe quedar por encima, coherente con el verde.
    const rows = [
      fila(2025, 1, 5, 100),
      fila(2025, 3, 25, 900),
      fila(2026, 1, 10, 200),
      fila(2026, 2, 16, 50),
    ];
    const serie = serieComparativa(rows);
    const anterior = serie.find((p) => p.tipo === 'anterior');
    const actual = serie.find((p) => p.tipo === 'mejor' || p.tipo === 'peor');
    assert.equal(actual.tipo, 'mejor');
    assert.ok(
      actual.valor > anterior.valor,
      'si va marcado como mejor, su barra no puede ser la más baja',
    );
  });

  it('marca "peor" cuando el actual va por debajo', () => {
    const rows = [fila(2025, 1, 5, 5000), fila(2026, 1, 10, 10), fila(2026, 2, 16, 10)];
    assert.equal(serieComparativa(rows)[1].tipo, 'peor');
  });

  it('sin año anterior omite ese punto en vez de dibujar un 0 engañoso', () => {
    const rows = [fila(2026, 1, 10, 100), fila(2026, 2, 16, 100)];
    const serie = serieComparativa(rows);
    assert.ok(
      !serie.some((p) => p.tipo === 'anterior'),
      'un 0 ahí afirmaría que el año pasado se facturó cero',
    );
    // Y el punto actual queda neutro: sin base, no se juzga mejor ni peor.
    assert.equal(serie.find((p) => !p.estimado).tipo, 'neutro');
  });
});

describe('canalBreakdown', () => {
  it('es null sin columna Canal: el panel se apaga en vez de mostrar ceros', () => {
    assert.equal(canalBreakdown([fila(2026, 2, 16, 100)]), null);
  });

  it('reparte matrículas por canal con su cuota', () => {
    const rows = [
      fila(2026, 1, 10, 600, 'real', { canal: 'online', matriculas: 6 }),
      fila(2026, 2, 16, 400, 'real', { canal: 'offline', matriculas: 4 }),
    ];
    const b = canalBreakdown(rows);
    const online = b.canales.find((c) => c.canal === 'online');
    const offline = b.canales.find((c) => c.canal === 'offline');
    assert.equal(online.matriculas, 6);
    assert.equal(offline.matriculas, 4);
    assert.equal(online.share, 0.6);
    assert.equal(offline.share, 0.4);
  });

  it('compara contra el mismo canal del año anterior', () => {
    const rows = [
      fila(2025, 1, 5, 100, 'real', { canal: 'online', matriculas: 2 }),
      fila(2026, 1, 10, 600, 'real', { canal: 'online', matriculas: 6 }),
      fila(2026, 2, 16, 10, 'real', { canal: 'online', matriculas: 1 }),
    ];
    const online = canalBreakdown(rows).canales.find((c) => c.canal === 'online');
    assert.equal(online.anterior, 2);
    assert.equal(online.estado, 'ahead');
  });

  it('la misma cifra que el año anterior es "plano", no "ahead"', () => {
    const rows = [
      fila(2025, 1, 5, 100, 'real', { canal: 'online', matriculas: 5 }),
      fila(2026, 1, 10, 100, 'real', { canal: 'online', matriculas: 5 }),
      fila(2026, 2, 16, 10, 'real', { canal: 'online', matriculas: 0 }),
    ];
    const online = canalBreakdown(rows).canales.find((c) => c.canal === 'online');
    assert.equal(online.estado, 'plano', 'con la misma cifra no se adelanta a nadie');
  });
});

describe('reporteMensualMatriculas', () => {
  it('es null sin columna Tipo Matrícula', () => {
    assert.equal(reporteMensualMatriculas([fila(2026, 2, 16, 100)]), null);
  });

  it('agrupa nuevas y renovaciones por mes, en orden', () => {
    const rows = [
      fila(2026, 2, 10, 100, 'real', { tipoMatricula: 'nueva', matriculas: 3 }),
      fila(2026, 1, 10, 100, 'real', { tipoMatricula: 'nueva', matriculas: 5 }),
      fila(2026, 1, 20, 100, 'real', { tipoMatricula: 'renovacion', matriculas: 5 }),
    ];
    const rep = reporteMensualMatriculas(rows);
    assert.deepEqual(
      rep.map((r) => r.periodo),
      ['2026-01', '2026-02'],
    );
    assert.equal(rep[0].nueva, 5);
    assert.equal(rep[0].renovacion, 5);
    assert.equal(rep[0].shareNuevas, 0.5);
  });

  it('sin recuento explícito, cada fila cuenta como una matrícula', () => {
    const rows = [
      fila(2026, 1, 10, 100, 'real', { tipoMatricula: 'nueva' }),
      fila(2026, 1, 11, 100, 'real', { tipoMatricula: 'nueva' }),
    ];
    assert.equal(reporteMensualMatriculas(rows)[0].nueva, 2);
  });
});

describe('aplicarFiltros', () => {
  const rows = [
    fila(2026, 1, 10, 100, 'real', { sede: 'Madrid', tipoFormacion: 'Máster' }),
    fila(2026, 6, 10, 200, 'real', { sede: 'Sevilla', tipoFormacion: 'Curso' }),
    fila(2026, 11, 10, 300, 'real', { sede: 'Valencia', tipoFormacion: 'Máster' }),
  ];

  it('sin filtros no descarta nada', () => {
    assert.equal(aplicarFiltros(rows, {}).length, 3);
    assert.equal(aplicarFiltros(rows).length, 3);
  });

  it('filtra por rango de fechas, con ambos extremos incluidos', () => {
    const r = aplicarFiltros(rows, { desde: utc(2026, 6, 10), hasta: utc(2026, 11, 10) });
    assert.equal(r.length, 2);
  });

  it('filtra por sede y por formación, y las combina', () => {
    assert.equal(aplicarFiltros(rows, { sedes: ['Madrid'] }).length, 1);
    assert.equal(aplicarFiltros(rows, { formaciones: ['Máster'] }).length, 2);
    assert.equal(
      aplicarFiltros(rows, { sedes: ['Madrid', 'Valencia'], formaciones: ['Máster'] }).length,
      2,
    );
  });

  it('una lista vacía no filtra', () => {
    assert.equal(aplicarFiltros(rows, { sedes: [] }).length, 3);
  });
});

describe('buildResumenGlobal', () => {
  it('sin filas devuelve null', () => {
    assert.equal(buildResumenGlobal([]), null);
    assert.equal(buildResumenGlobal(null), null);
  });

  it('monta todo el resumen de una pasada', () => {
    const rows = [
      fila(2025, 1, 5, 100),
      fila(2026, 1, 15, 400),
      fila(2026, 2, 16, 600),
      fila(2026, 1, 15, 1500, 'objetivo'),
    ];
    const r = buildResumenGlobal(rows);
    assert.equal(r.temporada, '2026-enero');
    assert.equal(r.convocatoria.id, 'enero');
    assert.ok(r.runRate);
    assert.ok(r.whereWeStand);
    assert.ok(r.yearToDate);
    assert.equal(r.tabla.length, 4);
    assert.equal(r.serie.length, 3);
    // Sin columnas opcionales, esos dos paneles vienen apagados.
    assert.equal(r.canales, null);
    assert.equal(r.matriculas, null);
  });
});

describe('objetivo parcial en la proyección', () => {
  it('oculta el % cuando el objetivo no cubre la temporada completa', () => {
    // Convocatoria de junio = jun-sep. Objetivos sólo en junio y julio.
    const rows = [
      fila(2026, 6, 10, 5000),
      fila(2026, 7, 10, 5000),
      fila(2026, 6, 10, 6000, 'objetivo'),
      fila(2026, 7, 10, 6000, 'objetivo'),
    ];
    const proy = tablaComparativa(rows).find((g) => g.id === 'proyeccion');
    assert.equal(proy.objetivoParcial, true);
    assert.equal(proy.cumplimiento, null, 'un 284 % aquí sería comparar medio objetivo');
    assert.equal(proy.diferencia, null);
  });

  it('da el % cuando el objetivo llega al último mes de la temporada', () => {
    const rows = [
      fila(2026, 6, 10, 5000),
      fila(2026, 7, 10, 5000),
      fila(2026, 6, 10, 6000, 'objetivo'),
      // Septiembre es el último mes de la convocatoria de junio.
      fila(2026, 9, 20, 6000, 'objetivo'),
    ];
    const proy = tablaComparativa(rows).find((g) => g.id === 'proyeccion');
    assert.equal(proy.objetivoParcial, false);
    assert.ok(proy.cumplimiento !== null, 'con objetivo completo sí hay porcentaje');
  });

  it('los grupos no proyectados siguen dando su porcentaje', () => {
    const rows = [
      fila(2026, 6, 10, 5000),
      fila(2026, 7, 10, 5000),
      fila(2026, 6, 10, 6000, 'objetivo'),
    ];
    const temporada = tablaComparativa(rows).find((g) => g.id === 'temporada');
    assert.ok(temporada.cumplimiento !== null, 'lo observado no depende de la cobertura futura');
  });
});
