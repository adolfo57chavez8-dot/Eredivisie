"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { detectarConfederacionPorPais } from "@/lib/helpers";

type Club = { id: string; nombre: string; pais: string; confederacion: string | null };

export default function ClubesAdminPage() {
  const supabase = createClient();
  const [clubes, setClubes] = useState<Club[]>([]);
  const [nombre, setNombre] = useState("");
  const [pais, setPais] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function cargarClubes() {
    const { data } = await supabase
      .from("clubes")
      .select("id, nombre, pais, confederacion")
      .order("nombre");
    setClubes(data ?? []);
  }

  useEffect(() => {
    cargarClubes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function agregarClub(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);

    const { error } = await supabase.from("clubes").insert({
      nombre: nombre.trim(),
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

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Clubes</h1>
      <p className="text-tinta/60 mb-6">
        El país determina automáticamente la confederación (usada en el
        Mundial de Clubes).
      </p>

      <form onSubmit={agregarClub} className="flex flex-wrap gap-3 mb-8 bg-white border border-tinta/10 rounded-lg p-4">
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

      {mensaje && <p className="text-sm mb-4">{mensaje}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-tinta text-crema text-left">
              <th className="px-3 py-2">Club</th>
              <th className="px-3 py-2">País</th>
              <th className="px-3 py-2">Confederación</th>
            </tr>
          </thead>
          <tbody>
            {clubes.map((c) => (
              <tr key={c.id} className="odd:bg-white even:bg-crema border-b border-tinta/5">
                <td className="px-3 py-2 font-medium">{c.nombre}</td>
                <td className="px-3 py-2">{c.pais}</td>
                <td className="px-3 py-2 text-tinta/60">{c.confederacion ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
