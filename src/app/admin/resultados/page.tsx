"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Opcion = { id: string; nombre: string };

export default function ResultadosAdminPage() {
  const supabase = createClient();
  const [competiciones, setCompeticiones] = useState<Opcion[]>([]);
  const [clubes, setClubes] = useState<Opcion[]>([]);

  const [competicionId, setCompeticionId] = useState("");
  const [fase, setFase] = useState<"liga" | "eliminatoria" | "final">("liga");
  const [fecha, setFecha] = useState("");
  const [localId, setLocalId] = useState("");
  const [visitanteId, setVisitanteId] = useState("");
  const [golesLocal, setGolesLocal] = useState(0);
  const [golesVisitante, setGolesVisitante] = useState(0);
  const [foto, setFoto] = useState<File | null>(null);

  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    supabase
      .from("competiciones")
      .select("id, nombre")
      .order("nombre")
      .then(({ data }) => setCompeticiones(data ?? []));
    supabase
      .from("clubes")
      .select("id, nombre")
      .order("nombre")
      .then(({ data }) => setClubes(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function guardarResultado(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);

    if (!competicionId || !localId || !visitanteId || !fecha) {
      setMensaje("Completa todos los campos obligatorios.");
      return;
    }
    if (localId === visitanteId) {
      setMensaje("El club local y el visitante no pueden ser el mismo.");
      return;
    }

    setCargando(true);

    let imagenUrl: string | null = null;
    if (foto) {
      const ruta = `evidencias/${Date.now()}-${foto.name}`;
      const { error: errorSubida } = await supabase.storage
        .from("evidencias")
        .upload(ruta, foto);
      if (!errorSubida) {
        const { data } = supabase.storage.from("evidencias").getPublicUrl(ruta);
        imagenUrl = data.publicUrl;
      }
    }

    const { error } = await supabase.from("partidos").insert({
      competicion_id: competicionId,
      fase,
      fecha,
      local_id: localId,
      visitante_id: visitanteId,
      goles_local: golesLocal,
      goles_visitante: golesVisitante,
      imagen_evidencia: imagenUrl,
    });

    setCargando(false);

    if (error) {
      setMensaje(`Error: ${error.message}`);
      return;
    }

    setMensaje("Resultado guardado. El ranking se actualizó automáticamente.");
    setGolesLocal(0);
    setGolesVisitante(0);
    setFoto(null);
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Cargar resultado</h1>
      <p className="text-tinta/60 mb-6">
        Manualmente o subiendo una foto de evidencia. El ranking (puntos y
        partidos jugados) se recalcula automáticamente al guardar.
      </p>

      <form onSubmit={guardarResultado} className="bg-white border border-tinta/10 rounded-lg p-5 space-y-4 max-w-xl">
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
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Fase</label>
            <select
              value={fase}
              onChange={(e) => setFase(e.target.value as any)}
              className="w-full border border-tinta/20 rounded px-3 py-2"
            >
              <option value="liga">Fase de liga</option>
              <option value="eliminatoria">Eliminatoria</option>
              <option value="final">Final</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha</label>
            <input
              required
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-tinta/20 rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
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
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
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
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
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

        <div>
          <label className="block text-sm font-medium mb-1">
            Foto de evidencia (opcional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        </div>

        {mensaje && <p className="text-sm bg-crema border border-tinta/10 rounded p-2">{mensaje}</p>}

        <button
          disabled={cargando}
          className="w-full bg-campo text-crema font-semibold py-2.5 rounded hover:bg-campo2 transition disabled:opacity-60"
        >
          {cargando ? "Guardando…" : "Guardar resultado"}
        </button>
      </form>

      {clubes.length === 0 && (
        <p className="text-sm text-tinta/50 mt-4">
          Aún no hay clubes registrados. Ve a “Clubes” para agregar el primero.
        </p>
      )}
    </div>
  );
}
