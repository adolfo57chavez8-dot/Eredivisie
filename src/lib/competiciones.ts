export type CompeticionInfo = {
  slug: string;
  nombre: string;
  tipo: "liga" | "copa" | "internacional";
  emoji: string;
  descripcion: string;
};

export const COMPETICIONES: CompeticionInfo[] = [
  {
    slug: "liga",
    nombre: "Liga (Holanda)",
    tipo: "liga",
    emoji: "🏆",
    descripcion: "Primera División de Holanda (Eredivisie)",
  },
  {
    slug: "copa",
    nombre: "Copa (Holanda)",
    tipo: "copa",
    emoji: "🏆",
    descripcion: "Copa nacional de Holanda",
  },
  {
    slug: "super-copa",
    nombre: "Super Copa (Holanda)",
    tipo: "copa",
    emoji: "⭐",
    descripcion: "Super Copa de Holanda",
  },
  {
    slug: "champions-league",
    nombre: "Champions League",
    tipo: "internacional",
    emoji: "⚽",
    descripcion: "Fase de liga y eliminatoria, ranking UEFA/FIFA",
  },
  {
    slug: "europa-league",
    nombre: "UEFA Europa League",
    tipo: "internacional",
    emoji: "🟠",
    descripcion: "Fase de liga y eliminatoria, ranking UEFA/FIFA",
  },
  {
    slug: "conference-league",
    nombre: "Conference League",
    tipo: "internacional",
    emoji: "🟢",
    descripcion: "Fase de liga y eliminatoria, ranking UEFA/FIFA",
  },
  {
    slug: "mundial-clubes",
    nombre: "Mundial de Clubes",
    tipo: "internacional",
    emoji: "🌍",
    descripcion: "Ranking mundial FIFA, detección automática de confederación",
  },
  {
    slug: "super-copa-europa",
    nombre: "Super Copa de Europa",
    tipo: "internacional",
    emoji: "🏆",
    descripcion: "Super Copa de Europa",
  },
];

export function getCompeticionInfo(slug: string) {
  return COMPETICIONES.find((c) => c.slug === slug);
}
