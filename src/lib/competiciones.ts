export type CompeticionInfo = {
  slug: string;
  nombre: string;
  tipo: "liga" | "copa" | "internacional";
  emoji: string;
  descripcion: string;
  // Qué clubes se pueden elegir al cargar resultados/finales/campeones
  // de esta competición:
  //  - "holanda": solo clubes de Holanda (Liga, Copa, Super Copa)
  //  - "europa": clubes cuya confederación es UEFA (incluye Holanda +
  //    el resto de Europa) — Champions, Europa League, Conference,
  //    Super Copa de Europa
  //  - "mundial": todos los clubes de todos los países/confederaciones
  filtroClubes: "holanda" | "europa" | "mundial";
  // Grupo de ranking compartido. Si dos o más competiciones tienen el
  // mismo grupoRanking, sus resultados alimentan UN SOLO ranking en
  // conjunto (ej. las 4 competiciones europeas -> "uefa-global").
  // Si es null, la competición tiene su propio ranking independiente
  // (Liga/Copa/Super Copa de Holanda).
  grupoRanking: "uefa-global" | "fifa-world" | null;
  nombreRanking: string;
  // Clases de Tailwind para la tarjeta de la portada (ver src/app/page.tsx).
  // Son colores inspirados en la identidad de cada competición, no los
  // logos oficiales (esos los tiene que subir el administrador a
  // /public/logos-competiciones/<slug>.png — ver ImagenLogo.tsx).
  colorFondo: string;
  colorTexto: string;
};

export const COMPETICIONES: CompeticionInfo[] = [
  {
    slug: "liga",
    grupoRanking: null,
    nombreRanking: "Ranking Liga (Holanda)",
    nombre: "Liga (Holanda)",
    tipo: "liga",
    emoji: "🏆",
    descripcion: "Primera División de Holanda (Eredivisie)",
    filtroClubes: "holanda",
    colorFondo: "bg-blue-800",
    colorTexto: "text-white",
  },
  {
    slug: "copa",
    grupoRanking: null,
    nombreRanking: "Ranking Copa (Holanda)",
    nombre: "Copa (Holanda)",
    tipo: "copa",
    emoji: "🏆",
    descripcion: "Copa nacional de Holanda",
    filtroClubes: "holanda",
    colorFondo: "bg-orange-700",
    colorTexto: "text-white",
  },
  {
    slug: "super-copa",
    grupoRanking: null,
    nombreRanking: "Ranking Super Copa (Holanda)",
    nombre: "Super Copa (Holanda)",
    tipo: "copa",
    emoji: "⭐",
    descripcion: "Super Copa de Holanda",
    filtroClubes: "holanda",
    colorFondo: "bg-slate-900",
    colorTexto: "text-amber-400",
  },
  {
    slug: "champions-league",
    grupoRanking: "uefa-global",
    nombreRanking: "Ranking UEFA Global",
    nombre: "Champions League",
    tipo: "internacional",
    emoji: "⚽",
    descripcion: "Fase de liga y eliminatoria, ranking UEFA/FIFA",
    filtroClubes: "europa",
    colorFondo: "bg-blue-950",
    colorTexto: "text-white",
  },
  {
    slug: "europa-league",
    grupoRanking: "uefa-global",
    nombreRanking: "Ranking UEFA Global",
    nombre: "UEFA Europa League",
    tipo: "internacional",
    emoji: "🟠",
    descripcion: "Fase de liga y eliminatoria, ranking UEFA/FIFA",
    filtroClubes: "europa",
    colorFondo: "bg-neutral-900",
    colorTexto: "text-white",
  },
  {
    slug: "conference-league",
    grupoRanking: "uefa-global",
    nombreRanking: "Ranking UEFA Global",
    nombre: "Conference League",
    tipo: "internacional",
    emoji: "🟢",
    descripcion: "Fase de liga y eliminatoria, ranking UEFA/FIFA",
    filtroClubes: "europa",
    colorFondo: "bg-neutral-900",
    colorTexto: "text-white",
  },
  {
    slug: "mundial-clubes",
    grupoRanking: "fifa-world",
    nombreRanking: "Ranking FIFA World",
    nombre: "Mundial de Clubes",
    tipo: "internacional",
    emoji: "🌍",
    descripcion: "Ranking mundial FIFA, detección automática de confederación",
    filtroClubes: "mundial",
    colorFondo: "bg-neutral-900",
    colorTexto: "text-amber-400",
  },
  {
    slug: "super-copa-europa",
    grupoRanking: "uefa-global",
    nombreRanking: "Ranking UEFA Global",
    nombre: "Super Copa de Europa",
    tipo: "internacional",
    emoji: "🏆",
    descripcion: "Super Copa de Europa",
    filtroClubes: "europa",
    colorFondo: "bg-blue-950",
    colorTexto: "text-white",
  },
];

