# Dashboard CEI

Dashboard de ingresos por tipo de formación, área y sede, a partir de un Excel
subido por el usuario. React + Vite + React Router.

## Estado actual

1. **Estructura de carpetas y rutas** — las 6 vistas navegables.
2. **Parser de Excel** — con tests.
3. **Layout de navegación** — secciones + pestañas, carga de archivo, tarjetas resumen.
4. **Gráficas** — barras por categoría y evolución temporal, sin dependencias.

88 casos de test (`npm test`) sobre el parser, las agregaciones y las escalas.

### Las gráficas no usan librería

Están escritas a mano, sin Recharts ni equivalente. El reparto no es arbitrario:

- **Evolución temporal → SVG.** Una línea necesita geometría de trazado y una
  retícula de puntas para el crosshair, y sus etiquetas de eje son cortas
  ("ene 2026").
- **Barras por categoría → CSS.** Los nombres de categoría vienen del Excel del
  usuario y pueden ser larguísimos. SVG no tiene `text-overflow`, así que una
  etiqueta larga se saldría del trazado; con CSS el truncado con elipsis sale
  gratis. Las barras cumplen las mismas medidas igualmente.

Ambas llevan tooltip (con teclado además de ratón: flechas en la línea, tabulador
en las barras) y su tabla de datos plegable debajo, para que ningún valor
dependa del hover.

## Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests del parser y de las agregaciones
npm run build
```

Hay un archivo de ejemplo en `samples/ejemplo-ingresos.csv` para probar sin
tener que preparar un Excel.

Las dependencias ya se instalan y el JSX ya se transpila: `npm install` resuelve
las 6 versiones fijadas (el árbol está congelado en `package-lock.json`), los 88
tests pasan y `vite build` compila sin errores.

> **Fallos conocidos, sin corregir todavía:**
>
> 1. **Un CSV en UTF-8 sin BOM llega como mojibake** y la importación se cae con
>    *«Faltan columnas obligatorias: Tipo Formación, Área»*. `XLSX.read` con
>    `type: 'array'` decodifica los bytes del CSV como CP1252, así que
>    `Área` → `Ãrea` y la normalización de cabeceras, que quita acentos, no
>    puede repararlo. Afecta a `samples/ejemplo-ingresos.csv`, que es
>    justamente UTF-8 sin BOM. Con BOM o en CP1252 funciona; el `.xlsx` no está
>    afectado porque guarda XML UTF-8.
> 2. **Los importes de 1.000 a 9.999 salen sin separador de miles**
>    (`9500 €` junto a `12.000 €`). Es el `useGrouping: "auto"` de ICU en
>    es-ES, que no agrupa enteros de cuatro dígitos; se corrige en
>    `utils/format.js` con `useGrouping: 'always'`.
> 3. **Las dos últimas marcas del eje de barras se tocan** y se leen `70 k80 k`:
>    todos los huecos son de 12 px menos el último, que es de 0 px.

## Publicación en GitHub Pages

`.github/workflows/deploy-pages.yml` compila y publica en cada push. Pages sirve
el proyecto en un subdirectorio, no en la raíz del dominio, y de ahí las tres
piezas del montaje:

- `vite.config.js` fija `base` al nombre del repo **sólo al compilar**; en
  `vite dev` la base sigue siendo `/`.
- El `basename` del router sale de `import.meta.env.BASE_URL`, o sea de esa
  misma base: se declara una vez y no hay dos sitios que puedan discrepar.
- El workflow copia `index.html` a `404.html`. Pages no reescribe rutas
  desconocidas hacia el índice, así que recargar `/reales/sede` daría 404;
  sirviendo el mismo documento como `404.html`, el router resuelve en cliente y
  las URLs siguen siendo reales y enlazables en vez de pasar a hash. El precio
  es que un deep link se sirve con status HTTP 404, invisible para quien navega.

El *source* de Pages tiene que estar en **GitHub Actions** (Settings → Pages),
no en «Deploy from a branch», o el despliegue falla.

## Rutas

| Ruta | Vista |
|---|---|
| `/` | redirige a `/reales/formacion` |
| `/reales` | redirige a `/reales/formacion` |
| `/reales/formacion` | Datos Reales · por Tipo de Formación |
| `/reales/area` | Datos Reales · por Área |
| `/reales/sede` | Datos Reales · por Sede |
| `/objetivos` | redirige a `/objetivos/formacion` |
| `/objetivos/formacion` | Objetivos · por Tipo de Formación |
| `/objetivos/area` | Objetivos · por Área |
| `/objetivos/sede` | Objetivos · por Sede |
| cualquier otra | `NotFoundPage` |

Las secciones y las pestañas salen de un único registro,
`src/constants/dimensions.js`. Añadir una pestaña nueva es añadir una entrada a
`DIMENSIONS`: las rutas, la navegación y la agregación se enganchan solas.

Al cambiar de sección se conserva la pestaña activa: de `/reales/sede` se pasa a
`/objetivos/sede`, no de vuelta a la primera pestaña.

## Estructura

```
src/
├── components/
│   ├── FileUpload/index.jsx        arrastrar y soltar + selector
│   ├── layout/
│   │   ├── Header.jsx              identidad, estado del archivo, SectionNav
│   │   ├── SectionNav.jsx          Reales / Objetivos
│   │   └── TabNav.jsx              Formación / Área / Sede
│   ├── charts/
│   │   ├── ChartTable.jsx          vista de datos plegable de cada gráfica
│   │   ├── RevenueByCategory.jsx   barras por categoría (CSS)
│   │   └── RevenueTrendChart.jsx   evolución temporal (SVG + crosshair)
│   ├── DimensionDashboard.jsx      cuerpo de pestaña, sirve a las 6 vistas
│   ├── IssuesPanel.jsx             incidencias de la importación
│   ├── ProgressBar.jsx             cumplimiento real vs objetivo
│   └── SummaryCards.jsx            tarjetas resumen
├── constants/dimensions.js         registro de secciones y dimensiones
├── context/DataContext.jsx         dataset importado + persistencia
├── hooks/
│   ├── useElementWidth.js          ancho medido para el SVG (ResizeObserver)
│   └── useExcelParser.js           lectura del fichero con SheetJS
├── pages/
│   ├── RealesPage.jsx              TabNav + subrutas de Reales
│   ├── ObjetivosPage.jsx           TabNav + subrutas de Objetivos
│   └── NotFoundPage.jsx
├── routes/AppRoutes.jsx            todas las rutas
├── styles/
│   ├── tokens.css                  paleta y tokens (claro + oscuro)
│   └── global.css
└── utils/
    ├── excelParser.js              parseo puro + tests
    ├── dataTransform.js            agregaciones + tests
    ├── scale.js                    ejes, ticks y trazados + tests
    └── format.js                   formateo es-ES
