"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { detectarConfederacionPorPais } from "@/lib/helpers";

type Club = {
  id: string;
  nombre: string;
  pais: string;
  confederacion: string | null;
  eliminado: boolean;
};

export default function ClubesAdminPage() {
  const supabase = createClient();
  const [clubes, setClubes] = useState<Club[]>([]);
  const [nombre, setNombre] = useState("");
  const [pais, setPais] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  async function cargarClubes() {
    const { data } = await supabase
      .from("clubes")
      .select("id, nombre, pais, confederacion, eliminado")
      .order("nombre");
    setClubes((data as Club[]) ?? []);
  }

  useEffect(() => {
    cargarClubes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function agregarClub(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);

    const nombreLimpio = nombre.trim();

    // Aviso de duplicado: compara sin importar mayúsculas/minúsculas
    const yaExiste = clubes.find(
      (c) => c.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase()
    );
    if (yaExiste) {
      setMensaje(
        yaExiste.eliminado
          ? `Ese club ya existe (está en la papelera: "${yaExiste.nombre}"). Puedes restaurarlo abajo en vez de crear uno nuevo.`
          : `Ese club ya existe: "${yaExiste.nombre}" (${yaExiste.pais}). No se creó uno nuevo para evitar duplicados.`
      );
      return;
    }

    setCargando(true);
    const { error } = await supabase.from("clubes").insert({
      nombre: nombreLimpio,
      pais: pais.trim(),
      confederacion: detectarConfederacionPorPais(pais),
    });
    setCargando(false);

    if (error) {
      setMensaje(`Error: ${error.message}`);
      return;
    }

    setNombre("");
    setPais("");
    setMensaje("Club agregado correctamente.");
    cargarClubes();
  }

  async function eliminarClub(id: string) {
    if (!confirm("¿Eliminar este club? Podrás restaurarlo después. No afecta a los resultados, finales o campeones ya registrados con él.")) {
      return;
    }
    setProcesandoId(id);
    setMensaje(null);
    const { error } = await supabase
      .from("clubes")
      .update({ eliminado: true, fecha_eliminacion: new Date().toISOString() })
      .eq("id", id);
    setProcesandoId(null);
    if (error) {
      setMensaje(`Error: ${error.message}`);
      return;
    }
    cargarClubes();
  }

  async function restaurarClub(id: string) {
    setProcesandoId(id);
    setMensaje(null);
    const { error } = await supabase
      .from("clubes")
      .update({ eliminado: false, fecha_eliminacion: null })
      .eq("id", id);
    setProcesandoId(null);
    if (error) {
      setMensaje(`Error: ${error.message}`);
      return;
    }
    cargarClubes();
  }

  const clubesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return clubes;
    return clubes.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.pais.toLowerCase().includes(q)
    );
  }, [clubes, busqueda]);

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Clubes</h1>
      <p className="text-tinta/60 mb-6">
        El país determina automáticamente la confederación (usada en el
        Mundial de Clubes).
      </p>

      <form onSubmit={agregarClub} className="flex flex-wrap gap-3 mb-6 bg-white border border-tinta/10 rounded-lg p-4">
        <input
          required
          placeholder="Nombre del club"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="border border-tinta/20 rounded px-3 py-2 flex-1 min-w-[180px]"
        />
        <input
          required
          placeholder="País"
          value={pais}
          onChange={(e) => setPais(e.target.value)}
          className="border border-tinta/20 rounded px-3 py-2 flex-1 min-w-[140px]"
        />
        <button
          disabled={cargando}
          className="bg-campo text-crema font-semibold px-4 py-2 rounded hover:bg-campo2 transition disabled:opacity-60"
        >
          Agregar club
        </button>
      </form>

      {mensaje && (
        <p className="text-sm bg-crema border border-tinta/10 rounded p-3 mb-4">{mensaje}</p>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="🔎 Buscar club por nombre o país…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full border border-tinta/20 rounded px-3 py-2"
        />
        <p className="text-xs text-tinta/40 mt-1">
          {clubesFiltrados.length} de {clubes.length} clubes
        </p>
      </div>

      <div className="overflow-x-auto border border-tinta/10 rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-tinta text-crema text-left">
              <th className="px-3 py-2">Club</th>
              <th className="px-3 py-2">País</th>
              <th className="px-3 py-2">Confederación</th>
              <th className="px-3 py-2 text-center">Estado</th>
              <th className="px-3 py-2 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {clubesFiltrados.map((c) => (
              <tr
                key={c.id}
                className={`border-b border-tinta/5 ${
                  c.eliminado ? "bg-red-50 text-tinta/40" : "odd:bg-white even:bg-crema"
                }`}
              >
                <td className="px-3 py-2 font-medium">{c.nombre}</td>
                <td className="px-3 py-2">{c.pais}</td>
                <td className="px-3 py-2 text-tinta/60">{c.confederacion ?? "—"}</td>
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
                      onClick={() => restaurarClub(c.id)}
                      disabled={procesandoId === c.id}
                      className="bg-campo text-crema text-xs font-semibold px-3 py-1.5 rounded hover:bg-campo2 transition disabled:opacity-60"
                    >
                      {procesandoId === c.id ? "…" : "Restaurar"}
                    </button>
                  ) : (
                    <button
                      onClick={() => eliminarClub(c.id)}
                      disabled={procesandoId === c.id}
                      className="bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-red-700 transition disabled:opacity-60"
                    >
                      {procesandoId === c.id ? "…" : "Eliminar"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {clubesFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-tinta/40">
                  Sin coincidencias para "{busqueda}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