export function getCompeticionInfo(slug: string) {
  return COMPETICIONES.find((c) => c.slug === slug);
}

/**
 * Devuelve el filtro de clubes (holanda/europa/mundial) a partir del
 * slug de la competición. Si el slug no se reconoce, por seguridad
 * devuelve "mundial" (sin restringir) en vez de dejar la lista vacía.
 */
export function getFiltroClubes(slug: string | undefined): "holanda" | "europa" | "mundial" {
  return getCompeticionInfo(slug ?? "")?.filtroClubes ?? "mundial";
}

// ---------------------------------------------------------------------
// Rondas disponibles al cargar un resultado, según la competición.
// Cada ronda define además a qué "fase" clásica (liga/eliminatoria/final)
// equivale, para no romper la columna `fase` que ya existe en la base
// de datos y de la que puede depender el trigger que recalcula el
// ranking.
// ---------------------------------------------------------------------

export type RondaOpcion = {
  value: string;
  label: string;
  fase: "liga" | "eliminatoria" | "final";
};

const RONDAS_EUROPEAS_LIGA_COPA: RondaOpcion[] = [
  { value: "fase_liga", label: "Fase de liga", fase: "liga" },
  { value: "octavos_ida", label: "Octavos de final — Ida", fase: "eliminatoria" },
  { value: "octavos_vuelta", label: "Octavos de final — Vuelta", fase: "eliminatoria" },
  { value: "cuartos_ida", label: "Cuartos de final — Ida", fase: "eliminatoria" },
  { value: "cuartos_vuelta", label: "Cuartos de final — Vuelta", fase: "eliminatoria" },
  { value: "semifinal_ida", label: "Semifinal — Ida", fase: "eliminatoria" },
  { value: "semifinal_vuelta", label: "Semifinal — Vuelta", fase: "eliminatoria" },
  { value: "final", label: "Gran final", fase: "final" },
];

const RONDAS_SOLO_FINAL: RondaOpcion[] = [
  { value: "final", label: "Gran final", fase: "final" },
];

const RONDAS_MUNDIAL_CLUBES: RondaOpcion[] = [
  { value: "octavos", label: "Octavos de final", fase: "eliminatoria" },
  { value: "cuartos", label: "Cuartos de final", fase: "eliminatoria" },
  { value: "semifinal", label: "Semifinal", fase: "eliminatoria" },
  { value: "final", label: "Gran final", fase: "final" },
];

export const RONDAS_POR_SLUG: Record<string, RondaOpcion[]> = {
  liga: [{ value: "jornada", label: "Jornada de liga", fase: "liga" }],
  copa: [
    { value: "dieciseisavos", label: "Dieciseisavos de final", fase: "eliminatoria" },
    { value: "octavos", label: "Octavos de final", fase: "eliminatoria" },
    { value: "cuartos", label: "Cuartos de final", fase: "eliminatoria" },
    { value: "semifinal", label: "Semifinal", fase: "eliminatoria" },
    { value: "final", label: "Gran final", fase: "final" },
  ],
  "super-copa": RONDAS_SOLO_FINAL,
  "champions-league": RONDAS_EUROPEAS_LIGA_COPA,
  "europa-league": RONDAS_EUROPEAS_LIGA_COPA,
  "conference-league": RONDAS_EUROPEAS_LIGA_COPA,
  "mundial-clubes": RONDAS_MUNDIAL_CLUBES,
  "super-copa-europa": RONDAS_SOLO_FINAL,
};

const RONDA_GENERICA: RondaOpcion[] = [{ value: "unica", label: "Partido único", fase: "liga" }];

export function getRondas(slug: string | undefined): RondaOpcion[] {
  return RONDAS_POR_SLUG[slug ?? ""] ?? RONDA_GENERICA;
}

export function getRondaInfo(slug: string | undefined, value: string): RondaOpcion | undefined {
  return getRondas(slug).find((r) => r.value === value);
}

/** Diccionario global ronda -> etiqueta, para mostrar historial de partidos. */
export const NOMBRES_RONDA: Record<string, string> = Object.values(RONDAS_POR_SLUG)
  .flat()
  .reduce((acc, r) => ({ ...acc, [r.value]: r.label }), {} as Record<string, string>);
