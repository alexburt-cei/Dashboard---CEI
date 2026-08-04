# AGENTS.md

Instrucciones para agentes que trabajen en este repositorio.

## Graphify: el grafo es el mapa del código

- **When the user types `/graphify`, invoke the Skill tool with `skill: "graphify"` before doing anything else.** This loads the full graphify pipeline instructions from `~/.config/opencode/skills/graphify/SKILL.md`.

El grafo de `graphify-out/` es la fuente primaria para orientarse en el
código. Leer archivos en plano o barrer el árbol con grep es el último
recurso, no el primero.

- **NO escanees ni uses grep en todo el directorio al iniciar.**
- **ALWAYS read `graphify-out/GRAPH_REPORT.md` before reading any source files, running grep/glob searches, or answering codebase questions.** The graph is your primary map of the codebase.
- **IF `graphify-out/wiki/index.md` EXISTS, navigate it instead of reading raw files.**
- **For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep** — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files.
- **After modifying code, run `graphify update .`** to keep the graph current (AST-only, no API cost).

### Si el grafo no está disponible

`graphify-out/` no existe todavía en este repositorio, y ni la skill
(`~/.config/opencode/skills/graphify/SKILL.md`) ni el CLI `graphify` están
instalados en todos los entornos — por ejemplo, en sesiones de Claude Code en
la web, donde las skills se leen de `~/.claude/skills/`.

Cuando falte cualquiera de las dos cosas: dilo explícitamente en vez de
inventar un mapa del código o de dar por hecho que el grafo está al día, y
sigue adelante leyendo el código directamente. No trates la ausencia del
grafo como un bloqueo.
