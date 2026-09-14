"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFiltroClubes } from "@/lib/competiciones";
import BuscadorClub, { ClubOpcion } from "@/components/BuscadorClub";
import Marcador from "@/components/Marcador";

type CompeticionOpcion = { id: string; nombre: string; slug: string };

type FilaFinal = {
  id: string;
  anio: number;
  goles_local: number;
  goles_visitante: number;
  penales_local: number | null;
  penales_visitante: number | null;
  eliminado: boolean;
  local: { nombre: string } | null;
  visitante: { nombre: string } | null;
};

type FilaLoteFinal = {
  clave: string;
  anio: number;
  localId: string;
  visitanteId: string;
  golesLocal: number;
  golesVisitante: number;
  penalesLocal: number | null;
  penalesVisitante: number | null;
  incluir: boolean;
  localTexto: string | null;
  visitanteTexto: string | null;
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
  const [huboPenales, setHuboPenales] = useState(false);
  const [penalesLocal, setPenalesLocal] = useState(0);
  const [penalesVisitante, setPenalesVisitante] = useState(0);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const [finales, setFinales] = useState<FilaFinal[]>([]);
  const [cargandoFinales, setCargandoFinales] = useState(false);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [foto, setFoto] = useState<File | null>(null);
  const [leyendoIA, setLeyendoIA] = useState(false);
  const [mensajeIA, setMensajeIA] = useState<string | null>(null);
  const [lote, setLote] = useState<FilaLoteFinal[] | null>(null);
  const [guardandoLote, setGuardandoLote] = useState(false);
  const [resumenLote, setResumenLote] = useState<string | null>(null);

  async function cargarFinales(id: string) {
    setCargandoFinales(true);
    const { data } = await supabase
      .from("finales")
      .select(
        "id, anio, goles_local, goles_visitante, penales_local, penales_visitante, eliminado, local:club_local_id(nombre), visitante:club_visitante_id(nombre)"
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
    } else if (filtro === "espana") {
      consulta = consulta.eq("pais", "España");
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

  useEffect(() => {
    if (golesLocal !== golesVisitante) setHuboPenales(false);
  }, [golesLocal, golesVisitante]);

  // Registra (o suma un título) al campeón de la competición a partir del
  // resultado de la final que se acaba de guardar. Si es nuevo -> INSERT
  // con 1 título; si ya existía -> UPDATE títulos + 1. Nunca se borra el
  // historial de finales al hacer esto.
  async function actualizarCampeon(clubGanadorId: string, anioFinal: number) {
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
          ultimo_titulo: anioFinal,
          primer_titulo: existente.primer_titulo ?? anioFinal,
        })
        .eq("id", existente.id);
    } else {
      await supabase.from("campeones").insert({
        competicion_id: competicionId,
        club_id: clubGanadorId,
        titulos: 1,
        primer_titulo: anioFinal,
        ultimo_titulo: anioFinal,
      });
    }
  }

  async function leerConIA() {
    if (!foto) {
      setMensajeIA("Primero elige una foto (un resultado o una tabla con varias finales).");
      return;
    }
    if (!competicionId) {
      setMensajeIA("Elige primero la competición, así se puede emparejar con sus clubes.");
      return;
    }

    setLeyendoIA(true);
    setMensajeIA(null);
    setLote(null);
    setResumenLote(null);

    const formData = new FormData();
    formData.append("imagen", foto);
    formData.append("clubes", JSON.stringify(clubes.map((c) => ({ id: c.id, nombre: c.nombre }))));

    try {
      const respuesta = await fetch("/api/leer-resultado", { method: "POST", body: formData });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setMensajeIA(datos.error ?? "No se pudo leer la imagen.");
        return;
      }

      const resultados: Array<{
        local_id: string | null;
        visitante_id: string | null;
        local_texto: string | null;
        visitante_texto: string | null;
        goles_local: number | null;
        goles_visitante: number | null;
        penales_local: number | null;
        penales_visitante: number | null;
        anio: number | null;
      }> = datos.resultados ?? [];

      if (resultados.length === 0) {
        setMensajeIA("No se pudo identificar ninguna final. Complétala a mano.");
        return;
      }

      if (resultados.length === 1) {
        const r = resultados[0];
        let identificados = 0;
        if (r.local_id) {
          setLocalId(r.local_id);
          identificados++;
        }
        if (r.visitante_id) {
          setVisitanteId(r.visitante_id);
          identificados++;
        }
        if (typeof r.goles_local === "number") setGolesLocal(r.goles_local);
        if (typeof r.goles_visitante === "number") setGolesVisitante(r.goles_visitante);
        if (typeof r.penales_local === "number" && typeof r.penales_visitante === "number") {
          setHuboPenales(true);
          setPenalesLocal(r.penales_local);
          setPenalesVisitante(r.penales_visitante);
        } else {
          setHuboPenales(false);
        }
        if (typeof r.anio === "number") setAnio(r.anio);

        if (identificados === 2) {
          setMensajeIA("Listo — revisa que esté todo bien antes de guardar.");
        } else if (identificados === 1) {
          setMensajeIA("Solo se identificó un equipo con confianza. Completa el otro a mano.");
        } else {
          setMensajeIA("No se pudo identificar ningún equipo con confianza. Complétalo a mano.");
        }
        return;
      }

      // Varias finales en la misma imagen (por ejemplo, una tabla con el
      // historial de varias temporadas): se arma una lista para revisar y
      // guardarlas todas juntas.
      const filas: FilaLoteFinal[] = resultados.map((r, i) => ({
        clave: `${Date.now()}-${i}`,
        anio: typeof r.anio === "number" ? r.anio : new Date().getFullYear(),
        localId: r.local_id ?? "",
        visitanteId: r.visitante_id ?? "",
        golesLocal: typeof r.goles_local === "number" ? r.goles_local : 0,
        golesVisitante: typeof r.goles_visitante === "number" ? r.goles_visitante : 0,
        penalesLocal: typeof r.penales_local === "number" ? r.penales_local : null,
        penalesVisitante: typeof r.penales_visitante === "number" ? r.penales_visitante : null,
        incluir: Boolean(r.local_id && r.visitante_id),
        localTexto: r.local_texto ?? null,
        visitanteTexto: r.visitante_texto ?? null,
      }));

      setLote(filas);
      const completos = filas.filter((f) => f.incluir).length;
      setMensajeIA(
        `Se identificaron ${filas.length} finales (${completos} listas, revisa el resto abajo antes de guardar).`
      );
    } catch {
      setMensajeIA("Error de conexión al leer la imagen. Intenta de nuevo.");
    } finally {
      setLeyendoIA(false);
    }
  }

  function actualizarFilaLote(clave: string, cambios: Partial<FilaLoteFinal>) {
    setLote((actual) => actual?.map((f) => (f.clave === clave ? { ...f, ...cambios } : f)) ?? null);
  }

  function quitarFilaLote(clave: string) {
    setLote((actual) => actual?.filter((f) => f.clave !== clave) ?? null);
  }

  async function guardarLote() {
    if (!lote || !competicionId) return;

    const filasAGuardar = lote.filter((f) => f.incluir);
    if (filasAGuardar.length === 0) {
      setResumenLote("No hay ninguna final marcada para guardar.");
      return;
    }
    for (const f of filasAGuardar) {
      if (!f.localId || !f.visitanteId) {
        setResumenLote("Hay filas marcadas sin los dos equipos elegidos. Complétalas o desmárcalas.");
        return;
      }
      if (f.localId === f.visitanteId) {
        setResumenLote("Hay una fila con el mismo equipo como local y visitante.");
        return;
      }
      if (f.penalesLocal !== null && f.penalesVisitante !== null && f.penalesLocal === f.penalesVisitante) {
        setResumenLote("Hay una fila con penales empatados — alguien tuvo que ganar.");
        return;
      }
    }

    setGuardandoLote(true);
    setResumenLote(null);

    let guardadas = 0;
    const clavesFallidas: string[] = [];

    for (const f of filasAGuardar) {
      const local = clubes.find((c) => c.id === f.localId);
      const visitante = clubes.find((c) => c.id === f.visitanteId);

      const { error } = await supabase.from("finales").insert({
        competicion_id: competicionId,
        anio: f.anio,
        club_local_id: f.localId,
        club_visitante_id: f.visitanteId,
        goles_local: f.golesLocal,
        goles_visitante: f.golesVisitante,
        penales_local: f.penalesLocal,
        penales_visitante: f.penalesVisitante,
        pais_local: local?.pais ?? null,
        pais_visitante: visitante?.pais ?? null,
      });

      if (error) {
        clavesFallidas.push(f.clave);
        continue;
      }

      guardadas++;
      if (f.golesLocal > f.golesVisitante) {
        await actualizarCampeon(f.localId, f.anio);
      } else if (f.golesVisitante > f.golesLocal) {
        await actualizarCampeon(f.visitanteId, f.anio);
      } else if (f.penalesLocal !== null && f.penalesVisitante !== null) {
        // Empate en tiempo reglamentario, definido por penales.
        if (f.penalesLocal > f.penalesVisitante) await actualizarCampeon(f.localId, f.anio);
        else if (f.penalesVisitante > f.penalesLocal) await actualizarCampeon(f.visitanteId, f.anio);
      }
      // Empate sin penales: igual que antes, no se asigna campeón solo.
    }

    setGuardandoLote(false);

    if (clavesFallidas.length === 0) {
      setResumenLote(`Se guardaron las ${guardadas} finales y sus campeones se actualizaron.`);
      setLote(null);
      setFoto(null);
    } else {
      setResumenLote(
        `Se guardaron ${guardadas} de ${filasAGuardar.length}. ${clavesFallidas.length} fallaron — quedan marcadas abajo, revisa e intenta de nuevo.`
      );
      setLote((actual) => actual?.filter((f) => clavesFallidas.includes(f.clave) || !f.incluir) ?? null);
    }

    if (competicionId) cargarFinales(competicionId);
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
    if (huboPenales && golesLocal !== golesVisitante) {
      setMensaje("Los penales solo aplican si el marcador quedó igualado.");
      return;
    }
    if (huboPenales && penalesLocal === penalesVisitante) {
      setMensaje("Los penales no pueden terminar empatados — alguien tuvo que ganar.");
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
      penales_local: huboPenales ? penalesLocal : null,
      penales_visitante: huboPenales ? penalesVisitante : null,
      pais_local: local?.pais ?? null,
      pais_visitante: visitante?.pais ?? null,
    });

    if (error) {
      setCargando(false);
      setMensaje(`Error: ${error.message}`);
      return;
    }

    // Determina automáticamente el campeón por el resultado (o por
    // penales, si el tiempo reglamentario quedó igualado) y actualiza
    // (o crea) su registro en la tabla de campeones de esta competición.
    let mensajeCampeon = "";
    if (golesLocal > golesVisitante) {
      await actualizarCampeon(localId, anio);
      mensajeCampeon = ` Campeón registrado: ${local?.nombre}.`;
    } else if (golesVisitante > golesLocal) {
      await actualizarCampeon(visitanteId, anio);
      mensajeCampeon = ` Campeón registrado: ${visitante?.nombre}.`;
    } else if (huboPenales && penalesLocal > penalesVisitante) {
      await actualizarCampeon(localId, anio);
      mensajeCampeon = ` Campeón registrado (por penales): ${local?.nombre}.`;
    } else if (huboPenales && penalesVisitante > penalesLocal) {
      await actualizarCampeon(visitanteId, anio);
      mensajeCampeon = ` Campeón registrado (por penales): ${visitante?.nombre}.`;
    } else {
      mensajeCampeon = " Fue empate: no se asignó campeón automáticamente (agrégalo a mano en «Campeones» si corresponde).";
    }

    setCargando(false);
    setMensaje("Final agregada al historial." + mensajeCampeon);
    setHuboPenales(false);
    setPenalesLocal(0);
    setPenalesVisitante(0);
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
          <label className="block text-sm font-medium mb-1">
            Foto (opcional) — un resultado o una tabla con varias finales
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setFoto(e.target.files?.[0] ?? null);
              setMensajeIA(null);
            }}
            className="w-full text-sm"
          />
          <button
            type="button"
            onClick={leerConIA}
            disabled={!foto || leyendoIA}
            className="mt-2 w-full border-2 border-campo text-campo font-semibold py-2 rounded hover:bg-campo hover:text-crema transition disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-campo"
          >
            {leyendoIA ? "Leyendo imagen…" : "🪄 Leer con IA y autocompletar"}
          </button>
          <p className="text-xs text-tinta/40 mt-1">
            Si detecta una sola final, precarga el formulario de abajo. Si
            detecta varias (como una tabla con el historial de temporadas),
            arma una lista para revisar y guardarlas todas juntas.
          </p>
          {mensajeIA && (
            <p className="text-xs mt-1 bg-crema border border-tinta/10 rounded p-2">{mensajeIA}</p>
          )}
        </div>

        {!lote && (
          <>
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

            {golesLocal === golesVisitante && (
              <div className="border border-tinta/10 rounded p-3 bg-crema/60">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={huboPenales}
                    onChange={(e) => setHuboPenales(e.target.checked)}
                  />
                  Se definió por penales
                </label>
                {huboPenales && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Penales local</label>
                      <input
                        type="number"
                        min={0}
                        value={penalesLocal}
                        onChange={(e) => setPenalesLocal(Number(e.target.value))}
                        className="w-full border border-tinta/20 rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Penales visitante</label>
                      <input
                        type="number"
                        min={0}
                        value={penalesVisitante}
                        onChange={(e) => setPenalesVisitante(Number(e.target.value))}
                        className="w-full border border-tinta/20 rounded px-3 py-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {clubLocal && clubVisitante && (
              <p className="text-center bg-campo text-crema rounded p-3 font-display text-lg break-words">
                {clubLocal.nombre} ({clubLocal.pais}){" "}
                <Marcador
                  golesLocal={golesLocal}
                  golesVisitante={golesVisitante}
                  penalesLocal={huboPenales ? penalesLocal : null}
                  penalesVisitante={huboPenales ? penalesVisitante : null}
                />{" "}
                ({clubVisitante.pais}) {clubVisitante.nombre}
              </p>
            )}
          </>
        )}

        {lote && (
          <div className="border border-campo/40 rounded-lg p-3 space-y-3 bg-campo/5">
            <p className="text-sm font-medium">
              {lote.length} finales detectadas — revisa cada una antes de guardar.
            </p>
            <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
              {lote.map((f, i) => (
                <div key={f.clave} className="bg-white border border-tinta/10 rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={f.incluir}
                        onChange={(e) => actualizarFilaLote(f.clave, { incluir: e.target.checked })}
                      />
                      Final #{i + 1}
                    </label>
                    <button
                      type="button"
                      onClick={() => quitarFilaLote(f.clave)}
                      className="text-xs text-red-600 underline"
                    >
                      Quitar de la lista
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Año</label>
                    <input
                      type="number"
                      value={f.anio}
                      onChange={(e) => actualizarFilaLote(f.clave, { anio: Number(e.target.value) })}
                      className="w-full border border-tinta/20 rounded px-2 py-1.5 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <BuscadorClub
                        label="Local"
                        clubes={clubes}
                        value={f.localId}
                        onChange={(id) => actualizarFilaLote(f.clave, { localId: id })}
                        excluirId={f.visitanteId || undefined}
                      />
                      {!f.localId && f.localTexto && (
                        <p className="text-xs text-tinta/40 mt-1">IA leyó: “{f.localTexto}” (sin coincidencia)</p>
                      )}
                    </div>
                    <div>
                      <BuscadorClub
                        label="Visitante"
                        clubes={clubes}
                        value={f.visitanteId}
                        onChange={(id) => actualizarFilaLote(f.clave, { visitanteId: id })}
                        excluirId={f.localId || undefined}
                      />
                      {!f.visitanteId && f.visitanteTexto && (
                        <p className="text-xs text-tinta/40 mt-1">IA leyó: “{f.visitanteTexto}” (sin coincidencia)</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Goles local</label>
                      <input
                        type="number"
                        min={0}
                        value={f.golesLocal}
                        onChange={(e) => actualizarFilaLote(f.clave, { golesLocal: Number(e.target.value) })}
                        className="w-full border border-tinta/20 rounded px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Goles visitante</label>
                      <input
                        type="number"
                        min={0}
                        value={f.golesVisitante}
                        onChange={(e) => actualizarFilaLote(f.clave, { golesVisitante: Number(e.target.value) })}
                        className="w-full border border-tinta/20 rounded px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>

                  {f.golesLocal === f.golesVisitante && (
                    <div className="border border-tinta/10 rounded p-2 bg-crema/60">
                      <label className="flex items-center gap-2 text-xs font-medium">
                        <input
                          type="checkbox"
                          checked={f.penalesLocal !== null && f.penalesVisitante !== null}
                          onChange={(e) =>
                            actualizarFilaLote(f.clave, {
                              penalesLocal: e.target.checked ? 0 : null,
                              penalesVisitante: e.target.checked ? 0 : null,
                            })
                          }
                        />
                        Se definió por penales
                      </label>
                      {f.penalesLocal !== null && f.penalesVisitante !== null && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <input
                            type="number"
                            min={0}
                            value={f.penalesLocal}
                            onChange={(e) => actualizarFilaLote(f.clave, { penalesLocal: Number(e.target.value) })}
                            placeholder="Penales local"
                            className="w-full border border-tinta/20 rounded px-2 py-1.5 text-sm"
                          />
                          <input
                            type="number"
                            min={0}
                            value={f.penalesVisitante}
                            onChange={(e) =>
                              actualizarFilaLote(f.clave, { penalesVisitante: Number(e.target.value) })
                            }
                            placeholder="Penales visitante"
                            className="w-full border border-tinta/20 rounded px-2 py-1.5 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {resumenLote && (
              <p className="text-sm bg-white border border-tinta/10 rounded p-2">{resumenLote}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={guardarLote}
                disabled={guardandoLote}
                className="flex-1 bg-campo text-crema font-semibold py-2.5 rounded hover:bg-campo2 transition disabled:opacity-60"
              >
                {guardandoLote ? "Guardando…" : `Guardar ${lote.filter((f) => f.incluir).length} finales`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLote(null);
                  setResumenLote(null);
                }}
                className="border border-tinta/20 rounded px-4 text-sm hover:bg-crema"
              >
                Cancelar lista
              </button>
            </div>
          </div>
        )}

        {mensaje && <p className="text-sm bg-crema border border-tinta/10 rounded p-2">{mensaje}</p>}

        {!lote && (
          <button
            disabled={cargando}
            className="w-full bg-campo text-crema font-semibold py-2.5 rounded hover:bg-campo2 transition disabled:opacity-60"
          >
            {cargando ? "Guardando…" : "Guardar final"}
          </button>
        )}
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
                    <Marcador
                      golesLocal={f.goles_local}
                      golesVisitante={f.goles_visitante}
                      penalesLocal={f.penales_local}
                      penalesVisitante={f.penales_visitante}
                    />
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
