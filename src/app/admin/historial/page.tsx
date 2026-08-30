"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CompeticionOpcion = { id: string; nombre: string; slug: string };

type FilaPartido = {
  id: string;
  fecha: string;
  fase: string;
  goles_local: number;
  goles_visitante: number;
  eliminado: boolean;
  local: { nombre: string; pais: string } | null;
  visitante: { nombre: string; pais: string } | null;
};

const NOMBRE_FASE: Record<string, string> = {
  liga: "Fase de liga",
  eliminatoria: "Eliminatoria",
  final: "Final",
};

export default function HistorialAdminPage() {
  const supabase = createClient();
  const [competiciones, setCompeticiones] = useState<CompeticionOpcion[]>([]);
  const [competicionId, setCompeticionId] = useState("");
  const [partidos, setPartidos] = useState<FilaPartido[]>([]);
  const [cargando, setCargando] = useState(false);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("competiciones")
      .select("id, nombre, slug")
      .order("nombre")
      .then(({ data }) => setCompeticiones(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarPartidos(id: string) {
    setCargando(true);
    const { data } = await supabase
      .from("partidos")
      .select(
        "id, fecha, fase, goles_local, goles_visitante, eliminado, local:local_id(nombre, pais), visitante:visitante_id(nombre, pais)"
      )
      .eq("competicion_id", id)
      .order("fecha", { ascending: false });
    setPartidos((data as any) ?? []);
    setCargando(false);
  }

  useEffect(() => {
    if (!competicionId) {
      setPartidos([]);
      return;
    }
    cargarPartidos(competicionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competicionId]);

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este resultado? Podrás restaurarlo después desde esta misma pantalla.")) {
      return;
    }
    setProcesandoId(id);
    setMensaje(null);
    const { error } = await supabase.rpc("eliminar_partido", { p_id: id });
    setProcesandoId(null);
    if (error) {
      setMensaje(`Error: ${error.message}`);
      return;
    }
    setMensaje("Resultado eliminado. El ranking se recalculó automáticamente.");
    cargarPartidos(competicionId);
  }

  async function restaurar(id: string) {
    setProcesandoId(id);
    setMensaje(null);
    const { error } = await supabase.rpc("restaurar_partido", { p_id: id });
    setProcesandoId(null);
    if (error) {
      setMensaje(`Error: ${error.message}`);
      return;
    }
    setMensaje("Resultado restaurado. El ranking se recalculó automáticamente.");
    cargarPartidos(competicionId);
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Historial / Papelera</h1>
      <p className="text-tinta/60 mb-6">
        Elimina un resultado por error de carga, o restáuralo si te
        arrepentiste. Al eliminar o restaurar, el ranking y los
        enfrentamientos de esa competición se recalculan solos —no hace
        falta tocar nada más.
      </p>

      <div className="max-w-md mb-6">
        <label className="block text-sm font-medium mb-1">Competición</label>
        <select
          value={competicionId}
          onChange={(e) => setCompeticionId(e.target.value)}
          className="w-full border border-tinta/20 rounded px-3 py-2"
        >
          <option value="">Selecciona…</option>
          {competiciones.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {mensaje && (
        <p className="text-sm bg-crema border border-tinta/10 rounded p-2 mb-4 max-w-xl">{mensaje}</p>
      )}

      {!competicionId && (
        <p className="text-sm text-tinta/50">Elige una competición para ver sus resultados.</p>
      )}

      {competicionId && cargando && <p className="text-sm text-tinta/50">Cargando…</p>}

      {competicionId && !cargando && partidos.length === 0 && (
        <p className="text-sm text-tinta/50">Todavía no hay resultados cargados en esta competición.</p>
      )}

      {competicionId && !cargando && partidos.length > 0 && (
        <div className="overflow-x-auto border border-tinta/10 rounded-lg">
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-tinta text-crema text-left">
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Fase</th>
                <th className="px-3 py-2 text-right">Local</th>
                <th className="px-3 py-2 text-center">Resultado</th>
                <th className="px-3 py-2">Visitante</th>
                <th className="px-3 py-2 text-center">Estado</th>
                <th className="px-3 py-2 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {partidos.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-tinta/5 ${
                    p.eliminado ? "bg-red-50 text-tinta/40" : "odd:bg-white even:bg-crema"
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap">{p.fecha}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{NOMBRE_FASE[p.fase] ?? p.fase}</td>
                  <td className="px-3 py-2 text-right">
                    {p.local?.nombre ?? "—"}{" "}
                    <span className="text-xs opacity-60">({p.local?.pais ?? "—"})</span>
                  </td>
                  <td className="px-3 py-2 text-center font-display text-base">
                    {p.goles_local} - {p.goles_visitante}
                  </td>
                  <td className="px-3 py-2">
                    {p.visitante?.nombre ?? "—"}{" "}
                    <span className="text-xs opacity-60">({p.visitante?.pais ?? "—"})</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {p.eliminado ? (
                      <span className="text-red-600 font-medium">Eliminado</span>
                    ) : (
                      <span className="text-green-700 font-medium">Activo</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {p.eliminado ? (
                      <button
                        onClick={() => restaurar(p.id)}
                        disabled={procesandoId === p.id}
                        className="bg-campo text-crema text-xs font-semibold px-3 py-1.5 rounded hover:bg-campo2 transition disabled:opacity-60"
                      >
                        {procesandoId === p.id ? "…" : "Restaurar"}
                      </button>
                    ) : (
                      <button
                        onClick={() => eliminar(p.id)}
                        disabled={procesandoId === p.id}
                        className="bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-red-700 transition disabled:opacity-60"
                      >
                        {procesandoId === p.id ? "…" : "Eliminar"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
