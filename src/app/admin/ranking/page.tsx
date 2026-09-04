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
  clubId: string;
  club: string;
  clubEnEdicion: string;
  pais: string;
  puntos: number; // total mostrado (para "competicion": puntos; para "grupo": puntos + puntos_base)
  puntosEnEdicion: string;
  eliminado: boolean;
  posicionActual: number;
};

const COMPETICIONES_INDIVIDUALES = COMPETICIONES.filter((c) => !c.grupoRanking);
const GRUPOS = [
  { value: "uefa-global", label: "Ranking UEFA Global" },
  { value: "fifa-world", label: "Ranking FIFA World" },
] as const;

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function RankingAdminPage() {
  const supabase = createClient();
  const [competicionesDb, setCompeticionesDb] = useState<{ id: string; slug: string; nombre: string }[]>([]);
  const [fuente, setFuente] = useState<Fuente | null>(null);
  const [filas, setFilas] = useState<FilaEdicion[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
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
    setBusqueda("");
    setCargando(true);

    if (f.modo === "competicion") {
      const { data } = await supabase
        .from("rankings")
        .select("id, club_id, puntos, eliminado, clubes(nombre, pais)")
        .eq("competicion_id", f.competicionId);

      const ordenadas = (data ?? [])
        .slice()
        .sort((a: any, b: any) => (b.puntos ?? 0) - (a.puntos ?? 0));

      setFilas(
        ordenadas.map((r: any, i: number) => ({
          key: r.id,
          clubId: r.club_id,
          club: r.clubes?.nombre ?? "—",
          clubEnEdicion: r.clubes?.nombre ?? "—",
          pais: r.clubes?.pais ?? "—",
          puntos: r.puntos ?? 0,
          puntosEnEdicion: String(r.puntos ?? 0),
          eliminado: !!r.eliminado,
          posicionActual: i + 1,
        }))
      );
    } else {
      const { data } = await supabase
        .from("ranking_global")
        .select("id, club_id, puntos, puntos_base, eliminado, clubes(nombre, pais)")
        .eq("grupo", f.grupo);

      const ordenadas = (data ?? [])
        .slice()
        .sort(
          (a: any, b: any) =>
            (b.puntos ?? 0) + (b.puntos_base ?? 0) - ((a.puntos ?? 0) + (a.puntos_base ?? 0))
        );

      setFilas(
        ordenadas.map((r: any, i: number) => ({
          key: r.id,
          clubId: r.club_id,
          club: r.clubes?.nombre ?? "—",
          clubEnEdicion: r.clubes?.nombre ?? "—",
          pais: r.clubes?.pais ?? "—",
          puntos: (r.puntos ?? 0) + (r.puntos_base ?? 0),
          puntosEnEdicion: String((r.puntos ?? 0) + (r.puntos_base ?? 0)),
          eliminado: !!r.eliminado,
          posicionActual: i + 1,
        }))
      );
    }

    setCargando(false);
  }

  const filtradas = useMemo(() => {
    const q = normalizar(busqueda.trim());
    if (!q) return filas;
    return filas.filter((f) => normalizar(f.club).includes(q) || normalizar(f.pais).includes(q));
  }, [filas, busqueda]);

  function actualizarCampo(key: string, campo: "clubEnEdicion" | "puntosEnEdicion", valor: string) {
    setFilas((actual) => actual.map((f) => (f.key === key ? { ...f, [campo]: valor } : f)));
  }

  async function guardarNombre(fila: FilaEdicion) {
    const nuevoNombre = fila.clubEnEdicion.trim();
    if (!nuevoNombre || nuevoNombre === fila.club) return;

    setGuardandoId(fila.key);
    setMensaje(null);

    // El nombre vive en la tabla "clubes" (es el mismo club en todo el
    // sitio), así que renombrar aquí lo cambia en todas partes.
    const { error } = await supabase.from("clubes").update({ nombre: nuevoNombre }).eq("id", fila.clubId);

    setGuardandoId(null);

    if (error) {
      setMensaje(`Error al renombrar: ${error.message}`);
      return;
    }

    setFilas((actual) => actual.map((f) => (f.key === fila.key ? { ...f, club: nuevoNombre } : f)));
    setMensaje(`Club renombrado a “${nuevoNombre}” en todo el sitio.`);
  }

  async function guardarPuntos(fila: FilaEdicion) {
    if (!fuente) return;
    const valor = Number(fila.puntosEnEdicion);
    if (Number.isNaN(valor)) {
      setMensaje("Los puntos deben ser un número.");
      return;
    }

    setGuardandoId(fila.key);
    setMensaje(null);

    const tabla = fuente.modo === "competicion" ? "rankings" : "ranking_global";
    // En "rankings" el único campo de puntos es "puntos". En
    // "ranking_global" el total = puntos (automático por partidos) +
    // puntos_base (ajuste manual del admin), así que el ajuste manual
    // se guarda en "puntos_base" para no pisar lo que ya calculó el
    // sistema a partir de los partidos jugados.
    const campoAEditar = fuente.modo === "competicion" ? { puntos: valor } : { puntos_base: valor };

    const { error } = await supabase.from(tabla).update(campoAEditar).eq("id", fila.key);

    setGuardandoId(null);

    if (error) {
      setMensaje(`Error al guardar puntos: ${error.message}`);
      return;
    }

    if (fuente.modo === "competicion") {
      setFilas((actual) =>
        actual.map((f) => (f.key === fila.key ? { ...f, puntos: valor } : f))
      );
    } else {
      // No sabemos aquí cuánto vale "puntos" (automático) por separado,
      // así que recargamos esa fuente para reflejar el total correcto.
      await cargarFuente(fuente);
    }
    setMensaje("Puntos actualizados.");
  }

  async function alternarEliminado(fila: FilaEdicion) {
    if (!fuente) return;
    setGuardandoId(fila.key);
    setMensaje(null);

    const tabla = fuente.modo === "competicion" ? "rankings" : "ranking_global";
    const nuevoEstado = !fila.eliminado;

    const { error } = await supabase
      .from(tabla)
      .update({
        eliminado: nuevoEstado,
        fecha_eliminacion: nuevoEstado ? new Date().toISOString() : null,
      })
      .eq("id", fila.key);

    setGuardandoId(null);

    if (error) {
      setMensaje(`Error: ${error.message}`);
      return;
    }

    setFilas((actual) => actual.map((f) => (f.key === fila.key ? { ...f, eliminado: nuevoEstado } : f)));
    setMensaje(nuevoEstado ? `${fila.club} se quitó del ranking público.` : `${fila.club} volvió a aparecer en el ranking público.`);
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
      <h1 className="font-display text-3xl mb-1">Administrar rankings</h1>
      <p className="text-tinta/60 mb-6">
        Busca un club, corrige su nombre o sus puntos, o quítalo/restáuralo
        del ranking público. El cambio de 1 año ya no se carga aquí: se
        calcula solo a partir del historial de puntos.
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
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar club o país…"
            className="w-full sm:max-w-xs border border-tinta/20 rounded px-3 py-2 text-sm mb-3"
          />

          <div className="overflow-x-auto border border-tinta/10 rounded-lg mb-4">
            <table className="w-full text-sm border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-tinta text-crema text-left">
                  <th className="px-3 py-2">Rank</th>
                  <th className="px-3 py-2">Club (editable)</th>
                  <th className="px-3 py-2">País</th>
                  <th className="px-3 py-2 text-center">Puntos (editable)</th>
                  <th className="px-3 py-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((f) => (
                  <tr
                    key={f.key}
                    className={`border-b border-tinta/5 ${f.eliminado ? "bg-red-50 opacity-70" : "odd:bg-white even:bg-crema"}`}
                  >
                    <td className="px-3 py-2 text-tinta/50 font-semibold align-top">{f.posicionActual}</td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={f.clubEnEdicion}
                          onChange={(e) => actualizarCampo(f.key, "clubEnEdicion", e.target.value)}
                          className="border border-tinta/20 rounded px-2 py-1 w-40"
                        />
                        <button
                          onClick={() => guardarNombre(f)}
                          disabled={guardandoId === f.key || f.clubEnEdicion.trim() === f.club}
                          className="text-xs bg-tinta text-crema px-2 py-1 rounded disabled:opacity-40"
                        >
                          Guardar
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span className="mr-1">{banderaPais(f.pais)}</span>
                      {f.pais}
                    </td>
                    <td className="px-3 py-2 text-center align-top">
                      <div className="flex gap-2 justify-center">
                        <input
                          type="number"
                          value={f.puntosEnEdicion}
                          onChange={(e) => actualizarCampo(f.key, "puntosEnEdicion", e.target.value)}
                          className="w-24 text-center border border-tinta/20 rounded px-2 py-1"
                        />
                        <button
                          onClick={() => guardarPuntos(f)}
                          disabled={guardandoId === f.key || f.puntosEnEdicion === String(f.puntos)}
                          className="text-xs bg-tinta text-crema px-2 py-1 rounded disabled:opacity-40"
                        >
                          Guardar
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center align-top">
                      <button
                        onClick={() => alternarEliminado(f)}
                        disabled={guardandoId === f.key}
                        className={`text-xs px-3 py-1.5 rounded font-semibold ${
                          f.eliminado
                            ? "bg-green-600 text-white hover:opacity-90"
                            : "bg-red-600 text-white hover:opacity-90"
                        } disabled:opacity-50`}
                      >
                        {f.eliminado ? "Restaurar" : "Eliminar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {fuente.modo === "grupo" && (
            <p className="text-xs text-tinta/40">
              Nota: en los rankings de grupo, el campo de puntos editable
              ajusta la línea base manual del club; los puntos ganados por
              partidos jugados se siguen sumando aparte automáticamente.
            </p>
          )}
        </>
      )}

      {!cargando && fuente && filas.length === 0 && (
        <p className="text-sm text-tinta/50">Este ranking todavía no tiene clubes con puntos.</p>
      )}
    </div>
  );
}
