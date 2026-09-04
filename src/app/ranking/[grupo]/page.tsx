import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TablaRanking from "@/components/TablaRanking";
import { COMPETICIONES } from "@/lib/competiciones";
import { calcularCambios1Anio } from "@/lib/ranking-historial";

export const dynamic = "force-dynamic";

const INFO_GRUPO: Record<string, { titulo: string; descripcion: string }> = {
  "uefa-global": {
    titulo: "Ranking UEFA Global",
    descripcion:
      "Ranking calculado por el sitio a partir de los resultados de Champions League, UEFA Europa League, Conference League y Super Copa de Europa. Los puntos se suman entre las cuatro competiciones y no se reinician. No es el ranking oficial de la UEFA.",
  },
  "fifa-world": {
    titulo: "Ranking FIFA World",
    descripcion:
      "Ranking calculado por el sitio a partir de los resultados del Mundial de Clubes, con clubes de todas las confederaciones. No es el ranking oficial de la FIFA.",
  },
};

export default async function RankingGrupoPage({ params }: { params: { grupo: string } }) {
  const info = INFO_GRUPO[params.grupo];
  if (!info) notFound();

  const supabase = createClient();
  const { data } = await supabase
    .from("ranking_global")
    .select(
      "club_id, puntos, puntos_base, partidos_jugados, victorias, empates, derrotas, clubes(nombre, pais, confederacion)"
    )
    .eq("grupo", params.grupo)
    .eq("eliminado", false);

  const filas = (data ?? []).map((r: any) => ({
    club_id: r.club_id as string,
    club: r.clubes?.nombre ?? "—",
    pais: r.clubes?.pais ?? "—",
    confederacion: r.clubes?.confederacion ?? null,
    puntos: (r.puntos ?? 0) + (r.puntos_base ?? 0),
    partidos_jugados: r.partidos_jugados,
  }));

  // Cambio de 1 año calculado solo, a partir del historial de puntos
  // (nadie tiene que cargarlo a mano).
  const ordenParaCambio = [...filas]
    .sort((a, b) => b.puntos - a.puntos)
    .map((f, i) => ({ club_id: f.club_id, posicion: i + 1 }));
  const cambios = await calcularCambios1Anio(supabase, "grupo", params.grupo, ordenParaCambio);

  const competicionesDelGrupo = COMPETICIONES.filter((c) => c.grupoRanking === params.grupo);

  return (
    <div>
      <section className="bg-tinta text-crema">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="font-display text-4xl md:text-5xl">{info.titulo}</h1>
          <p className="text-crema/70 mt-2 max-w-2xl">{info.descripcion}</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-sm text-tinta/50 mb-4">
          Competiciones que alimentan este ranking:{" "}
          {competicionesDelGrupo.map((c, i) => (
            <span key={c.slug}>
              <Link href={`/competicion/${c.slug}`} className="underline hover:text-campo">
                {c.nombre}
              </Link>
              {i < competicionesDelGrupo.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
        <p className="text-xs text-tinta/40 mb-4">
          El puntaje incluye una línea base histórica cargada por el administrador, más los
          puntos de los partidos que se registren de aquí en adelante. El cambio de 1 año se
          calcula solo comparando contra el historial de puntos guardado.
        </p>

        {params.grupo === "uefa-global" && (
          <p className="text-sm mb-4">
            <Link href="/ranking/ligas" className="underline hover:text-campo">
              Ver ranking de ligas (suma de puntos por país) →
            </Link>
          </p>
        )}

        <TablaRanking
          filas={filas.map((f) => ({
            club: f.club,
            pais: f.pais,
            confederacion: f.confederacion,
            puntos: f.puntos,
            partidos_jugados: f.partidos_jugados,
            posicion_anterior: cambios[f.club_id]?.posicionAnterior ?? null,
          }))}
        />
      </section>
    </div>
  );
}
