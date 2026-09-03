"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFiltroClubes } from "@/lib/competiciones";
import BuscadorClub, { ClubOpcion } from "@/components/BuscadorClub";

type CompeticionOpcion = { id: string; nombre: string; slug: string };

export default function ResultadosAdminPage() {
  const supabase = createClient();
  const [competiciones, setCompeticiones] = useState<CompeticionOpcion[]>([]);
  const [clubes, setClubes] = useState<ClubOpcion[]>([]);
  const [cargandoClubes, setCargandoClubes] = useState(false);

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
      .select("id, nombre, slug")
      .order("nombre")
      .then(({ data }) => setCompeticiones(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al cambiar de competición se vuelve a cargar la lista de clubes según
  // corresponda: Holanda / Europa (UEFA, incluye Holanda) / Mundial (todos)
  useEffect(() => {
    if (!competicionId) {
      setClubes([]);
      return;
    }
    const competicion = competiciones.find((c) => c.id === competicionId);
    const filtro = getFiltroClubes(competicion?.slug);

    setCargandoClubes(true);
    let consulta = supabase.from("clubes").select("id, nombre, pais").eq("eliminado", false).order("pais").order("nombre");

    if (filtro === "holanda") {
      consulta = consulta.eq("pais", "Holanda");
    } else if (filtro === "europa") {
      consulta = consulta.eq("confederacion", "UEFA");
    }

    consulta.then(({ data }) => {
      setClubes(data ?? []);
      setCargandoClubes(false);
      setLocalId((actual) => (data?.some((c) => c.id === actual) ? actual : ""));
      setVisitanteId((actual) => (data?.some((c) => c.id === actual) ? actual : ""));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competicionId, competiciones]);

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

  const clubLocal = clubes.find((c) => c.id === localId);
  const clubVisitante = clubes.find((c) => c.id === visitanteId);
  const filtro = getFiltroClubes(competiciones.find((c) => c.id === competicionId)?.slug);

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Cargar resultado</h1>
      <p className="text-tinta/60 mb-6">
        Manualmente o subiendo una foto de evidencia. El ranking se recalcula
        automáticamente al guardar.
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
          {competicionId && (
            <p className="text-xs text-tinta/50 mt-1">
              {filtro === "holanda" && "Mostrando solo clubes de Holanda."}
              {filtro === "europa" && "Mostrando clubes europeos (incluye Holanda)."}
              {filtro === "mundial" && "Mostrando clubes de todo el mundo."}
            </p>
          )}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BuscadorClub
            label="Equipo local"
            clubes={clubes}
            value={localId}
            onChange={setLocalId}
            excluirId={visitanteId || undefined}
            disabled={!competicionId || cargandoClubes}
            deshabilitadoTexto={!competicionId ? "Elige antes una competición" : "Cargando…"}
          />
          <BuscadorClub
            label="Equipo visitante"
            clubes={clubes}
            value={visitanteId}
            onChange={setVisitanteId}
            excluirId={localId || undefined}
            disabled={!competicionId || cargandoClubes}
            deshabilitadoTexto={!competicionId ? "Elige antes una competición" : "Cargando…"}
          />
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

        {clubLocal && clubVisitante && (
          <p className="text-center bg-campo text-crema rounded p-3 font-display text-lg break-words">
            {clubLocal.nombre} ({clubLocal.pais}) {golesLocal} - {golesVisitante} ({clubVisitante.pais}){" "}
            {clubVisitante.nombre}
          </p>
        )}

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

      {competicionId && clubes.length === 0 && !cargandoClubes && (
        <p className="text-sm text-tinta/50 mt-4">
          Todavía no hay clubes cargados para esta competición. Ve a
          “Clubes” para agregar el primero (recuerda que el país determina
          si aparece aquí).
        </p>
      )}
    </div>
  );
}
