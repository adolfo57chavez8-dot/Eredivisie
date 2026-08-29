"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Opcion = { id: string; nombre: string; pais?: string };

export default function FinalesAdminPage() {
  const supabase = createClient();
  const [competiciones, setCompeticiones] = useState<Opcion[]>([]);
  const [clubes, setClubes] = useState<Opcion[]>([]);

  const [competicionId, setCompeticionId] = useState("");
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [localId, setLocalId] = useState("");
  const [visitanteId, setVisitanteId] = useState("");
  const [golesLocal, setGolesLocal] = useState(0);
  const [golesVisitante, setGolesVisitante] = useState(0);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    supabase.from("competiciones").select("id, nombre").order("nombre").then(({ data }) => setCompeticiones(data ?? []));
    supabase.from("clubes").select("id, nombre, pais").order("nombre").then(({ data }) => setClubes(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function guardarFinal(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    if (!competicionId || !localId || !visitanteId) {
      setMensaje("Completa todos los campos.");
      return;
    }
    setCargando(true);

    const local = clubes.find((c) => c.id === localId);
    const visitante = clubes.find((c) => c.id === visitanteId);

    const { error } = await supabase.from("finales").insert({
      competicion_id: competicionId,
      anio,
      club_local_id: localId,
      club_visitante_id: visitanteId,
      goles_local: golesLocal,
      goles_visitante: golesVisitante,
      pais_local: local?.pais ?? null,
      pais_visitante: visitante?.pais ?? null,
    });

    setCargando(false);

    if (error) {
      setMensaje(`Error: ${error.message}`);
      return;
    }

    setMensaje("Final agregada al historial.");
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Finales</h1>
      <p className="text-tinta/60 mb-6">
        Agrega finales pasadas al historial de la competición (el país de cada
        club se toma automáticamente).
      </p>

      <form onSubmit={guardarFinal} className="bg-white border border-tinta/10 rounded-lg p-5 space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium mb-1">Competición</label>
          <select
            required
            value={competicionId}
            onChange={(e) => setCompeticionId(e.target.value)}
            className="w-full border border-tinta/20 rounded px-3 py-2"
          >
            <option value="">Selecciona…</option>
            {competiciones.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Año</label>
          <input
            type="number"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="w-full border border-tinta/20 rounded px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Club local</label>
            <select
              required
              value={localId}
              onChange={(e) => setLocalId(e.target.value)}
              className="w-full border border-tinta/20 rounded px-3 py-2"
            >
              <option value="">Selecciona…</option>
              {clubes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Club visitante</label>
            <select
              required
              value={visitanteId}
              onChange={(e) => setVisitanteId(e.target.value)}
              className="w-full border border-tinta/20 rounded px-3 py-2"
            >
              <option value="">Selecciona…</option>
              {clubes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Goles local</label>
            <input
              type="number"
              min={0}
              value={golesLocal}
              onChange={(e) => setGolesLocal(Number(e.target.value))}
              className="w-full border border-tinta/20 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Goles visitante</label>
            <input
              type="number"
              min={0}
              value={golesVisitante}
              onChange={(e) => setGolesVisitante(Number(e.target.value))}
              className="w-full border border-tinta/20 rounded px-3 py-2"
            />
          </div>
        </div>

        {mensaje && <p className="text-sm bg-crema border border-tinta/10 rounded p-2">{mensaje}</p>}

        <button
          disabled={cargando}
          className="w-full bg-campo text-crema font-semibold py-2.5 rounded hover:bg-campo2 transition disabled:opacity-60"
        >
          {cargando ? "Guardando…" : "Guardar final"}
        </button>
      </form>
    </div>
  );
}
