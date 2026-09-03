"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFiltroClubes } from "@/lib/competiciones";
import BuscadorClub, { ClubOpcion } from "@/components/BuscadorClub";

type Resultado = {
  partidos: number;
  victoriasA: number;
  empates: number;
  victoriasB: number;
  golesA: number;
  golesB: number;
};

export default function EnfrentamientosBuscador({
  competicionId,
  slug,
}: {
  competicionId: string;
  slug: string;
}) {
  const supabase = createClient();
  const [clubes, setClubes] = useState<ClubOpcion[]>([]);
  const [cargandoClubes, setCargandoClubes] = useState(true);
  const [clubAId, setClubAId] = useState("");
  const [clubBId, setClubBId] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    const filtro = getFiltroClubes(slug);
    let consulta = supabase.from("clubes").select("id, nombre, pais").eq("eliminado", false).order("pais").order("nombre");
    if (filtro === "holanda") consulta = consulta.eq("pais", "Holanda");
    else if (filtro === "europa") consulta = consulta.eq("confederacion", "UEFA");

    consulta.then(({ data }) => {
      setClubes(data ?? []);
      setCargandoClubes(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function buscar() {
    setMensaje(null);
    setResultado(null);
    if (!clubAId || !clubBId) {
      setMensaje("Elige los dos clubes.");
      return;
    }
    if (clubAId === clubBId) {
      setMensaje("Elige dos clubes distintos.");
      return;
    }
    setBuscando(true);

    const { data, error } = await supabase
      .from("enfrentamientos")
      .select("club1_id, club2_id, partidos, victorias_club1, victorias_club2, empates, goles_club1, goles_club2")
      .eq("competicion_id", competicionId)
      .or(
        `and(club1_id.eq.${clubAId},club2_id.eq.${clubBId}),and(club1_id.eq.${clubBId},club2_id.eq.${clubAId})`
      )
      .maybeSingle();

    setBuscando(false);

    if (error) {
      setMensaje(`Error: ${error.message}`);
      return;
    }
    if (!data) {
      setMensaje("Todavía no hay partidos registrados entre estos dos clubes en esta competición.");
      return;
    }

    // Normaliza el resultado según el orden en que el usuario eligió A y B
    // (en la tabla, club1/club2 se guardan según el id, no según quién es "local")
    const aEsClub1 = data.club1_id === clubAId;
    setResultado({
      partidos: data.partidos,
      victoriasA: aEsClub1 ? data.victorias_club1 : data.victorias_club2,
      empates: data.empates,
      victoriasB: aEsClub1 ? data.victorias_club2 : data.victorias_club1,
      golesA: aEsClub1 ? data.goles_club1 : data.goles_club2,
      golesB: aEsClub1 ? data.goles_club2 : data.goles_club1,
    });
  }

  const clubA = clubes.find((c) => c.id === clubAId);
  const clubB = clubes.find((c) => c.id === clubBId);

  return (
    <div className="bg-white border border-tinta/10 rounded-lg p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <BuscadorClub
          label="Club 1"
          clubes={clubes}
          value={clubAId}
          onChange={setClubAId}
          excluirId={clubBId || undefined}
          disabled={cargandoClubes}
          deshabilitadoTexto="Cargando…"
        />
        <BuscadorClub
          label="Club 2"
          clubes={clubes}
          value={clubBId}
          onChange={setClubBId}
          excluirId={clubAId || undefined}
          disabled={cargandoClubes}
          deshabilitadoTexto="Cargando…"
        />
      </div>

      <button
        onClick={buscar}
        disabled={buscando}
        className="bg-campo text-crema font-semibold px-4 py-2 rounded hover:bg-campo2 transition disabled:opacity-60"
      >
        {buscando ? "Buscando…" : "Ver historial entre ambos"}
      </button>

      {mensaje && <p className="text-sm text-tinta/50 mt-3">{mensaje}</p>}

      {resultado && clubA && clubB && (
        <div className="mt-4 border-t border-tinta/10 pt-4">
          <p className="text-center font-display text-xl mb-3">
            {clubA.nombre} <span className="text-tinta/40 text-sm">vs</span> {clubB.nombre}
          </p>
          <p className="text-center text-sm text-tinta/60 mb-4">
            Partidos jugados: <span className="font-semibold text-tinta">{resultado.partidos}</span>
          </p>
          <div className="grid grid-cols-3 text-center gap-2 mb-4">
            <div className="bg-crema rounded p-3">
              <p className="text-2xl font-display">{resultado.victoriasA}</p>
              <p className="text-xs text-tinta/50">Victorias {clubA.nombre}</p>
            </div>
            <div className="bg-crema rounded p-3">
              <p className="text-2xl font-display">{resultado.empates}</p>
              <p className="text-xs text-tinta/50">Empates</p>
            </div>
            <div className="bg-crema rounded p-3">
              <p className="text-2xl font-display">{resultado.victoriasB}</p>
              <p className="text-xs text-tinta/50">Victorias {clubB.nombre}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 text-sm gap-2">
            <div className="bg-campo/5 rounded p-3 text-center">
              <p className="font-semibold">{clubA.nombre}</p>
              <p className="text-tinta/60">
                {resultado.golesA} goles a favor · {resultado.golesB} en contra
              </p>
            </div>
            <div className="bg-campo/5 rounded p-3 text-center">
              <p className="font-semibold">{clubB.nombre}</p>
              <p className="text-tinta/60">
                {resultado.golesB} goles a favor · {resultado.golesA} en contra
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
