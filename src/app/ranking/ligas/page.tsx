import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { banderaPais } from "@/lib/helpers";
import { nombreLiga } from "@/lib/ligas";

export const dynamic = "force-dynamic";

type FilaLiga = {
  pais: string;
  puntos: number;
  clubes: number;
};

export default async function RankingLigasPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("ranking_global")
    .select("puntos, puntos_base, clubes(pais)")
    .eq("grupo", "uefa-global");

  const acumulado = new Map<string, FilaLiga>();

  for (const fila of data ?? []) {
    const clubData = (fila as any).clubes;
    const pais: string = clubData?.pais ?? "—";
    const puntos = ((fila as any).puntos ?? 0) + ((fila as any).puntos_base ?? 0);

    const actual = acumulado.get(pais) ?? { pais, puntos: 0, clubes: 0 };
    actual.puntos += puntos;
    actual.clubes += 1;
    acumulado.set(pais, actual);
  }

  const ligas = Array.from(acumulado.values()).sort((a, b) => b.puntos - a.puntos);

  return (
    <div>
      <section className="bg-tinta text-crema">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="font-display text-4xl md:text-5xl">Ranking de Ligas</h1>
          <p className="text-crema/70 mt-2 max-w-2xl">
            Suma el total de puntos de todos los clubes de cada país dentro del Ranking
            UEFA Global (Champions League + Europa League + Conference League + Super
            Copa de Europa). No es un ranking oficial de la UEFA.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-sm text-tinta/50 mb-4">
          Se calcula a partir del{" "}
          <Link href="/ranking/uefa-global" className="underline hover:text-campo">
            Ranking UEFA Global
          </Link>
          .
        </p>

        {ligas.length === 0 ? (
          <p className="text-tinta/50 text-sm py-6">
            Todavía no hay ranking calculado. Se genera automáticamente al cargar
            resultados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[520px]">
              <thead>
                <tr className="bg-tinta text-crema text-left">
                  <th className="px-3 py-2">Rank</th>
                  <th className="px-3 py-2">País / Liga</th>
                  <th className="px-3 py-2 text-center">Clubes en el ranking</th>
                  <th className="px-3 py-2 text-center">Puntos totales</th>
                </tr>
              </thead>
              <tbody>
                {ligas.map((l, i) => (
                  <tr key={l.pais} className="odd:bg-white even:bg-crema border-b border-tinta/5">
                    <td className="px-3 py-2 text-tinta/50 font-semibold align-top">{i + 1}</td>
                    <td className="px-3 py-2 align-top">
                      <span className="mr-1.5">{banderaPais(l.pais)}</span>
                      <span className="font-medium">{nombreLiga(l.pais)}</span>
                      <div className="text-xs text-tinta/50 pl-6">{l.pais}</div>
                    </td>
                    <td className="px-3 py-2 text-center align-top">{l.clubes}</td>
                    <td className="px-3 py-2 text-center align-top">
                      <span className="font-semibold text-acento bg-tinta/90 text-white rounded px-2 py-1">
                        {l.puntos}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
