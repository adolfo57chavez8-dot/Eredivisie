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
