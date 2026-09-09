import { SupabaseClient } from "@supabase/supabase-js";

export type CambioRanking = {
  posicionAnterior: number | null;
  cambio: number | null; // positivo = subió puestos, negativo = bajó
};

/**
 * Calcula automáticamente la posición que ocupaba cada club "1 año"
 * (según la fecha de los partidos, no la fecha real) atrás dentro de
 * un ranking (una competición individual o un grupo como
 * "uefa-global"/"fifa-world"), usando las fotos guardadas en
 * `ranking_historial` (se guardan solas mediante un trigger cada vez
 * que cambian los puntos — ver migración SQL).
 *
 * No requiere que nadie cargue nada a mano: si todavía no existe una
 * foto de hace 1 año (de calendario de partidos) para un club, se
 * muestra como "Nuevo" hasta que el admin cargue resultados con
 * fechas separadas por al menos un año.
 */
export async function calcularCambios1Anio(
  supabase: SupabaseClient,
  tipo: "competicion" | "grupo",
  referencia: string,
  posicionesActuales: { club_id: string; posicion: number }[]
): Promise<Record<string, CambioRanking>> {
  const mapaVacio: Record<string, CambioRanking> = {};
  posicionesActuales.forEach((p) => (mapaVacio[p.club_id] = { posicionAnterior: null, cambio: null }));

  if (posicionesActuales.length === 0) return mapaVacio;

  // "Hoy" ya NO es la fecha real del calendario: es la fecha más
  // reciente que exista en el historial de ESTA competición/grupo (la
  // última fecha de partido que se haya cargado). Así el cambio de
  // "1 año" sigue el calendario de temporadas que carga el admin
  // (2026, 2027, 2028…) en vez del reloj real del servidor.
  const { data: filaMasReciente } = await supabase
    .from("ranking_historial")
    .select("fecha")
    .eq("tipo", tipo)
    .eq("referencia", referencia)
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!filaMasReciente) return mapaVacio;

  const hoy = new Date(filaMasReciente.fecha);
  const haceUnAnio = new Date(hoy);
  haceUnAnio.setFullYear(haceUnAnio.getFullYear() - 1);

  const { data, error } = await supabase
    .from("ranking_historial")
    .select("club_id, puntos, fecha")
    .eq("tipo", tipo)
    .eq("referencia", referencia)
    .lte("fecha", haceUnAnio.toISOString())
    .order("fecha", { ascending: false });

  if (error || !data || data.length === 0) return mapaVacio;

  // Nos quedamos con la foto más reciente (pero anterior o igual a
  // "hace 1 año") de cada club — es la que mejor representa dónde
  // estaba hace exactamente un año.
  const ultimaPorClub = new Map<string, number>();
  for (const fila of data as { club_id: string; puntos: number }[]) {
    if (!ultimaPorClub.has(fila.club_id)) {
      ultimaPorClub.set(fila.club_id, fila.puntos);
    }
  }

  if (ultimaPorClub.size === 0) return mapaVacio;

  const ordenHace1Anio = [...ultimaPorClub.entries()].sort((a, b) => b[1] - a[1]);
  const posicionHace1Anio = new Map<string, number>();
  ordenHace1Anio.forEach(([clubId], i) => posicionHace1Anio.set(clubId, i + 1));

  const resultado: Record<string, CambioRanking> = {};
  for (const p of posicionesActuales) {
    const anterior = posicionHace1Anio.get(p.club_id) ?? null;
    resultado[p.club_id] = {
      posicionAnterior: anterior,
      cambio: anterior !== null ? anterior - p.posicion : null,
    };
  }
  return resultado;
}
