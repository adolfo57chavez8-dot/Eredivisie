import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompeticionInfo } from "@/lib/competiciones";
import ImagenTrofeo from "@/components/ImagenTrofeo";
import TablaCampeones from "@/components/TablaCampeones";
import TablaRanking from "@/components/TablaRanking";
import HistorialFinales from "@/components/HistorialFinales";
import HistorialPartidos from "@/components/HistorialPartidos";

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
  let partidos: any[] = [];

  if (competicion) {
    // Nota: se usa PromiseLike (no Promise) porque los query builders de
    // Supabase son "thenables" pero no implementan la interfaz completa
    // de Promise (catch/finally) que exige TypeScript en modo estricto.
    const consultas: PromiseLike<any>[] = [
      supabase
        .from("campeones")
        .select("titulos, primer_titulo, ultimo_titulo, clubes(nombre, pais)")
        .eq("competicion_id", competicion.id),
      supabase
        .from("finales")
        .select(
          "anio, goles_local, goles_visitante, pais_local, pais_visitante, local:club_local_id(nombre), visitante:club_visitante_id(nombre)"
        )
        .eq("competicion_id", competicion.id),
      supabase
        .from("partidos")
        .select(
          "fecha, fase, goles_local, goles_visitante, local:local_id(nombre, pais), visitante:visitante_id(nombre, pais)"
        )
        .eq("competicion_id", competicion.id)
        .eq("eliminado", false)
        .order("fecha", { ascending: false })
        .limit(30),
    ];

    // El ranking solo se consulta aquí (por competición) cuando la
    // competición NO pertenece a un grupo de ranking compartido.
    // Si pertenece (ej. las 4 europeas -> "uefa-global"), su ranking se
    // ve en /ranking/[grupo], no aquí.
    if (!info.grupoRanking) {
      consultas.push(
        supabase
          .from("rankings")
          .select("puntos, partidos_jugados, clubes(nombre, pais)")
          .eq("competicion_id", competicion.id)
      );
    }

    const resultados = await Promise.all(consultas);
    campeones = resultados[0].data ?? [];
    finales = resultados[1].data ?? [];
    partidos = resultados[2].data ?? [];
    if (!info.grupoRanking) {
      ranking = resultados[3]?.data ?? [];
    }
  }

  return (
    <div>
      <section className="bg-campo text-crema">
        <div className="max-w-6xl mx-auto px-4 py-10 flex items-center gap-5">
          <ImagenTrofeo slug={params.slug} alt={`Trofeo de ${info.nombre}`} />
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
          <h2 className="font-display text-2xl mb-1 stitch pb-2">Tabla de campeones</h2>
          <p className="text-tinta/50 text-sm mb-3">Títulos acumulados por club en esta competición.</p>
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
          {info.grupoRanking ? (
            <>
              <h2 className="font-display text-2xl mb-1 stitch pb-2">{info.nombreRanking}</h2>
              <p className="text-tinta/50 text-sm mb-3">
                Esta competición comparte un único ranking con las demás de
                su grupo — los puntos se suman entre todas, no se reinician.
              </p>
              <Link
                href={`/ranking/${info.grupoRanking}`}
                className="inline-block bg-tinta text-crema font-semibold px-4 py-2.5 rounded hover:opacity-90 transition"
              >
                Ver {info.nombreRanking} →
              </Link>
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl mb-1 stitch pb-2">{info.nombreRanking}</h2>
              <p className="text-tinta/50 text-sm mb-3">
                Calculado por el sitio a partir de los resultados cargados
                (no es un ranking oficial).
              </p>
              <TablaRanking
                filas={ranking.map((r: any) => ({
                  club: r.clubes?.nombre ?? "—",
                  pais: r.clubes?.pais ?? "—",
                  puntos: r.puntos,
                  partidos_jugados: r.partidos_jugados,
                }))}
              />
            </>
          )}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-10">
        <h2 className="font-display text-2xl mb-1 stitch pb-2">Historial de finales</h2>
        <p className="text-tinta/50 text-sm mb-3">Campeón y subcampeón de cada edición.</p>
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

      <section className="max-w-6xl mx-auto px-4 pb-14">
        <h2 className="font-display text-2xl mb-1 stitch pb-2">Historial de partidos</h2>
        <p className="text-tinta/50 text-sm mb-3">Últimos resultados registrados en esta competición.</p>
        <HistorialPartidos
          filas={partidos.map((p: any) => ({
            fecha: p.fecha,
            fase: p.fase,
            local: p.local?.nombre ?? "—",
            paisLocal: p.local?.pais ?? "—",
            visitante: p.visitante?.nombre ?? "—",
            paisVisitante: p.visitante?.pais ?? "—",
            golesLocal: p.goles_local,
            golesVisitante: p.goles_visitante,
          }))}
        />
      </section>
    </div>
  );
}
