"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFiltroClubes } from "@/lib/competiciones";
import BuscadorClub, { ClubOpcion } from "@/components/BuscadorClub";

type CompeticionOpcion = { id: string; nombre: string; slug: string };

export default function CampeonesAdminPage() {
  const supabase = createClient();
  const [competiciones, setCompeticiones] = useState<CompeticionOpcion[]>([]);
  const [clubes, setClubes] = useState<ClubOpcion[]>([]);
  const [cargandoClubes, setCargandoClubes] = useState(false);

  const [competicionId, setCompeticionId] = useState("");
  const [clubId, setClubId] = useState("");
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
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
      setClubId((actual) => (data?.some((c) => c.id === actual) ? actual : ""));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competicionId, competiciones]);

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
        Uso manual: normalmente el campeón se registra solo al guardar una
        final en «Finales». Usa esta pantalla solo para corregir o cargar un
        título suelto.
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

        <BuscadorClub
          label="Club campeón"
          clubes={clubes}
          value={clubId}
          onChange={setClubId}
          disabled={!competicionId || cargandoClubes}
          deshabilitadoTexto={!competicionId ? "Elige antes una competición" : "Cargando…"}
        />

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
