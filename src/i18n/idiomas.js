/**
 * Idiomas y diccionarios.
 *
 * Tres decisiones que conviene conocer:
 *
 * 1. **La bandera nunca va sola.** Una bandera no es un idioma —el inglés no es
 *    propiedad del Reino Unido, ni el francés de Francia— y quien no reconozca
 *    el trapo no sabrá qué está eligiendo. Cada opción lleva su nombre escrito
 *    en su propio idioma, con la bandera como refuerzo visual.
 *
 * 2. **El locale de formato viaja con el idioma.** No basta con traducir los
 *    textos: en inglés los miles se separan con coma y el decimal con punto, al
 *    revés que en castellano. Si se traduce la etiqueta pero no la cifra, sale
 *    un «Revenue: 1.234,56 €» que un lector británico lee como mil doscientos.
 *
 * 3. **Una clave que falta devuelve la clave**, no una cadena vacía. Un hueco en
 *    la interfaz se confunde con un fallo de maquetación; ver «resumen.titulo»
 *    en pantalla señala exactamente qué falta traducir.
 */

/**
 * @typedef {Object} Idioma
 * @property {string} code    identificador estable ('es')
 * @property {string} locale  locale para Intl ('es-ES')
 * @property {string} nombre  nombre en su propio idioma
 * @property {string} bandera emoji de bandera, sólo como refuerzo
 */

/** @type {Idioma[]} */
export const IDIOMAS = [
  { code: 'es', locale: 'es-ES', nombre: 'Castellano', bandera: '🇪🇸' },
  { code: 'en', locale: 'en-GB', nombre: 'English', bandera: '🇬🇧' },
  { code: 'fr', locale: 'fr-FR', nombre: 'Français', bandera: '🇫🇷' },
];

export const IDIOMA_POR_DEFECTO = 'es';

export function getIdioma(code) {
  return IDIOMAS.find((idioma) => idioma.code === code) ?? IDIOMAS[0];
}

/**
 * Diccionarios. Las claves se agrupan por zona de la interfaz para que al
 * añadir una vista se vea de un vistazo qué falta por traducir.
 */
