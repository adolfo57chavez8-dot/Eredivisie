"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { COMPETICIONES } from "@/lib/competiciones";
import { banderaPais } from "@/lib/helpers";

type Fuente =
  | { modo: "competicion"; competicionId: string; slug: string }
  | { modo: "grupo"; grupo: "uefa-global" | "fifa-world" };

type FilaEdicion = {
  key: string; // id de la fila en rankings/ranking_global
  club: string;
  pais: string;
  puntos: number;
  posicionActual: number;
  posicionAnterior: string; // como texto para el input controlado
};

const COMPETICIONES_INDIVIDUALES = COMPETICIONES.filter((c) => !c.grupoRanking);
const GRUPOS = [
  { value: "uefa-global", label: "Ranking UEFA Global" },
  { value: "fifa-world", label: "Ranking FIFA World" },
] as const;

export default function RankingAdminPage() {
  const supabase = createClient();
  const [competicionesDb, setCompeticionesDb] = useState<{ id: string; slug: string; nombre: string }[]>([]);
  const [fuente, setFuente] = useState<Fuente | null>(null);
  const [filas, setFilas] = useState<FilaEdicion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("competiciones")
      .select("id, slug, nombre")
      .then(({ data }) => setCompeticionesDb(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarFuente(f: Fuente) {
    setFuente(f);
    setMensaje(null);
    setCargando(true);

    if (f.modo === "competicion") {
      const { data } = await supabase
        .from("rankings")
        .select("id, puntos, posicion_anterior, clubes(nombre, pais)")
        .eq("competicion_id", f.competicionId);

      const ordenadas = (data ?? [])
        .slice()
        .sort((a: any, b: any) => (b.puntos ?? 0) - (a.puntos ?? 0));

      setFilas(
        ordenadas.map((r: any, i: number) => ({
          key: r.id,
          club: r.clubes?.nombre ?? "—",
          pais: r.clubes?.pais ?? "—",
          puntos: r.puntos ?? 0,
          posicionActual: i + 1,
          posicionAnterior: r.posicion_anterior != null ? String(r.posicion_anterior) : "",
        }))
      );
    } else {
      const { data } = await supabase
        .from("ranking_global")
        .select("id, puntos, puntos_base, posicion_anterior, clubes(nombre, pais)")
        .eq("grupo", f.grupo);

      const ordenadas = (data ?? [])
        .slice()
        .sort((a: any, b: any) => (b.puntos ?? 0) + (b.puntos_base ?? 0) - ((a.puntos ?? 0) + (a.puntos_base ?? 0)));

      setFilas(
        ordenadas.map((r: any, i: number) => ({
          key: r.id,
          club: r.clubes?.nombre ?? "—",
          pais: r.clubes?.pais ?? "—",
          puntos: (r.puntos ?? 0) + (r.puntos_base ?? 0),
          posicionActual: i + 1,
          posicionAnterior: r.posicion_anterior != null ? String(r.posicion_anterior) : "",
        }))
      );
    }

    setCargando(false);
  }

  function actualizarCampo(key: string, valor: string) {
    setFilas((actual) => actual.map((f) => (f.key === key ? { ...f, posicionAnterior: valor } : f)));
  }

  async function guardarCambios() {
    if (!fuente) return;
    setGuardando(true);
    setMensaje(null);

    const tabla = fuente.modo === "competicion" ? "rankings" : "ranking_global";

    const actualizaciones = filas.map((f) => {
      const valor = f.posicionAnterior.trim();
      const posicion_anterior = valor === "" ? null : Number(valor);
      return supabase.from(tabla).update({ posicion_anterior }).eq("id", f.key);
    });

    const resultados = await Promise.all(actualizaciones);
    const conError = resultados.find((r) => r.error);

    setGuardando(false);

    if (conError?.error) {
      setMensaje(`Error al guardar: ${conError.error.message}`);
      return;
    }

    setMensaje("Posiciones de hace 1 año guardadas. El indicador ▲/▼ ya refleja el cambio.");
  }

  const opcionesCompeticion = useMemo(
    () =>
      COMPETICIONES_INDIVIDUALES.map((c) => ({
        ...c,
        db: competicionesDb.find((d) => d.slug === c.slug),
      })).filter((c) => c.db),
    [competicionesDb]
  );

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Ranking — comparación 1 año</h1>
      <p className="text-tinta/60 mb-6">
        Carga aquí la posición que ocupaba cada club hace 1 año. Con eso, la
        tabla pública muestra el triángulo verde (subió) o rojo (bajó) junto
        al ranking. El puntaje y la posición actual se calculan solos; esta
        pantalla solo guarda el dato de comparación.
      </p>

      <div className="bg-white border border-tinta/10 rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Ranking individual</label>
          <select
            className="border border-tinta/20 rounded px-3 py-2 min-w-[220px]"
            value={fuente?.modo === "competicion" ? fuente.competicionId : ""}
            onChange={(e) => {
              const db = opcionesCompeticion.find((c) => c.db!.id === e.target.value);
              if (db) cargarFuente({ modo: "competicion", competicionId: db.db!.id, slug: db.slug });
            }}
          >
            <option value="">Selecciona…</option>
            {opcionesCompeticion.map((c) => (
              <option key={c.slug} value={c.db!.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <span className="text-tinta/40 text-sm pb-2">— o —</span>

        <div>
          <label className="block text-sm font-medium mb-1">Ranking de grupo</label>
          <select
            className="border border-tinta/20 rounded px-3 py-2 min-w-[220px]"
            value={fuente?.modo === "grupo" ? fuente.grupo : ""}
            onChange={(e) => {
              const grupo = e.target.value as "uefa-global" | "fifa-world";
              if (grupo) cargarFuente({ modo: "grupo", grupo });
            }}
          >
            <option value="">Selecciona…</option>
            {GRUPOS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mensaje && <p className="text-sm bg-crema border border-tinta/10 rounded p-3 mb-4">{mensaje}</p>}

      {cargando && <p className="text-sm text-tinta/50">Cargando…</p>}

      {!cargando && fuente && filas.length > 0 && (
        <>
          <div className="overflow-x-auto border border-tinta/10 rounded-lg mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-tinta text-crema text-left">
                  <th className="px-3 py-2">Rank actual</th>
                  <th className="px-3 py-2">Club</th>
                  <th className="px-3 py-2 text-center">Puntos</th>
                  <th className="px-3 py-2 text-center">Posición hace 1 año</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.key} className="odd:bg-white even:bg-crema border-b border-tinta/5">
                    <td className="px-3 py-2 text-tinta/50 font-semibold">{f.posicionActual}</td>
                    <td className="px-3 py-2 font-medium">
                      <span className="mr-1.5">{banderaPais(f.pais)}</span>
                      {f.club}
                    </td>
                    <td className="px-3 py-2 text-center">{f.puntos}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={1}
                        placeholder="—"
                        value={f.posicionAnterior}
                        onChange={(e) => actualizarCampo(f.key, e.target.value)}
                        className="w-24 text-center border border-tinta/20 rounded px-2 py-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={guardarCambios}
            disabled={guardando}
            className="bg-campo text-crema font-semibold px-4 py-2.5 rounded hover:bg-campo2 transition disabled:opacity-60"
          >
            {guardando ? "Guardando…" : "Guardar posiciones"}
          </button>
        </>
      )}

      {!cargando && fuente && filas.length === 0 && (
        <p className="text-sm text-tinta/50">Este ranking todavía no tiene clubes con puntos.</p>
      )}
    </div>
  );
}
