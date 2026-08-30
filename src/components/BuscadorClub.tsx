"use client";

import { useEffect, useRef, useState } from "react";

export type ClubOpcion = { id: string; nombre: string; pais: string };

export default function BuscadorClub({
  label,
  clubes,
  value,
  onChange,
  excluirId,
  disabled,
  deshabilitadoTexto,
}: {
  label: string;
  clubes: ClubOpcion[];
  value: string;
  onChange: (id: string) => void;
  excluirId?: string;
  disabled?: boolean;
  deshabilitadoTexto?: string;
}) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Mantiene el texto del input sincronizado con el club seleccionado
  // (por ejemplo, cuando se limpia la selección al cambiar de competición)
  useEffect(() => {
    if (!value) {
      setTexto("");
      return;
    }
    const club = clubes.find((c) => c.id === value);
    if (club) setTexto(`${club.nombre} (${club.pais})`);
  }, [value, clubes]);

  // Cierra el listado al hacer clic fuera del componente
  useEffect(() => {
    function manejarClicFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", manejarClicFuera);
    return () => document.removeEventListener("mousedown", manejarClicFuera);
  }, []);

  const resultados = clubes
    .filter((c) => c.id !== excluirId)
    .filter((c) => {
      const q = texto.trim().toLowerCase();
      if (!q) return true;
      return c.nombre.toLowerCase().includes(q) || c.pais.toLowerCase().includes(q);
    })
    .slice(0, 8);

  function elegir(club: ClubOpcion) {
    onChange(club.id);
    setTexto(`${club.nombre} (${club.pais})`);
    setAbierto(false);
  }

  return (
    <div ref={contenedorRef} className="relative">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type="text"
        disabled={disabled}
        value={texto}
        onFocus={() => setAbierto(true)}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
          if (value) onChange(""); // si escribe de nuevo, se invalida la selección previa
        }}
        placeholder={disabled ? deshabilitadoTexto ?? "No disponible" : "🔎 Buscar equipo…"}
        className="w-full border border-tinta/20 rounded px-3 py-2 disabled:bg-crema disabled:text-tinta/40"
      />
      {abierto && !disabled && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-tinta/15 rounded shadow-lg">
          {resultados.length === 0 ? (
            <p className="px-3 py-2 text-sm text-tinta/50">Sin coincidencias.</p>
          ) : (
            resultados.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => elegir(c)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-crema border-b border-tinta/5 last:border-0"
              >
                {c.nombre} <span className="text-tinta/50">({c.pais})</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
