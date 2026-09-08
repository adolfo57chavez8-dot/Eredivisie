"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFiltroClubes } from "@/lib/competiciones";
import BuscadorClub, { ClubOpcion } from "@/components/BuscadorClub";

type CompeticionOpcion = { id: string; nombre: string; slug: string };

type FilaFinal = {
  id: string;
  anio: number;
  goles_local: number;
  goles_visitante: number;
  eliminado: boolean;
  local: { nombre: string } | null;
  visitante: { nombre: string } | null;
};

export default function FinalesAdminPage() {
  const supabase = createClient();
  const [competiciones, setCompeticiones] = useState<CompeticionOpcion[]>([]);
  const [clubes, setClubes] = useState<ClubOpcion[]>([]);
  const [cargandoClubes, setCargandoClubes] = useState(false);

  const [competicionId, setCompeticionId] = useState("");
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [localId, setLocalId] = useState("");
  const [visitanteId, setVisitanteId] = useState("");
  const [golesLocal, setGolesLocal] = useState(0);
  const [golesVisitante, setGolesVisitante] = useState(0);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const [finales, setFinales] = useState<FilaFinal[]>([]);
  const [cargandoFinales, setCargandoFinales] = useState(false);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  async function cargarFinales(id: string) {
    setCargandoFinales(true);
    const { data } = await supabase
      .from("finales")
      .select(
        "id, anio, goles_local, goles_visitante, eliminado, local:club_local_id(nombre), visitante:club_visitante_id(nombre)"
      )
      .eq("competicion_id", id)
      .order("anio", { ascending: false });
    setFinales((data as any) ?? []);
    setCargandoFinales(false);
  }

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
      setFinales([]);
      return;
    }
    cargarFinales(competicionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competicionId]);

  async function eliminarFinal(id: string) {
    if (
      !confirm(
        "¿Eliminar esta final del historial? Podrás restaurarla después. No modifica el conteo de títulos en «Campeones»."
      )
    ) {
      return;
    }
    setProcesandoId(id);
    const { error } = await supabase
      .from("finales")
      .update({ eliminado: true, fecha_eliminacion: new Date().toISOString() })
      .eq("id", id);
    setProcesandoId(null);
    if (error) {
      setMensaje(`Error: ${error.message}`);
      return;
    }
    cargarFinales(competicionId);
  }

  async function restaurarFinal(id: string) {
    setProcesandoId(id);
    const { error } = await supabase
      .from("finales")
      .update({ eliminado: false, fecha_eliminacion: null })
      .eq("id", id);
    setProcesandoId(null);
    if (error) {
      setMensaje(`Error: ${error.message}`);
      return;
    }
    cargarFinales(competicionId);
  }

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

  // Registra (o suma un título) al campeón de la competición a partir del
  // resultado de la final que se acaba de guardar. Si es nuevo -> INSERT
  // con 1 título; si ya existía -> UPDATE títulos + 1. Nunca se borra el
  // historial de finales al hacer esto.
  async function actualizarCampeon(clubGanadorId: string) {
    const { data: existenteData } = await supabase
      .from("campeones")
      .select("id, titulos, primer_titulo")
      .eq("competicion_id", competicionId)
      .eq("club_id", clubGanadorId)
      .eq("eliminado", false)
      .maybeSingle();

    const existente = existenteData as { id: string; titulos: number; primer_titulo: number | null } | null;

    if (existente) {
      await supabase
        .from("campeones")
        .update({
          titulos: existente.titulos + 1,
          ultimo_titulo: anio,
          primer_titulo: existente.primer_titulo ?? anio,
        })
        .eq("id", existente.id);
    } else {
      await supabase.from("campeones").insert({
        competicion_id: competicionId,
        club_id: clubGanadorId,
        titulos: 1,
        primer_titulo: anio,
        ultimo_titulo: anio,
      });
    }
  }

  async function guardarFinal(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    if (!competicionId || !localId || !visitanteId) {
      setMensaje("Completa todos los campos.");
      return;
    }
    if (localId === visitanteId) {
      setMensaje("El local y el visitante no pueden ser el mismo club.");
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

    if (error) {
      setCargando(false);
      setMensaje(`Error: ${error.message}`);
      return;
    }

    // Determina automáticamente el campeón por el resultado y actualiza
    // (o crea) su registro en la tabla de campeones de esta competición.
    let mensajeCampeon = "";
    if (golesLocal > golesVisitante) {
      await actualizarCampeon(localId);
      mensajeCampeon = ` Campeón registrado: ${local?.nombre}.`;
    } else if (golesVisitante > golesLocal) {
      await actualizarCampeon(visitanteId);
      mensajeCampeon = ` Campeón registrado: ${visitante?.nombre}.`;
    } else {
      mensajeCampeon = " Fue empate: no se asignó campeón automáticamente (agrégalo a mano en «Campeones» si corresponde).";
    }

    setCargando(false);
    setMensaje("Final agregada al historial." + mensajeCampeon);
    if (competicionId) cargarFinales(competicionId);
  }

  const clubLocal = clubes.find((c) => c.id === localId);
  const clubVisitante = clubes.find((c) => c.id === visitanteId);

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Finales</h1>
      <p className="text-tinta/60 mb-6">
        Al guardar una final, el campeón se registra automáticamente (título
        nuevo o +1 si ya había ganado antes). El país de cada club se toma
        solo.
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

        {mensaje && <p className="text-sm bg-crema border border-tinta/10 rounded p-2">{mensaje}</p>}

        <button
          disabled={cargando}
          className="w-full bg-campo text-crema font-semibold py-2.5 rounded hover:bg-campo2 transition disabled:opacity-60"
        >
          {cargando ? "Guardando…" : "Guardar final"}
        </button>
      </form>

      <h2 className="font-display text-2xl mt-10 mb-1">Finales registradas</h2>
      <p className="text-tinta/60 mb-4">
        Elimina una final cargada por error, o restáurala si te
        arrepentiste. No modifica el conteo de títulos en «Campeones».
      </p>

      {!competicionId && (
        <p className="text-sm text-tinta/50">Elige una competición arriba para ver sus finales.</p>
      )}

      {competicionId && cargandoFinales && <p className="text-sm text-tinta/50">Cargando…</p>}

      {competicionId && !cargandoFinales && finales.length === 0 && (
        <p className="text-sm text-tinta/50">Todavía no hay finales cargadas en esta competición.</p>
      )}

      {competicionId && !cargandoFinales && finales.length > 0 && (
        <div className="overflow-x-auto border border-tinta/10 rounded-lg">
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-tinta text-crema text-left">
                <th className="px-3 py-2">Año</th>
                <th className="px-3 py-2 text-right">Local</th>
                <th className="px-3 py-2 text-center">Resultado</th>
                <th className="px-3 py-2">Visitante</th>
                <th className="px-3 py-2 text-center">Estado</th>
                <th className="px-3 py-2 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {finales.map((f) => (
                <tr
                  key={f.id}
                  className={`border-b border-tinta/5 ${
                    f.eliminado ? "bg-red-50 text-tinta/40" : "odd:bg-white even:bg-crema"
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap">{f.anio}</td>
                  <td className="px-3 py-2 text-right">{f.local?.nombre ?? "—"}</td>
                  <td className="px-3 py-2 text-center font-display text-base">
                    {f.goles_local} - {f.goles_visitante}
                  </td>
                  <td className="px-3 py-2">{f.visitante?.nombre ?? "—"}</td>
                  <td className="px-3 py-2 text-center">
                    {f.eliminado ? (
                      <span className="text-red-600 font-medium">Eliminado</span>
                    ) : (
                      <span className="text-green-700 font-medium">Activo</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {f.eliminado ? (
                      <button
                        onClick={() => restaurarFinal(f.id)}
                        disabled={procesandoId === f.id}
                        className="bg-campo text-crema text-xs font-semibold px-3 py-1.5 rounded hover:bg-campo2 transition disabled:opacity-60"
                      >
                        {procesandoId === f.id ? "…" : "Restaurar"}
                      </button>
                    ) : (
                      <button
                        onClick={() => eliminarFinal(f.id)}
                        disabled={procesandoId === f.id}
                        className="bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-red-700 transition disabled:opacity-60"
                      >
                        {procesandoId === f.id ? "…" : "Eliminar"}
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