export const DICCIONARIOS = {
  es: {
    'app.titulo': 'Dashboard CEI',
    'app.subtitulo': 'Ingresos por formación, área y sede',

    'nav.secciones': 'Secciones',
    'nav.resumen': 'Resumen Global',
    'nav.reales': 'Datos Reales',
    'nav.objetivos': 'Objetivos',
    'nav.vistasDe': 'Vistas de {seccion}',

    'dim.formacion': 'Tipo de Formación',
    'dim.area': 'Área',
    'dim.sede': 'Sede',

    'upload.subir': 'Subir Excel',
    'upload.cambiar': 'Cambiar archivo',
    'upload.quitar': 'Quitar datos',
    'upload.seleccionar': 'Seleccionar archivo',
    'upload.leyendo': 'Leyendo…',
    'upload.arrastra': 'Arrastra aquí el Excel de ingresos',
    'upload.columnas':
      'Columnas esperadas: Fecha, Tipo Formación, Área, Sede, Ingreso y Tipo Dato (Real u Objetivo).',
    'upload.filas': '{n} filas',

    'vacio.titulo': 'Todavía no hay datos',
    'vacio.detalle': 'Sube el Excel de ingresos para ver el detalle por {dimension}.',
    'vacio.resumen':
      'Sube el Excel de ingresos para ver la comparativa histórica, el ritmo y el cumplimiento.',
    'vacio.vista': 'No hay datos para esta vista.',
    'vacio.filtros': 'Los filtros no dejan ninguna fila. Amplía el rango o limpia la selección.',

    'card.ingresosTotales': 'Ingresos totales',
    'card.objetivoTotal': 'Objetivo total',
    'card.mediaMensual': 'Media mensual',
    'card.registros': '{n} registros',
    'card.mesesConDatos': '{n} meses con datos',
    'card.mayor': 'Mayor: {valor}',
    'card.mayorDe': 'Mayor {dimension}',
    'card.delTotal': '{valor} · {porcentaje} del total',
    'card.cumplimientoGlobal': 'Cumplimiento global',
    'card.vsObjetivo': '{valor} vs objetivo',

    'chart.ingresosPor': 'Ingresos por {dimension}',
    'chart.totalPeriodo': 'Total del periodo, de mayor a menor',
    'chart.evolucion': 'Evolución temporal',
    'chart.ingresosPorMes': 'Ingresos por mes',
    'chart.verDatos': 'Ver datos',
    'chart.cumplimientoPor': 'Cumplimiento por {dimension}',

    'resumen.titulo': 'Resumen Global',
    'resumen.meta': '{temporada} · datos hasta {fecha} · {filas} filas',
    'resumen.crecimiento': 'Crecimiento vs año anterior',
    'resumen.crecimientoHint': '{temporada} al mismo avance',
    'resumen.sinBase': 'sin datos del año anterior',
    'resumen.runRate': 'Run rate',
    'resumen.runRateHint': 'cierre estimado · {porcentaje} de la convocatoria',
    'resumen.runRateCorto': 'convocatoria demasiado reciente para proyectar',
    'resumen.whereWeStand': 'Where we stand',
    'resumen.objetivoDe': 'objetivo de {temporada}',
    'resumen.ytd': 'Year-to-date vs Budget',
    'resumen.anio': 'año {anio}',
    'resumen.vsRitmo': '{valor} vs ritmo',
    'resumen.vsBudget': '{valor} vs budget',
    'resumen.vsAnterior': '{valor} vs año anterior',

    'comp.titulo': 'Comparativa por convocatoria',
    'comp.subtitulo':
      'Todas las barras al mismo punto de avance de su convocatoria, más el cierre proyectado',
    'comp.anterior': 'Año anterior, al mismo punto de avance',
    'comp.mejor': 'En curso · mejor que el año anterior',
    'comp.peor': 'En curso · peor que el año anterior',
    'comp.neutro': 'En curso',
    'comp.proyeccion': 'Proyección de cierre',
    'comp.estimacion': 'estimación',
    'comp.convocatoria': 'Convocatoria',
    'comp.importeComparable': 'Importe comparable',
    'comp.temporadaCompleta': 'Temporada completa',
    'comp.naturaleza': 'Naturaleza',
    'comp.datoReal': 'Dato real',
    'comp.vsAnioAnterior': 'vs año anterior',

    'tabla.titulo': 'Objetivo vs actual',
    'tabla.subtitulo': 'Por periodo, con la diferencia frente al objetivo',
    'tabla.periodo': 'Periodo',
    'tabla.objetivo': 'Objetivo',
    'tabla.actual': 'Actual',
    'tabla.diferencia': 'Diferencia',
    'tabla.cumplimiento': 'Cumplimiento',
    'tabla.ytd': 'Year-to-date',
    'tabla.ytdHint': '1 ene {anio} – corte',
    'tabla.mes': 'Mes en curso',
    'tabla.temporada': 'Temporada',
    'tabla.temporadaHint': 'convocatoria en curso',
    'tabla.proyeccion': 'Proyección',
    'tabla.proyeccionHint': 'cierre estimado al ritmo actual',
    'tabla.objetivoParcial': 'sin % — el objetivo cargado no cubre la temporada completa',

    'filtros.titulo': 'Filtros del resumen',
    'filtros.desde': 'Desde',
    'filtros.hasta': 'Hasta',
    'filtros.sedes': 'Sedes',
    'filtros.formacion': 'Formación',
    'filtros.areas': 'Áreas',
    'filtros.todas': 'Todas',
    'filtros.seleccionadas': '{n} seleccionadas',
    'filtros.limpiar': 'Limpiar',

    'canal.titulo': 'Matriculaciones online vs offline',
    'canal.subtitulo': 'Convocatoria en curso, frente al mismo punto del año anterior',
    'canal.online': 'Online',
    'canal.offline': 'Offline',
    'canal.delTotal': '{porcentaje} del total',
    'canal.ahead': 'Ahead',
    'canal.behind': 'Behind',
    'canal.plano': 'Igual',
    'canal.sinAnterior': 'Sin dato del año anterior',
    'canal.estado': 'Estado',
    'canal.matriculas': 'Matrículas',
    'canal.anioAnterior': 'Año anterior',
    'canal.porcentajeTotal': '% del total',

    'matriculas.titulo': 'Reporte mensual de matriculación',
    'matriculas.subtitulo': 'Nuevas vs renovaciones, por mes',
    'matriculas.nuevas': 'Nuevas',
    'matriculas.renovaciones': 'Renovaciones',
    'matriculas.mes': 'Mes',
    'matriculas.total': 'Total',
    'matriculas.porcentajeNuevas': '% nuevas',

    'panelApagado.detalle':
      'Este panel necesita la columna {columna} en el Excel, que no está en el archivo importado. Valores que acepta: {ejemplos}.',

    'tema.claro': 'Modo claro',
    'tema.oscuro': 'Modo oscuro',
    'tema.activar': 'Cambiar a {modo}',
    'idioma.etiqueta': 'Idioma',

    'chart.registros': "Registros",
    'chart.ingreso': "Ingreso",
    'chart.porcentajeTotal': "% del total",
    'chart.mes': "Mes",
    'chart.nRegistros': "{n} registros",
    'chart.readout': "{categoria}: {importe}, {porcentaje} del total, {n} registros",
    'dim.cumplimientoDe': "Cumplimiento de {label}",
    'chart.ingresoRealSobreObjetivo': "Ingreso real sobre objetivo",

    'scope.etiqueta': "Ámbito",
    'scope.madrid': "Madrid",
    'scope.sevilla': "Sevilla",
    'scope.valencia': "Valencia",
    'scope.online': "Online",
    'scope.presencial': "Presencial",
    'scope.total': "Total",
    'scope.presencialHint': "Madrid + Valencia + Sevilla",

    'vacio.ambitoTitulo': "Sin datos en {ambito}",
    'vacio.ambitoDetalle': "El archivo se ha importado, pero ninguna fila pertenece a {ambito}. Prueba con otro ámbito o con Total.",
    'vacio.tipoDatoTitulo': "Sin datos de {seccion}",
    'vacio.tipoDatoDetalle': "El archivo se ha importado, pero no contiene filas con Tipo Dato «{tipo}».",

    'notfound.titulo': 'Esta página no existe',
    'notfound.volver': 'Volver al inicio',
  },

  en: {
    'app.titulo': 'CEI Dashboard',
    'app.subtitulo': 'Revenue by programme, area and campus',

    'nav.secciones': 'Sections',
    'nav.resumen': 'Global Summary',
    'nav.reales': 'Actuals',
    'nav.objetivos': 'Targets',
    'nav.vistasDe': '{seccion} views',

    'dim.formacion': 'Programme Type',
    'dim.area': 'Area',
    'dim.sede': 'Campus',

    'upload.subir': 'Upload Excel',
    'upload.cambiar': 'Change file',
    'upload.quitar': 'Clear data',
    'upload.seleccionar': 'Choose file',
    'upload.leyendo': 'Reading…',
    'upload.arrastra': 'Drop the revenue Excel here',
    'upload.columnas':
      'Expected columns: Date, Programme Type, Area, Campus, Revenue and Data Type (Actual or Target).',
    'upload.filas': '{n} rows',

    'vacio.titulo': 'No data yet',
    'vacio.detalle': 'Upload the revenue Excel to see the breakdown by {dimension}.',
    'vacio.resumen': 'Upload the revenue Excel to see historical comparison, run rate and attainment.',
    'vacio.vista': 'No data for this view.',
    'vacio.filtros': 'The filters leave no rows. Widen the range or clear the selection.',

    'card.ingresosTotales': 'Total revenue',
    'card.objetivoTotal': 'Total target',
    'card.mediaMensual': 'Monthly average',
    'card.registros': '{n} records',
    'card.mesesConDatos': '{n} months with data',
    'card.mayor': 'Top: {valor}',
    'card.mayorDe': 'Top {dimension}',
    'card.delTotal': '{valor} · {porcentaje} of total',
    'card.cumplimientoGlobal': 'Overall attainment',
    'card.vsObjetivo': '{valor} vs target',

    'chart.ingresosPor': 'Revenue by {dimension}',
    'chart.totalPeriodo': 'Period total, highest first',
    'chart.evolucion': 'Trend over time',
    'chart.ingresosPorMes': 'Revenue by month',
    'chart.verDatos': 'View data',
    'chart.cumplimientoPor': 'Attainment by {dimension}',

    'resumen.titulo': 'Global Summary',
    'resumen.meta': '{temporada} · data through {fecha} · {filas} rows',
    'resumen.crecimiento': 'Growth vs last year',
    'resumen.crecimientoHint': '{temporada} at the same point',
    'resumen.sinBase': 'no data for last year',
    'resumen.runRate': 'Run rate',
    'resumen.runRateHint': 'estimated close · {porcentaje} of the intake',
    'resumen.runRateCorto': 'intake too recent to project',
    'resumen.whereWeStand': 'Where we stand',
    'resumen.objetivoDe': '{temporada} target',
    'resumen.ytd': 'Year-to-date vs Budget',
    'resumen.anio': 'year {anio}',
    'resumen.vsRitmo': '{valor} vs pace',
    'resumen.vsBudget': '{valor} vs budget',
    'resumen.vsAnterior': '{valor} vs last year',

    'comp.titulo': 'Intake comparison',
    'comp.subtitulo': 'All bars at the same point of their intake, plus the projected close',
    'comp.anterior': 'Last year, at the same point',
    'comp.mejor': 'Current · better than last year',
    'comp.peor': 'Current · worse than last year',
    'comp.neutro': 'Current',
    'comp.proyeccion': 'Projected close',
    'comp.estimacion': 'estimate',
    'comp.convocatoria': 'Intake',
    'comp.importeComparable': 'Comparable amount',
    'comp.temporadaCompleta': 'Full season',
    'comp.naturaleza': 'Nature',
    'comp.datoReal': 'Actual',
    'comp.vsAnioAnterior': 'vs last year',

    'tabla.titulo': 'Target vs actual',
    'tabla.subtitulo': 'By period, with the gap against target',
    'tabla.periodo': 'Period',
    'tabla.objetivo': 'Target',
    'tabla.actual': 'Actual',
    'tabla.diferencia': 'Gap',
    'tabla.cumplimiento': 'Attainment',
    'tabla.ytd': 'Year-to-date',
    'tabla.ytdHint': '1 Jan {anio} – cutoff',
    'tabla.mes': 'Current month',
    'tabla.temporada': 'Season',
    'tabla.temporadaHint': 'current intake',
    'tabla.proyeccion': 'Projection',
    'tabla.proyeccionHint': 'estimated close at current pace',
    'tabla.objetivoParcial': 'no % — the loaded target does not cover the full season',

    'filtros.titulo': 'Summary filters',
    'filtros.desde': 'From',
    'filtros.hasta': 'To',
    'filtros.sedes': 'Campuses',
    'filtros.formacion': 'Programme',
    'filtros.areas': 'Areas',
    'filtros.todas': 'All',
    'filtros.seleccionadas': '{n} selected',
    'filtros.limpiar': 'Clear',

    'canal.titulo': 'Online vs offline enrolments',
    'canal.subtitulo': 'Current intake, against the same point last year',
    'canal.online': 'Online',
    'canal.offline': 'Offline',
    'canal.delTotal': '{porcentaje} of total',
    'canal.ahead': 'Ahead',
    'canal.behind': 'Behind',
    'canal.plano': 'Flat',
    'canal.sinAnterior': 'No data for last year',
    'canal.estado': 'Status',
    'canal.matriculas': 'Enrolments',
    'canal.anioAnterior': 'Last year',
    'canal.porcentajeTotal': '% of total',

    'matriculas.titulo': 'Monthly enrolment report',
    'matriculas.subtitulo': 'New vs re-enrolments, by month',
    'matriculas.nuevas': 'New',
    'matriculas.renovaciones': 'Re-enrolments',
    'matriculas.mes': 'Month',
    'matriculas.total': 'Total',
    'matriculas.porcentajeNuevas': '% new',

    'panelApagado.detalle':
      'This panel needs the {columna} column in the Excel, which is missing from the imported file. Accepted values: {ejemplos}.',

    'tema.claro': 'Light mode',
    'tema.oscuro': 'Dark mode',
    'tema.activar': 'Switch to {modo}',
    'idioma.etiqueta': 'Language',

    'chart.registros': "Records",
    'chart.ingreso': "Revenue",
    'chart.porcentajeTotal': "% of total",
    'chart.mes': "Month",
    'chart.nRegistros': "{n} records",
    'chart.readout': "{categoria}: {importe}, {porcentaje} of total, {n} records",
    'dim.cumplimientoDe': "{label} attainment",
    'chart.ingresoRealSobreObjetivo': "Actual revenue against target",

    'scope.etiqueta': "Scope",
    'scope.madrid': "Madrid",
    'scope.sevilla': "Seville",
    'scope.valencia': "Valencia",
    'scope.online': "Online",
    'scope.presencial': "On-site",
    'scope.total': "Total",
    'scope.presencialHint': "Madrid + Valencia + Seville",

    'vacio.ambitoTitulo': "No data in {ambito}",
    'vacio.ambitoDetalle': "The file was imported, but no row belongs to {ambito}. Try another scope, or Total.",
    'vacio.tipoDatoTitulo': "No {seccion} data",
    'vacio.tipoDatoDetalle': "The file was imported, but it has no rows with Data Type “{tipo}”.",

    'notfound.titulo': 'This page does not exist',
    'notfound.volver': 'Back to start',
  },

  fr: {
    'app.titulo': 'Tableau de bord CEI',
    'app.subtitulo': 'Revenus par formation, domaine et campus',

    'nav.secciones': 'Sections',
    'nav.resumen': 'Synthèse globale',
    'nav.reales': 'Données réelles',
    'nav.objetivos': 'Objectifs',
    'nav.vistasDe': 'Vues de {seccion}',

    'dim.formacion': 'Type de formation',
    'dim.area': 'Domaine',
    'dim.sede': 'Campus',

    'upload.subir': 'Importer un Excel',
    'upload.cambiar': 'Changer de fichier',
    'upload.quitar': 'Effacer les données',
    'upload.seleccionar': 'Choisir un fichier',
    'upload.leyendo': 'Lecture…',
    'upload.arrastra': 'Déposez ici l’Excel des revenus',
    'upload.columnas':
      'Colonnes attendues : Date, Type de formation, Domaine, Campus, Revenu et Type de donnée (Réel ou Objectif).',
    'upload.filas': '{n} lignes',

    'vacio.titulo': 'Aucune donnée pour le moment',
    'vacio.detalle': 'Importez l’Excel des revenus pour voir le détail par {dimension}.',
    'vacio.resumen':
      'Importez l’Excel des revenus pour voir la comparaison historique, le rythme et l’atteinte.',
    'vacio.vista': 'Aucune donnée pour cette vue.',
    'vacio.filtros': 'Les filtres ne laissent aucune ligne. Élargissez la plage ou effacez la sélection.',

    'card.ingresosTotales': 'Revenus totaux',
    'card.objetivoTotal': 'Objectif total',
    'card.mediaMensual': 'Moyenne mensuelle',
    'card.registros': '{n} enregistrements',
    'card.mesesConDatos': '{n} mois avec données',
    'card.mayor': 'Principal : {valor}',
    'card.mayorDe': 'Principal {dimension}',
    'card.delTotal': '{valor} · {porcentaje} du total',
    'card.cumplimientoGlobal': 'Atteinte globale',
    'card.vsObjetivo': '{valor} vs objectif',

    'chart.ingresosPor': 'Revenus par {dimension}',
    'chart.totalPeriodo': 'Total de la période, du plus élevé au plus faible',
    'chart.evolucion': 'Évolution dans le temps',
    'chart.ingresosPorMes': 'Revenus par mois',
    'chart.verDatos': 'Voir les données',
    'chart.cumplimientoPor': 'Atteinte par {dimension}',

    'resumen.titulo': 'Synthèse globale',
    'resumen.meta': '{temporada} · données jusqu’au {fecha} · {filas} lignes',
    'resumen.crecimiento': 'Croissance vs année précédente',
    'resumen.crecimientoHint': '{temporada} au même stade',
    'resumen.sinBase': 'pas de données pour l’année précédente',
    'resumen.runRate': 'Rythme',
    'resumen.runRateHint': 'clôture estimée · {porcentaje} de la session',
    'resumen.runRateCorto': 'session trop récente pour projeter',
    'resumen.whereWeStand': 'Où nous en sommes',
    'resumen.objetivoDe': 'objectif de {temporada}',
    'resumen.ytd': 'Cumul annuel vs budget',
    'resumen.anio': 'année {anio}',
    'resumen.vsRitmo': '{valor} vs rythme',
    'resumen.vsBudget': '{valor} vs budget',
    'resumen.vsAnterior': '{valor} vs année précédente',

    'comp.titulo': 'Comparaison par session',
    'comp.subtitulo':
      'Toutes les barres au même stade de leur session, plus la clôture projetée',
    'comp.anterior': 'Année précédente, au même stade',
    'comp.mejor': 'En cours · mieux que l’année précédente',
    'comp.peor': 'En cours · moins bien que l’année précédente',
    'comp.neutro': 'En cours',
    'comp.proyeccion': 'Clôture projetée',
    'comp.estimacion': 'estimation',
    'comp.convocatoria': 'Session',
    'comp.importeComparable': 'Montant comparable',
    'comp.temporadaCompleta': 'Saison complète',
    'comp.naturaleza': 'Nature',
    'comp.datoReal': 'Donnée réelle',
    'comp.vsAnioAnterior': 'vs année précédente',

    'tabla.titulo': 'Objectif vs réel',
    'tabla.subtitulo': 'Par période, avec l’écart par rapport à l’objectif',
    'tabla.periodo': 'Période',
    'tabla.objetivo': 'Objectif',
    'tabla.actual': 'Réel',
    'tabla.diferencia': 'Écart',
    'tabla.cumplimiento': 'Atteinte',
    'tabla.ytd': 'Cumul annuel',
    'tabla.ytdHint': '1 janv. {anio} – arrêt',
    'tabla.mes': 'Mois en cours',
    'tabla.temporada': 'Saison',
    'tabla.temporadaHint': 'session en cours',
    'tabla.proyeccion': 'Projection',
    'tabla.proyeccionHint': 'clôture estimée au rythme actuel',
    'tabla.objetivoParcial': 'pas de % — l’objectif chargé ne couvre pas toute la saison',

    'filtros.titulo': 'Filtres de la synthèse',
    'filtros.desde': 'Du',
    'filtros.hasta': 'Au',
    'filtros.sedes': 'Campus',
    'filtros.formacion': 'Formation',
    'filtros.areas': 'Domaines',
    'filtros.todas': 'Tous',
    'filtros.seleccionadas': '{n} sélectionnés',
    'filtros.limpiar': 'Effacer',

    'canal.titulo': 'Inscriptions en ligne vs hors ligne',
    'canal.subtitulo': 'Session en cours, face au même stade de l’année précédente',
    'canal.online': 'En ligne',
    'canal.offline': 'Hors ligne',
    'canal.delTotal': '{porcentaje} du total',
    'canal.ahead': 'En avance',
    'canal.behind': 'En retard',
    'canal.plano': 'Stable',
    'canal.sinAnterior': 'Pas de données pour l’année précédente',
    'canal.estado': 'Statut',
    'canal.matriculas': 'Inscriptions',
    'canal.anioAnterior': 'Année précédente',
    'canal.porcentajeTotal': '% du total',

    'matriculas.titulo': 'Rapport mensuel des inscriptions',
    'matriculas.subtitulo': 'Nouvelles vs renouvellements, par mois',
    'matriculas.nuevas': 'Nouvelles',
    'matriculas.renovaciones': 'Renouvellements',
    'matriculas.mes': 'Mois',
    'matriculas.total': 'Total',
    'matriculas.porcentajeNuevas': '% nouvelles',

    'panelApagado.detalle':
      'Ce panneau nécessite la colonne {columna} dans l’Excel, absente du fichier importé. Valeurs acceptées : {ejemplos}.',

    'tema.claro': 'Mode clair',
    'tema.oscuro': 'Mode sombre',
    'tema.activar': 'Passer en {modo}',
    'idioma.etiqueta': 'Langue',

    'chart.registros': "Enregistrements",
    'chart.ingreso': "Revenu",
    'chart.porcentajeTotal': "% du total",
    'chart.mes': "Mois",
    'chart.nRegistros': "{n} enregistrements",
    'chart.readout': "{categoria} : {importe}, {porcentaje} du total, {n} enregistrements",
    'dim.cumplimientoDe': "Atteinte de {label}",
    'chart.ingresoRealSobreObjetivo': "Revenu réel par rapport à l’objectif",

    'scope.etiqueta': "Périmètre",
    'scope.madrid': "Madrid",
    'scope.sevilla': "Séville",
    'scope.valencia': "Valence",
    'scope.online': "En ligne",
    'scope.presencial': "Présentiel",
    'scope.total': "Total",
    'scope.presencialHint': "Madrid + Valence + Séville",

    'vacio.ambitoTitulo': "Aucune donnée dans {ambito}",
    'vacio.ambitoDetalle': "Le fichier a été importé, mais aucune ligne n’appartient à {ambito}. Essayez un autre périmètre, ou Total.",
    'vacio.tipoDatoTitulo': "Aucune donnée de {seccion}",
    'vacio.tipoDatoDetalle': "Le fichier a été importé, mais il ne contient aucune ligne avec le Type de donnée « {tipo} ».",

    'notfound.titulo': 'Cette page n’existe pas',
    'notfound.volver': 'Retour à l’accueil',
  },
};

/**
 * Interpola `{marcador}` con los valores dados.
 *
 * Un marcador sin valor se deja tal cual en vez de imprimir «undefined»: así se
 * ve qué falta pasarle en lugar de ensuciar la interfaz.
 */
export function interpolar(plantilla, valores) {
  if (!valores) return plantilla;
  return plantilla.replace(/\{(\w+)\}/g, (completo, clave) =>
    valores[clave] === undefined || valores[clave] === null ? completo : String(valores[clave]),
  );
}

/**
 * Traduce una clave. Si falta, devuelve la clave — un hueco en pantalla se
 * confunde con un fallo de maquetación; la clave visible dice qué traducir.
 */
export function traducir(code, clave, valores) {
  const diccionario = DICCIONARIOS[code] ?? DICCIONARIOS[IDIOMA_POR_DEFECTO];
  const plantilla = diccionario[clave] ?? DICCIONARIOS[IDIOMA_POR_DEFECTO][clave] ?? clave;
  return interpolar(plantilla, valores);
}
