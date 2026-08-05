/**
 * Métricas del Resumen Global — lógica pura, testeable sin navegador.
 *
 * Todo lo de aquí compara periodos, y comparar es donde una cifra miente más
 * fácil. Tres decisiones que sostienen el resto:
 *
 * 1. **El «hoy» sale de los datos, no del reloj.** El corte es la fecha real más
 *    alta del Excel. Si se usara `new Date()`, un Excel cerrado a septiembre
 *    daría un run rate hundido en diciembre: dividiría lo facturado hasta
 *    septiembre por el año entero transcurrido. El corte tiene que ser hasta
 *    dónde llegan los datos, no qué día es hoy.
 *
 * 2. **La comparación anual va contra la misma convocatoria**, no contra el mes.
 *    Las convocatorias de CEI no duran lo mismo (enero cubre 3 meses, abril 2),
 *    así que comparar meses naturales enfrentaría periodos de distinta longitud.
 *
 * 3. **Una comparación sin base es `null`, nunca 0 ni infinito.** Si no hay dato
 *    del año anterior, el crecimiento no es «0 %», es «no se puede saber», y la
 *    interfaz debe poder distinguirlo para no dibujar una barra que no existe.
 */

import {
  convocatoriaDe,
  finTemporada,
  fraccionTranscurrida,
  inicioTemporada,
  temporadaAnterior,
  temporadaKey,
  temporadaSiguiente,
} from './temporada.js';

/** Filas reales / de objetivo. */
const reales = (rows) => rows.filter((r) => r.tipoDato === 'real');
const objetivos = (rows) => rows.filter((r) => r.tipoDato === 'objetivo');

const sumIngreso = (rows) => rows.reduce((acc, r) => acc + r.ingreso, 0);

/** Suma de matrículas; `null` si ninguna fila trae recuento. */
function sumMatriculas(rows) {
  const conDato = rows.filter((r) => typeof r.matriculas === 'number');
  return conDato.length === 0 ? null : conDato.reduce((acc, r) => acc + r.matriculas, 0);
}

/**
 * Variación relativa entre dos importes.
 *
 * `null` cuando no hay base con la que comparar: sin base no hay porcentaje, y
 * devolver 0 haría pasar «no había datos» por «no creció».
 */
export function variacion(actual, anterior) {
  if (!Number.isFinite(actual) || !Number.isFinite(anterior) || anterior === 0) return null;
  return (actual - anterior) / Math.abs(anterior);
}

/**
 * Fecha de corte: la fecha real más alta del dataset.
 * @returns {Date|null}
 */
export function fechaCorte(rows) {
  const fechas = reales(rows).map((r) => r.fecha.getTime());
  return fechas.length ? new Date(Math.max(...fechas)) : null;
}

/** Temporada en curso según el corte. */
export function temporadaActual(rows) {
  const corte = fechaCorte(rows);
  return corte ? temporadaKey(corte) : null;
}

/** Filas de una temporada concreta. */
const deTemporada = (rows, key) => rows.filter((r) => r.temporada === key);

/**
 * Acumulado de una temporada hasta el mismo punto de avance que otra.
 *
 * Esto es el «hace un año a estas alturas»: si de la convocatoria actual va el
 * 60 %, del año anterior se cuenta también su primer 60 %, no la temporada
 * completa. Sin esto la comparación siempre saldría perdiendo, porque enfrentaría
 * una temporada a medias contra una terminada.
 */
export function acumuladoHastaAvance(rows, key, fraccion) {
  const filas = deTemporada(reales(rows), key);
  if (filas.length === 0) return 0;
  return sumIngreso(
    filas.filter((r) => fraccionTranscurrida(key, r.fecha) <= fraccion),
  );
}

/**
 * Run rate de la temporada en curso.
 *
 * Proyecta el cierre extrapolando el ritmo: acumulado / fracción transcurrida.
 * Devuelve `null` si la temporada acaba de empezar — dividir por una fracción
 * casi cero da una proyección disparatada, y es más honesto no dar cifra.
 */
