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
          const campeon = ganaLocal ? f.local : ganaVisitante ? f.visitante : null;
          const paisCampeon = ganaLocal ? f.pais_local : ganaVisitante ? f.pais_visitante : null;
          return (
            <li key={i} className="px-4 py-3 bg-white">
              <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-between">
                <span className="font-display text-xl text-tinta/40 w-14 shrink-0">
                  {f.anio}
                </span>
                <span className={`text-right ${ganaLocal ? "font-semibold" : ""}`}>
                  {f.local}
                  {f.pais_local ? (
                    <span className="text-tinta/40 text-xs"> ({f.pais_local})</span>
                  ) : null}
                </span>
                <span className="font-display text-lg bg-campo text-crema px-2 py-0.5 rounded shrink-0">
                  {f.goles_local} - {f.goles_visitante}
                </span>
                <span className={ganaVisitante ? "font-semibold" : ""}>
                  {f.visitante}
                  {f.pais_visitante ? (
                    <span className="text-tinta/40 text-xs"> ({f.pais_visitante})</span>
                  ) : null}
                </span>
              </div>
              {campeon && (
                <p className="text-xs text-tinta/50 text-center sm:text-left mt-1">
                  🏆 Campeón: {campeon}
                  {paisCampeon ? ` (${paisCampeon})` : ""}
                </p>
              )}
            </li>
          );
        })}
    </ul>
  );
}
