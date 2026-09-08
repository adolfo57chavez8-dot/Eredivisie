"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFiltroClubes } from "@/lib/competiciones";
import BuscadorClub, { ClubOpcion } from "@/components/BuscadorClub";

type CompeticionOpcion = { id: string; nombre: string; slug: string };

type FilaCampeon = {
  id: string;
  titulos: number;
  primer_titulo: number | null;
  ultimo_titulo: number | null;
  eliminado: boolean;
  competiciones: { nombre: string } | null;
  clubes: { nombre: string; pais: string } | null;
};

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

  const [listado, setListado] = useState<FilaCampeon[]>([]);
  const [cargandoListado, setCargandoListado] = useState(false);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  async function cargarListado() {
    setCargandoListado(true);
    const { data } = await supabase
      .from("campeones")
      .select(
        "id, titulos, primer_titulo, ultimo_titulo, eliminado, competiciones(nombre), clubes(nombre, pais)"
      )
      .order("ultimo_titulo", { ascending: false });
    setListado((data as any) ?? []);
    setCargandoListado(false);
  }

  useEffect(() => {
    supabase
      .from("competiciones")
      .select("id, nombre, slug")
      .order("nombre")
      .then(({ data }) => setCompeticiones(data ?? []));
    cargarListado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function eliminarCampeon(id: string) {
    if (
      !confirm(
        "¿Eliminar este campeón de la tabla? Podrás restaurarlo después. No afecta a las finales ya registradas."
      )
    ) {
      return;
    }
    setProcesandoId(id);
    const { error } = await supabase
      .from("campeones")
      .update({ eliminado: true, fecha_eliminacion: new Date().toISOString() })
      .eq("id", id);
    setProcesandoId(null);
    if (error) {
      setMensaje(`Error: ${error.message}`);
      return;
    }
    cargarListado();
  }

  async function restaurarCampeon(id: string) {
    setProcesandoId(id);
    const { error } = await supabase
      .from("campeones")
      .update({ eliminado: false, fecha_eliminacion: null })
      .eq("id", id);
    setProcesandoId(null);
    if (error) {
      setMensaje(`Error: ${error.message}`);
      return;
    }
    cargarListado();
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

    // Busca si el club ya es campeón registrado (y activo) en esta
    // competición. Si el registro existente está en la papelera, se
    // trata como si no existiera y se crea uno nuevo en su lugar.
    const { data: existenteData } = await supabase
      .from("campeones")
      .select("id, titulos, primer_titulo")
      .eq("competicion_id", competicionId)
      .eq("club_id", clubId)
      .eq("eliminado", false)
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
    cargarListado();
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

      <h2 className="font-display text-2xl mt-10 mb-1">Campeones registrados</h2>
      <p className="text-tinta/60 mb-4">
        Elimina un campeón cargado por error, o restáuralo si te
        arrepentiste. No afecta a las finales ya guardadas en «Finales».
      </p>

      {cargandoListado && <p className="text-sm text-tinta/50">Cargando…</p>}

      {!cargandoListado && listado.length === 0 && (
        <p className="text-sm text-tinta/50">Todavía no hay campeones registrados.</p>
      )}

      {!cargandoListado && listado.length > 0 && (
        <div className="overflow-x-auto border border-tinta/10 rounded-lg">
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-tinta text-crema text-left">
                <th className="px-3 py-2">Competición</th>
                <th className="px-3 py-2">Club</th>
                <th className="px-3 py-2 text-center">Títulos</th>
                <th className="px-3 py-2 text-center">Primero - Último</th>
                <th className="px-3 py-2 text-center">Estado</th>
                <th className="px-3 py-2 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {listado.map((c) => (
                <tr
                  key={c.id}
                  className={`border-b border-tinta/5 ${
                    c.eliminado ? "bg-red-50 text-tinta/40" : "odd:bg-white even:bg-crema"
                  }`}
                >
                  <td className="px-3 py-2">{c.competiciones?.nombre ?? "—"}</td>
                  <td className="px-3 py-2 font-medium">
                    {c.clubes?.nombre ?? "—"}{" "}
                    <span className="text-xs opacity-60">({c.clubes?.pais ?? "—"})</span>
                  </td>
                  <td className="px-3 py-2 text-center font-display text-base">{c.titulos}</td>
                  <td className="px-3 py-2 text-center">
                    {c.primer_titulo ?? "—"} - {c.ultimo_titulo ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {c.eliminado ? (
                      <span className="text-red-600 font-medium">Eliminado</span>
                    ) : (
                      <span className="text-green-700 font-medium">Activo</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {c.eliminado ? (
                      <button
                        onClick={() => restaurarCampeon(c.id)}
                        disabled={procesandoId === c.id}
                        className="bg-campo text-crema text-xs font-semibold px-3 py-1.5 rounded hover:bg-campo2 transition disabled:opacity-60"
                      >
                        {procesandoId === c.id ? "…" : "Restaurar"}
                      </button>
                    ) : (
                      <button
                        onClick={() => eliminarCampeon(c.id)}
                        disabled={procesandoId === c.id}
                        className="bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-red-700 transition disabled:opacity-60"
                      >
                        {procesandoId === c.id ? "…" : "Eliminar"}
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
