type Fila = {
  anio: number;
  local: string;
  visitante: string;
  goles_local: number;
  goles_visitante: number;
  pais_local?: string | null;
  pais_visitante?: string | null;
};

export default function HistorialFinales({ filas }: { filas: Fila[] }) {
  if (filas.length === 0) {
    return (
      <p className="text-tinta/50 text-sm py-6">
        Todavía no hay finales registradas para esta competición.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-tinta/10 border border-tinta/10 rounded-lg overflow-hidden">
      {filas
        .sort((a, b) => b.anio - a.anio)
        .map((f, i) => {
          const ganaLocal = f.goles_local > f.goles_visitante;
          const ganaVisitante = f.goles_visitante > f.goles_local;
          return (
            <li key={i} className="flex items-center gap-4 px-4 py-3 bg-white">
              <span className="font-display text-xl text-tinta/40 w-14 shrink-0">
                {f.anio}
              </span>
              <span className={`flex-1 text-right ${ganaLocal ? "font-semibold" : ""}`}>
                {f.local}
                {f.pais_local ? (
                  <span className="text-tinta/40 text-xs"> ({f.pais_local})</span>
                ) : null}
              </span>
              <span className="font-display text-lg bg-campo text-crema px-2 py-0.5 rounded">
                {f.goles_local} - {f.goles_visitante}
              </span>
              <span className={`flex-1 ${ganaVisitante ? "font-semibold" : ""}`}>
                {f.visitante}
                {f.pais_visitante ? (
                  <span className="text-tinta/40 text-xs"> ({f.pais_visitante})</span>
                ) : null}
              </span>
            </li>
          );
        })}
    </ul>
  );
}
