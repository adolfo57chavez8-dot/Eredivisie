"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { getFiltroClubes, getRondas, RondaOpcion } from "@/lib/competiciones";
import BuscadorClub, { ClubOpcion } from "@/components/BuscadorClub";

type CompeticionOpcion = { id: string; nombre: string; slug: string };

type FilaLote = {
  clave: string;
  localId: string;
  visitanteId: string;
  golesLocal: number;
  golesVisitante: number;
  incluir: boolean;
  localTexto: string | null;
  visitanteTexto: string | null;
};

export default function ResultadosAdminPage() {
  const supabase = createClient();
  const [competiciones, setCompeticiones] = useState<CompeticionOpcion[]>([]);
  const [clubes, setClubes] = useState<ClubOpcion[]>([]);
  const [cargandoClubes, setCargandoClubes] = useState(false);

  const [competicionId, setCompeticionId] = useState("");
  const [ronda, setRonda] = useState<string>("");
  const [fecha, setFecha] = useState("");
  const [localId, setLocalId] = useState("");
  const [visitanteId, setVisitanteId] = useState("");
  const [golesLocal, setGolesLocal] = useState(0);
  const [golesVisitante, setGolesVisitante] = useState(0);
  const [foto, setFoto] = useState<File | null>(null);

  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const [leyendoIA, setLeyendoIA] = useState(false);
  const [mensajeIA, setMensajeIA] = useState<string | null>(null);

  const [lote, setLote] = useState<FilaLote[] | null>(null);
  const [guardandoLote, setGuardandoLote] = useState(false);
  const [resumenLote, setResumenLote] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("competiciones")
      .select("id, nombre, slug")
      .order("nombre")
      .then(({ data }) => setCompeticiones(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const competicionSeleccionada = competiciones.find((c) => c.id === competicionId);
  const rondasDisponibles: RondaOpcion[] = getRondas(competicionSeleccionada?.slug);

  // Al cambiar de competición se vuelve a cargar la lista de clubes según
  // corresponda: Holanda / Europa (UEFA, incluye Holanda) / Mundial (todos)
  // y se resetea la ronda a la primera opción disponible para esa competición.
  useEffect(() => {
    if (!competicionId) {
      setClubes([]);
      setRonda("");
      return;
    }
    const filtro = getFiltroClubes(competicionSeleccionada?.slug);
    setRonda(getRondas(competicionSeleccionada?.slug)[0]?.value ?? "");

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

    if (!competicionId || !localId || !visitanteId || !fecha || !ronda) {
      setMensaje("Completa todos los campos obligatorios.");
      return;
    }
    if (localId === visitanteId) {
      setMensaje("El club local y el visitante no pueden ser el mismo.");
      return;
    }

    const rondaInfo = rondasDisponibles.find((r) => r.value === ronda);
    if (!rondaInfo) {
      setMensaje("Selecciona una ronda válida para esta competición.");
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

    // `fase` se sigue guardando (compatibilidad con el trigger del ranking)
    // derivada automáticamente de la ronda elegida. `ronda` guarda el
    // detalle específico (ej. "octavos_ida") para mostrarlo en el
    // historial de partidos.
    const { error } = await supabase.from("partidos").insert({
      competicion_id: competicionId,
      fase: rondaInfo.fase,
      ronda: rondaInfo.value,
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

  async function leerConIA() {
    if (!foto) {
      setMensajeIA("Primero elige una foto de evidencia abajo.");
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
      }> = datos.resultados ?? [];

      if (resultados.length === 0) {
        setMensajeIA("No se pudo identificar ningún resultado. Complétalo a mano.");
        return;
      }

      if (resultados.length === 1) {
        // Un solo resultado en la imagen: se precarga el formulario normal, como antes.
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

        if (identificados === 2) {
          setMensajeIA("Listo — revisa que esté todo bien antes de guardar.");
        } else if (identificados === 1) {
          setMensajeIA("Solo se identificó un equipo con confianza. Completa el otro a mano.");
        } else {
          setMensajeIA("No se pudo identificar ningún equipo con confianza. Complétalo a mano.");
        }
        return;
      }

      // Varios resultados en la misma imagen: se arma una lista para
      // revisar y guardarlos todos juntos (comparten Competición/Ronda/Fecha).
      const filas: FilaLote[] = resultados.map((r, i) => ({
        clave: `${Date.now()}-${i}`,
        localId: r.local_id ?? "",
        visitanteId: r.visitante_id ?? "",
        golesLocal: typeof r.goles_local === "number" ? r.goles_local : 0,
        golesVisitante: typeof r.goles_visitante === "number" ? r.goles_visitante : 0,
        incluir: Boolean(r.local_id && r.visitante_id),
        localTexto: r.local_texto ?? null,
        visitanteTexto: r.visitante_texto ?? null,
      }));

      setLote(filas);
      const completos = filas.filter((f) => f.incluir).length;
      setMensajeIA(
        `Se identificaron ${filas.length} resultados (${completos} listos, revisa el resto abajo antes de guardar).`
      );
    } catch {
      setMensajeIA("Error de conexión al leer la imagen. Intenta de nuevo.");
    } finally {
      setLeyendoIA(false);
    }
  }

  function actualizarFilaLote(clave: string, cambios: Partial<FilaLote>) {
    setLote((actual) => actual?.map((f) => (f.clave === clave ? { ...f, ...cambios } : f)) ?? null);
  }

  function quitarFilaLote(clave: string) {
    setLote((actual) => actual?.filter((f) => f.clave !== clave) ?? null);
  }

  async function guardarLote() {
    if (!lote) return;

    if (!competicionId || !fecha || !ronda) {
      setResumenLote("Completa Competición, Ronda y Fecha arriba (aplican a todos los resultados de la lista).");
      return;
    }
    const rondaInfo = rondasDisponibles.find((r) => r.value === ronda);
    if (!rondaInfo) {
      setResumenLote("Selecciona una ronda válida para esta competición.");
      return;
    }

    const filasAGuardar = lote.filter((f) => f.incluir);
    if (filasAGuardar.length === 0) {
      setResumenLote("No hay ningún resultado marcado para guardar.");
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
    }

    setGuardandoLote(true);
    setResumenLote(null);

    let guardados = 0;
    const clavesFallidas: string[] = [];

    for (const f of filasAGuardar) {
      const { error } = await supabase.from("partidos").insert({
        competicion_id: competicionId,
        fase: rondaInfo.fase,
        ronda: rondaInfo.value,
        fecha,
        local_id: f.localId,
        visitante_id: f.visitanteId,
        goles_local: f.golesLocal,
        goles_visitante: f.golesVisitante,
        imagen_evidencia: null,
      });
      if (error) clavesFallidas.push(f.clave);
      else guardados++;
    }

    setGuardandoLote(false);

    if (clavesFallidas.length === 0) {
      setResumenLote(`Se guardaron los ${guardados} resultados. El ranking se actualizó automáticamente.`);
      setLote(null);
      setFoto(null);
    } else {
      setResumenLote(
        `Se guardaron ${guardados} de ${filasAGuardar.length}. ${clavesFallidas.length} fallaron — quedan marcados abajo, revisa e intenta de nuevo.`
      );
      setLote((actual) => actual?.filter((f) => clavesFallidas.includes(f.clave) || !f.incluir) ?? null);
    }
  }

  const clubLocal = clubes.find((c) => c.id === localId);
  const clubVisitante = clubes.find((c) => c.id === visitanteId);
  const filtro = getFiltroClubes(competicionSeleccionada?.slug);

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Cargar resultado</h1>
      <p className="text-tinta/60 mb-6">
        Manualmente o subiendo una foto de evidencia. El ranking se recalcula
        automáticamente al guardar. ¿Cargaste un resultado por error? Puedes
        eliminarlo o restaurarlo desde{" "}
        <Link href="/admin/historial" className="text-campo font-medium underline hover:text-campo2">
          Historial / Papelera
        </Link>
        .
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
            <label className="block text-sm font-medium mb-1">Ronda</label>
            <select
              required
              value={ronda}
              onChange={(e) => setRonda(e.target.value)}
              disabled={!competicionId}
              className="w-full border border-tinta/20 rounded px-3 py-2 disabled:opacity-50"
            >
              {!competicionId && <option value="">Elige antes una competición</option>}
              {rondasDisponibles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-tinta/40 mt-1">
              Las opciones cambian según la competición elegida (ida/vuelta en
              las europeas, dieciseisavos en la Copa de Holanda, solo final en
              las Super Copas, etc.).
            </p>
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

        {!lote && (
          <>
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
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            Foto de evidencia (opcional)
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
            Usa Gemini para leer la foto. Si detecta un solo resultado,
            precarga el formulario de abajo. Si detecta varios (una
            jornada completa), arma una lista para revisar y guardarlos
            todos juntos. Revisa siempre los datos antes de guardar.
          </p>
          {mensajeIA && (
            <p className="text-xs mt-1 bg-crema border border-tinta/10 rounded p-2">{mensajeIA}</p>
          )}
        </div>

        {lote && (
          <div className="border border-campo/40 rounded-lg p-3 space-y-3 bg-campo/5">
            <p className="text-sm font-medium">
              {lote.length} resultados detectados — revisa cada uno antes de guardar.
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
                      Resultado #{i + 1}
                    </label>
                    <button
                      type="button"
                      onClick={() => quitarFilaLote(f.clave)}
                      className="text-xs text-red-600 underline"
                    >
                      Quitar de la lista
                    </button>
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
                {guardandoLote
                  ? "Guardando…"
                  : `Guardar ${lote.filter((f) => f.incluir).length} resultados`}
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
            {cargando ? "Guardando…" : "Guardar resultado"}
          </button>
        )}
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