export function runRate(rows) {
  const corte = fechaCorte(rows);
  const key = temporadaActual(rows);
  if (!corte || !key) return null;

  const fraccion = fraccionTranscurrida(key, corte);
  // Por debajo del 5 % de la temporada la extrapolación no dice nada útil.
  if (fraccion < 0.05) return null;

  const acumulado = sumIngreso(deTemporada(reales(rows), key));
  return {
    temporada: key,
    acumulado,
    fraccion,
    proyeccion: acumulado / fraccion,
    // Lo que falta por facturar para llegar a la proyección.
    pendiente: acumulado / fraccion - acumulado,
  };
}

/**
 * Where we stand: acumulado real vs objetivo de la temporada en curso.
 *
 * `gap` negativo = por debajo del objetivo. Se expone además el objetivo
 * prorrateado al avance de la temporada, que es la comparación justa: a mitad de
 * convocatoria lo razonable es llevar la mitad del objetivo, no el total.
 */
export function whereWeStand(rows) {
  const corte = fechaCorte(rows);
  const key = temporadaActual(rows);
  if (!corte || !key) return null;

  const real = sumIngreso(deTemporada(reales(rows), key));
  const objetivo = sumIngreso(deTemporada(objetivos(rows), key));
  const fraccion = fraccionTranscurrida(key, corte);
  const objetivoProrrateado = objetivo * fraccion;

  return {
    temporada: key,
    real,
    objetivo,
    fraccion,
    objetivoProrrateado,
    gap: real - objetivo,
    gapProrrateado: real - objetivoProrrateado,
    cumplimiento: objetivo === 0 ? null : real / objetivo,
    // «ahead» se juzga contra el objetivo prorrateado, no contra el total:
    // ir por debajo del total a mitad de temporada es lo normal.
    ahead: objetivoProrrateado === 0 ? null : real >= objetivoProrrateado,
  };
}

/**
 * Crecimiento de la temporada en curso frente a la misma del año anterior,
 * comparando ambos al mismo punto de avance.
 */
export function crecimientoAnual(rows) {
  const corte = fechaCorte(rows);
  const key = temporadaActual(rows);
  if (!corte || !key) return null;

  const anterior = temporadaAnterior(key);
  const fraccion = fraccionTranscurrida(key, corte);

  const actual = sumIngreso(deTemporada(reales(rows), key));
  const previo = acumuladoHastaAvance(rows, anterior, fraccion);
  const previoCompleto = sumIngreso(deTemporada(reales(rows), anterior));

  return {
    temporada: key,
    temporadaAnterior: anterior,
    fraccion,
    actual,
    anterior: previo,
    anteriorCompleto: previoCompleto,
    variacion: variacion(actual, previo),
    // Sin filas del año anterior no hay comparación posible, y conviene que la
    // interfaz lo diga en vez de pintar un 0 %.
    hayBase: previo > 0,
  };
}

/** Año natural del corte. */
const anioCorte = (rows) => fechaCorte(rows)?.getUTCFullYear() ?? null;

/**
 * Year-to-date vs Budget. «Budget» son las filas de objetivo — el parser ya
 * acepta `Presupuesto` como sinónimo de Objetivo.
 *
 * El objetivo se acota al mismo rango de fechas que el real: comparar lo
 * facturado hasta hoy contra el presupuesto del año entero no es un gap, es una
 * resta sin sentido.
 */
export function yearToDate(rows) {
  const corte = fechaCorte(rows);
  const anio = anioCorte(rows);
  if (!corte || anio === null) return null;

  const enRango = (r) => r.anio === anio && r.fecha <= corte;
  const real = sumIngreso(reales(rows).filter(enRango));
  const budget = sumIngreso(objetivos(rows).filter(enRango));

  return {
    anio,
    corte,
    real,
    budget,
    diferencia: real - budget,
    cumplimiento: budget === 0 ? null : real / budget,
    ahead: budget === 0 ? null : real >= budget,
  };
}