```

Sobre lo propuesto se han añadido cinco archivos: `constants/dimensions.js`
(registro que evita repetir slugs en router y navegación), `utils/format.js`
(formateo, para no mezclarlo con las agregaciones), `components/DimensionDashboard.jsx`
(cuerpo de pestaña compartido por las 6 vistas, en vez de 6 páginas casi
idénticas), `components/IssuesPanel.jsx` y `pages/NotFoundPage.jsx`.

## El parser

`src/utils/excelParser.js` es **lógica pura sin dependencias**: recibe una
matriz de celdas y devuelve filas tipadas más incidencias. No sabe nada de
SheetJS ni de React, y por eso se puede testear con `node --test` sin bundler.
`src/hooks/useExcelParser.js` es la capa que lee el fichero con SheetJS y elige
la hoja.

### Columnas

Obligatorias: `Fecha`, `Tipo Formación`, `Área`, `Sede`, `Ingreso`, `Tipo Dato`.

Las cabeceras se comparan normalizadas (sin acentos, en minúsculas, separadores
colapsados), así que `Tipo Formación`, `TIPO_FORMACION` y `tipo de formacion`
valen igual. Cada campo acepta además sinónimos (`Importe`/`Facturación` para
`Ingreso`, `Centro`/`Campus` para `Sede`…) — la lista está en `COLUMN_ALIASES`.

**Opcionales**, para las métricas de matriculación del Resumen Global:

| Columna | Valores aceptados | Para qué |
|---|---|---|
| `Canal` | `Online`, `Web`, `Internet`, `Digital` · `Offline`, `Presencial`, `Teléfono`, `Oficina` | Matriculaciones online vs offline |
| `Tipo Matrícula` | `Nueva`, `Alta`, `New Enrolment` · `Renovación`, `Re-matrícula`, `Renewal`, `Continuidad` | Reporte de New Enrolments vs Re-enrolment |
| `Matrículas` | entero ≥ 0 (`12`, `1.234`) | Recuento de alumnos, que no es lo mismo que el importe |

Son opcionales de verdad: un Excel sin ellas se importa igual y lo que se apaga
son los paneles que dependen de esa columna, no el archivo entero. Si la columna
está pero un valor no se reconoce, se avisa con su número de fila y **la fila se
importa igualmente** — el ingreso, que es el dato principal, sigue siendo válido.
Un valor desconocido no se adivina nunca.

### Temporadas: las convocatorias

Lo comparativo no va por meses ni por estaciones, sino por las cuatro
convocatorias de CEI — **enero, abril, junio y octubre**. Cada una cubre desde su
mes de apertura hasta el anterior a la siguiente, así que el año queda cubierto
sin huecos ni solapes:

| Convocatoria | Meses |
|---|---|
| enero | enero, febrero, marzo |
| abril | abril, mayo |
| junio | junio, julio, agosto, septiembre |
| octubre | octubre, noviembre, diciembre |

Importa para el «hace un año a estas alturas»: la comparación va contra **la
misma convocatoria** del año anterior, no contra el mes natural, porque las
convocatorias no duran lo mismo. Si el centro cambia su calendario, se edita
`CONVOCATORIAS` en `src/utils/temporada.js` y todo lo demás se recalcula — no hay
meses escritos a mano en ningún otro sitio.

### Qué acepta

| Campo | Formatos |
|---|---|
| `Fecha` | serial de Excel · `2026-01-31` · `2026-01` · `31/01/2026` · `31-01-2026` · `31/01/26` · `01/2026` · `ene-2026` · `enero 2026` · `31 de enero de 2026` |
| `Ingreso` | `1234.56` · `1.234,56` · `1.234,56 €` · `1,234.56` · `1 234,56` · `-1.234,56` · `(1.234,56)` |
| `Tipo Dato` | Real: `Real`, `Reales`, `Realizado`, `Ejecutado`, `Actual` · Objetivo: `Objetivo`, `Target`, `Meta`, `Presupuesto`, `Previsto` |

Decisiones que conviene conocer:

- **Las fechas se construyen y se leen siempre en UTC.** Se lee con
  `cellDates: false` y los seriales se convierten con aritmética UTC explícita.
  Si se mezclan getters locales y UTC, un ingreso del 1 de enero se cuenta en
  diciembre según la zona horaria del navegador.
- **`dd/mm/yyyy` se interpreta día primero** (convención española). Sólo se
  invierte a `mm/dd` cuando el primer número no puede ser un mes y el segundo sí.
- **Con sólo puntos, se distingue miles de decimal por grupos de tres:**
  `1.234` → 1234, pero `12.5` → 12.5.
- **Nunca lanza por datos malos.** Una celda inválida genera una incidencia con
  su número de fila de Excel y la fila se descarta; el resto se importa. Las
  incidencias se ven en la propia app (`IssuesPanel`).
- **Un `Tipo Dato` desconocido no se adivina**, se reporta.
- Busca la fila de cabeceras (tolera títulos y filas en blanco encima) y elige
  la hoja de datos aunque el libro empiece por una portada.

## Notas

- **`xlsx` 0.18.5** es la última versión publicada en el registro de npm.
  Tiene avisos de seguridad conocidos (prototype pollution, ReDoS) corregidos a
  partir de 0.19.3, que SheetJS sólo distribuye por su propio CDN. El riesgo
  aquí es bajo (cada usuario abre su propio archivo, no contenido de terceros),
  pero si se quiere la versión corregida:
  `npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`.
- El dataset importado se guarda en `localStorage` para que un refresco no
  obligue a volver a subir el archivo. Si no cabe, la sesión sigue en memoria.
- La paleta de `tokens.css` está validada para daltonismo y contraste en claro y
  oscuro. Si se cambian los colores de marca hay que re-validarla: lo que hace
  legible una gráfica es la separación entre colores adyacentes.
- Los ejes empiezan siempre en cero (`buildScale`). Recortar la base exagera las
  diferencias: es la forma más fácil de que una gráfica mienta sin que nadie lo
  note. Y los meses sin ingresos se rellenan a 0 en la serie temporal, porque
  saltárselos deforma la pendiente.
