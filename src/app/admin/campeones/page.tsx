"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Opcion = { id: string; nombre: string };

export default function CampeonesAdminPage() {
  const supabase = createClient();
  const [competiciones, setCompeticiones] = useState<Opcion[]>([]);
  const [clubes, setClubes] = useState<Opcion[]>([]);

  const [competicionId, setCompeticionId] = useState("");
  const [clubId, setClubId] = useState("");
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    supabase.from("competiciones").select("id, nombre").order("nombre").then(({ data }) => setCompeticiones(data ?? []));
    supabase.from("clubes").select("id, nombre").order("nombre").then(({ data }) => setClubes(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function registrarTitulo(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    if (!competicionId || !clubId) {
      setMensaje("Selecciona la competición y el club.");
      return;
    }
    setCargando(true);

    // Busca si el club ya es campeón registrado en esta competición
    const { data: existenteData } = await supabase
      .from("campeones")
      .select("id, titulos, primer_titulo")
      .eq("competicion_id", competicionId)
      .eq("club_id", clubId)
      .maybeSingle();

    const existente = existenteData as {
      id: string;
      titulos: number;
      primer_titulo: number | null;
    } | null;

    let error;
    if (existente) {
      // Si ya existe, se suma 1 título y se actualiza el último año
      ({ error } = await supabase
        .from("campeones")
        .update({
          titulos: existente.titulos + 1,
          ultimo_titulo: anio,
          primer_titulo: existente.primer_titulo ?? anio,
        })
        .eq("id", existente.id));
    } else {
      // Si es nuevo, se agrega con 1 título
      ({ error } = await supabase.from("campeones").insert({
        competicion_id: competicionId,
        club_id: clubId,
        titulos: 1,
        primer_titulo: anio,
        ultimo_titulo: anio,
      }));
    }

    setCargando(false);

    if (error) {
      setMensaje(`Error: ${error.message}`);
      return;
    }

    setMensaje(
      existente
        ? "Título sumado. Ahora tiene " + (existente.titulos + 1) + " títulos."
        : "Club agregado a la tabla de campeones con 1 título."
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Campeones</h1>
      <p className="text-tinta/60 mb-6">
        Si el club ya existe en la tabla de campeones de la competición, se le
        suma 1 título. Si es nuevo, se agrega con 1 título.
      </p>

      <form onSubmit={registrarTitulo} className="bg-white border border-tinta/10 rounded-lg p-5 space-y-4 max-w-xl">
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
          <label className="block text-sm font-medium mb-1">Club campeón</label>
          <select
            required
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            className="w-full border border-tinta/20 rounded px-3 py-2"
          >
            <option value="">Selecciona…</option>
            {clubes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Año del título</label>
          <input
            type="number"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="w-full border border-tinta/20 rounded px-3 py-2"
          />
        </div>

        {mensaje && <p className="text-sm bg-crema border border-tinta/10 rounded p-2">{mensaje}</p>}

        <button
          disabled={cargando}
          className="w-full bg-campo text-crema font-semibold py-2.5 rounded hover:bg-campo2 transition disabled:opacity-60"
        >
          {cargando ? "Guardando…" : "Guardar título"}
        </button>
      </form>
    </div>
  );
}