/** Mes en curso según el corte, como periodo 'YYYY-MM'. */
function periodoCorte(rows) {
  const corte = fechaCorte(rows);
  if (!corte) return null;
  return `${corte.getUTCFullYear()}-${String(corte.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Tabla comparativa: Objetivo / Actual / Diferencia, repetido por grupo.
 *
 * Los cuatro grupos son los que pediste: Year-to-date, mes en curso, temporada
 * y proyección. En Proyección el «actual» es el run rate, así que la diferencia
 * ahí es una estimación de cierre, no un dato observado — la interfaz debe
 * marcarlo para que nadie lo lea como facturación real.
 */
export function tablaComparativa(rows) {
  const corte = fechaCorte(rows);
  const key = temporadaActual(rows);
  if (!corte || !key) return [];

  const mes = periodoCorte(rows);
  const anio = anioCorte(rows);
  const ytd = yearToDate(rows);
  const stand = whereWeStand(rows);
  const rate = runRate(rows);

  const delMes = (rs) => rs.filter((r) => r.periodo === mes);

  const grupos = [
    {
      id: 'ytd',
      // El módulo emite CLAVES y no texto: es lógica pura y no debe saber en qué
      // idioma se va a pintar. La interfaz traduce; aquí sólo se dice qué decir.
      hintKey: 'tabla.ytdHint',
      hintValues: { anio },
      objetivo: ytd?.budget ?? 0,
      actual: ytd?.real ?? 0,
      estimado: false,
    },
    {
      id: 'mes',
      hint: mes ?? '—',
      objetivo: sumIngreso(delMes(objetivos(rows))),
      actual: sumIngreso(delMes(reales(rows))),
      estimado: false,
    },
    {
      id: 'temporada',
      hintKey: 'tabla.temporadaHint',
      objetivo: stand?.objetivo ?? 0,
      actual: stand?.real ?? 0,
      estimado: false,
    },
    {
      id: 'proyeccion',
      hintKey: 'tabla.proyeccionHint',
      objetivo: stand?.objetivo ?? 0,
      actual: rate?.proyeccion ?? null,
      estimado: true,
      // El cierre proyectado cubre la temporada entera, así que sólo es
      // comparable si el objetivo también la cubre. Cuando el Excel trae los
      // objetivos mes a mes, el de la temporada va incompleto y el cociente
      // dispara (una proyección anual contra medio objetivo da cifras como
      // 284 %). En ese caso no se da porcentaje: se avisa.
      objetivoParcial: !objetivoCubreTemporada(rows, key),
    },
  ];

  return grupos.map((g) => ({
    ...g,
    // Con objetivo incompleto no se publica diferencia ni cumplimiento: serían
    // una resta y un cociente entre periodos de distinta cobertura.
    diferencia: g.actual === null || g.objetivoParcial ? null : g.actual - g.objetivo,
    cumplimiento:
      !g.objetivo || g.actual === null || g.objetivoParcial ? null : g.actual / g.objetivo,
  }));
}

/**
 * ¿Los objetivos cargados cubren la temporada completa?
 *
 * Se mira si hay alguna fila de objetivo en el último mes de la convocatoria. No
 * es infalible —un objetivo de temporada anotado como importe único al principio
 * daría un falso negativo— pero cubre el caso habitual, que es el presupuesto
 * introducido mes a mes, y falla del lado prudente: preferimos ocultar un
 * porcentaje a publicar uno que compara media temporada contra una entera.
 */
function objetivoCubreTemporada(rows, key) {
  const fin = finTemporada(key);
  const inicio = inicioTemporada(key);
  if (!fin || !inicio) return false;

  // Último mes de la temporada: desde un mes antes del fin hasta el fin.
  const ultimoMes = new Date(fin.getTime());
  ultimoMes.setUTCMonth(ultimoMes.getUTCMonth() - 1);

  return objetivos(rows).some((r) => r.fecha >= ultimoMes && r.fecha < fin);
}

/**
 * Serie para la gráfica comparativa: la temporada del año anterior, la actual
 * hasta el corte, y la proyección de la siguiente.
 *
 * Cada punto lleva su `tipo` para que la gráfica sepa colorear: verde/rojo según
 * mejore o empeore respecto al año anterior, azul para lo proyectado.
 */
export function serieComparativa(rows) {
  const key = temporadaActual(rows);
  const corte = fechaCorte(rows);
  if (!key || !corte) return [];

  const anterior = temporadaAnterior(key);
  const siguiente = temporadaSiguiente(key);
  const fraccion = fraccionTranscurrida(key, corte);

  const filasAnterior = deTemporada(reales(rows), anterior);
  // Sin filas del año anterior el punto es null y desaparece de la serie. Un 0
  // ahí afirmaría «el año pasado facturamos cero», que es un dato, cuando lo
  // cierto es que no hay dato.
  const totalAnterior = filasAnterior.length === 0 ? null : sumIngreso(filasAnterior);
  const acumuladoActual = sumIngreso(deTemporada(reales(rows), key));
  const anteriorAlMismoAvance = acumuladoHastaAvance(rows, anterior, fraccion);
  const rate = runRate(rows);

  const mejora = anteriorAlMismoAvance > 0 && acumuladoActual >= anteriorAlMismoAvance;

  return [
    {
      key: anterior,
      temporada: anterior,
      // La barra del año anterior muestra su acumulado AL MISMO AVANCE, no la
      // temporada completa. Enfrentar una temporada a medias contra una
      // terminada dibuja al año anterior siempre más alto, y entonces la barra
      // en curso puede salir más baja y a la vez pintada de verde: la gráfica
      // se contradice. El total completo viaja en `valorCompleto` para la tabla,
      // que es donde sí cabe explicarlo.
      valor: totalAnterior === null ? null : anteriorAlMismoAvance,
      valorCompleto: totalAnterior,
      tipo: 'anterior',
      estimado: false,
      comparable: true,
    },
    {
      key,
      temporada: key,
      valor: acumuladoActual,
      // Verde si vamos mejor que el año pasado a estas alturas, rojo si peor.
      tipo: anteriorAlMismoAvance === 0 ? 'neutro' : mejora ? 'mejor' : 'peor',
      estimado: false,
      referencia: anteriorAlMismoAvance,
    },
    {
      key: `${siguiente}-proy`,
      temporada: siguiente,
      valor: rate?.proyeccion ?? null,
      tipo: 'proyeccion',
      estimado: true,
    },
  ].filter((p) => p.valor !== null);
}

/**
 * Matriculaciones online vs offline.
 *
 * Devuelve `null` si el Excel no trae la columna `Canal`: sin ese dato el panel
 * se apaga, en lugar de mostrar ceros que parecerían un dato real.
 */
export function canalBreakdown(rows) {
  const conCanal = reales(rows).filter((r) => r.canal !== null);
  if (conCanal.length === 0) return null;

  const key = temporadaActual(rows);
  const corte = fechaCorte(rows);
  const fraccion = key && corte ? fraccionTranscurrida(key, corte) : 0;
  const anterior = key ? temporadaAnterior(key) : null;

  const totalMatriculas = sumMatriculas(conCanal);

  const porCanal = ['online', 'offline'].map((canal) => {
    const filas = deTemporada(conCanal, key).filter((r) => r.canal === canal);
    const matriculas = sumMatriculas(filas);

    // Mismo canal, misma convocatoria del año anterior, al mismo avance.
    const previas = conCanal.filter(
      (r) =>
        r.canal === canal &&
        r.temporada === anterior &&
        fraccionTranscurrida(anterior, r.fecha) <= fraccion,
    );
    const matriculasPrevias = sumMatriculas(previas);

    return {
      canal,
      label: canal === 'online' ? 'Online' : 'Offline',
      matriculas,
      ingreso: sumIngreso(filas),
      anterior: matriculasPrevias,
      variacion: variacion(matriculas, matriculasPrevias),
      // Plano no es «ahead»: con la misma cifra que el año pasado no se va por
      // delante de nada. Tres estados, no dos.
      estado:
        matriculasPrevias === null
          ? null
          : (matriculas ?? 0) > matriculasPrevias
            ? 'ahead'
            : (matriculas ?? 0) < matriculasPrevias
              ? 'behind'
              : 'plano',
    };
  });

  const sumaTemporada = porCanal.reduce((acc, c) => acc + (c.matriculas ?? 0), 0);

  return {
    temporada: key,
    totalMatriculas,
    canales: porCanal.map((c) => ({
      ...c,
      share: sumaTemporada === 0 ? null : (c.matriculas ?? 0) / sumaTemporada,
    })),
  };
}

/**
 * Reporte mensual de matrículas nuevas vs renovaciones.
 *
 * `null` sin columna `Tipo Matrícula`. Sólo cubre New Enrolments y
 * Re-enrolment: Roadmap y Follow-up no tienen ningún dato detrás en el Excel,
 * y se dejan fuera antes que inventarlos.
 */
export function reporteMensualMatriculas(rows) {
  const conTipo = reales(rows).filter((r) => r.tipoMatricula !== null);
  if (conTipo.length === 0) return null;

  const porPeriodo = new Map();
  for (const row of conTipo) {
    if (!porPeriodo.has(row.periodo)) {
      porPeriodo.set(row.periodo, { periodo: row.periodo, nueva: 0, renovacion: 0, ingreso: 0 });
    }
    const entrada = porPeriodo.get(row.periodo);
    // Sin recuento explícito, cada fila cuenta como una matrícula.
    entrada[row.tipoMatricula] += row.matriculas ?? 1;
    entrada.ingreso += row.ingreso;
  }

  return [...porPeriodo.values()]
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .map((e) => ({
      ...e,
      total: e.nueva + e.renovacion,
      shareNuevas: e.nueva + e.renovacion === 0 ? null : e.nueva / (e.nueva + e.renovacion),
    }));
}

/**
 * Aplica los filtros del Resumen Global.
 *
 * `desde`/`hasta` son inclusivos y en UTC; las listas vacías no filtran, que es
 * lo que espera quien no ha tocado el filtro todavía.
 */
export function aplicarFiltros(rows, filtros = {}) {
  const { desde = null, hasta = null, sedes = [], formaciones = [], areas = [] } = filtros;

  return rows.filter((row) => {
    if (desde && row.fecha < desde) return false;
    if (hasta && row.fecha > hasta) return false;
    if (sedes.length && !sedes.includes(row.sede)) return false;
    if (formaciones.length && !formaciones.includes(row.tipoFormacion)) return false;
    if (areas.length && !areas.includes(row.area)) return false;
    return true;
  });
}

/** Resumen completo, de una pasada, para que la página no recalcule por panel. */
export function buildResumenGlobal(rows) {
  if (!rows || rows.length === 0) return null;

  return {
    corte: fechaCorte(rows),
    temporada: temporadaActual(rows),
    convocatoria: convocatoriaDe(fechaCorte(rows) ?? new Date(NaN)),
    crecimiento: crecimientoAnual(rows),
    runRate: runRate(rows),
    whereWeStand: whereWeStand(rows),
    yearToDate: yearToDate(rows),
    tabla: tablaComparativa(rows),
    serie: serieComparativa(rows),
    canales: canalBreakdown(rows),
    matriculas: reporteMensualMatriculas(rows),
  };
}
