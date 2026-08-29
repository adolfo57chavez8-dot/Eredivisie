import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompeticionInfo } from "@/lib/competiciones";
import TablaCampeones from "@/components/TablaCampeones";
import TablaRanking from "@/components/TablaRanking";
import HistorialFinales from "@/components/HistorialFinales";

export const dynamic = "force-dynamic";

export default async function CompeticionPage({
  params,
}: {
  params: { slug: string };
}) {
  const info = getCompeticionInfo(params.slug);
  if (!info) notFound();

  const supabase = createClient();

  // 1. Buscar la competición en la base de datos por su slug
  const { data: competicion } = await supabase
    .from("competiciones")
    .select("id, nombre, tipo, organizador")
    .eq("slug", params.slug)
    .maybeSingle();

  let campeones: any[] = [];
  let ranking: any[] = [];
  let finales: any[] = [];

  if (competicion) {
    const [{ data: campeonesData }, { data: rankingData }, { data: finalesData }] =
      await Promise.all([
        supabase
          .from("campeones")
          .select("titulos, primer_titulo, ultimo_titulo, clubes(nombre, pais)")
          .eq("competicion_id", competicion.id),
        supabase
          .from("rankings")
          .select("puntos, partidos_jugados, clubes(nombre, pais)")
          .eq("competicion_id", competicion.id),
        supabase
          .from("finales")
          .select(
            "anio, goles_local, goles_visitante, pais_local, pais_visitante, local:club_local_id(nombre), visitante:club_visitante_id(nombre)"
          )
          .eq("competicion_id", competicion.id),
      ]);

    campeones = campeonesData ?? [];
    ranking = rankingData ?? [];
    finales = finalesData ?? [];
  }

  return (
    <div>
      <section className="bg-campo text-crema">
        <div className="max-w-6xl mx-auto px-4 py-10 flex items-center gap-4">
          <span className="text-5xl">{info.emoji}</span>
          <div>
            <h1 className="font-display text-4xl md:text-5xl">{info.nombre}</h1>
            <p className="text-crema/80">{info.descripcion}</p>
          </div>
        </div>
      </section>

      {!competicion && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <p className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded p-4 text-sm">
            Esta competición todavía no tiene datos cargados en la base de
            datos. Un administrador puede crearla desde el panel de
            administración.
          </p>
        </div>
      )}

      <section className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-2xl mb-3 stitch pb-2">Tabla de campeones</h2>
          <TablaCampeones
            filas={campeones.map((c: any) => ({
              club: c.clubes?.nombre ?? "—",
              pais: c.clubes?.pais ?? "—",
              titulos: c.titulos,
              primer_titulo: c.primer_titulo,
              ultimo_titulo: c.ultimo_titulo,
            }))}
          />
        </div>

        <div>
          <h2 className="font-display text-2xl mb-3 stitch pb-2">
            Ranking automático (FIFA/UEFA)
          </h2>
          <TablaRanking
            filas={ranking.map((r: any) => ({
              club: r.clubes?.nombre ?? "—",
              pais: r.clubes?.pais ?? "—",
              puntos: r.puntos,
              partidos_jugados: r.partidos_jugados,
            }))}
          />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-14">
        <h2 className="font-display text-2xl mb-3 stitch pb-2">Historial de finales</h2>
        <HistorialFinales
          filas={finales.map((f: any) => ({
            anio: f.anio,
            local: f.local?.nombre ?? "—",
            visitante: f.visitante?.nombre ?? "—",
            goles_local: f.goles_local,
            goles_visitante: f.goles_visitante,
            pais_local: f.pais_local,
            pais_visitante: f.pais_visitante,
          }))}
        />
      </section>
    </div>
  );
}
