import Marcador from "./Marcador";

type Fila = {
  anio: number;
  local: string;
  visitante: string;
  goles_local: number;
  goles_visitante: number;
  penales_local?: number | null;
  penales_visitante?: number | null;
  pais_local?: string | null;
  pais_visitante?: string | null;
  conf_local?: string | null;
  conf_visitante?: string | null;
};

export default function HistorialFinales({
  filas,
  localSiempreCampeon = false,
}: {
  filas: Fila[];
  // Algunas fuentes de datos (ej. Mundial de Clubes) siempre listan al
  // campeón como "local", incluso en empates decididos por penales
  // (donde comparar el marcador no alcanza para saber quién ganó).
  localSiempreCampeon?: boolean;
}) {
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
          const huboPenales = f.penales_local != null && f.penales_visitante != null;
          const ganaLocal =
            localSiempreCampeon ||
            f.goles_local > f.goles_visitante ||
            (huboPenales && f.goles_local === f.goles_visitante && f.penales_local! > f.penales_visitante!);
          const ganaVisitante =
            !localSiempreCampeon &&
            (f.goles_visitante > f.goles_local ||
              (huboPenales && f.goles_local === f.goles_visitante && f.penales_visitante! > f.penales_local!));
          const campeon = ganaLocal ? f.local : ganaVisitante ? f.visitante : null;
          const paisCampeon = ganaLocal
            ? f.pais_local ?? f.conf_local
            : ganaVisitante
            ? f.pais_visitante ?? f.conf_visitante
            : null;
          return (
            <li key={i} className="px-4 py-3 bg-white">
              <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-between">
                <span className="font-display text-xl text-tinta/40 w-14 shrink-0">
                  {f.anio}
                </span>
                <span className={`text-right ${ganaLocal ? "font-semibold" : ""}`}>
                  {f.local}
                  {f.pais_local || f.conf_local ? (
                    <span className="text-tinta/40 text-xs"> ({f.pais_local ?? f.conf_local})</span>
                  ) : null}
                </span>
                <span className="font-display text-lg bg-campo text-crema px-2 py-0.5 rounded shrink-0">
                  <Marcador
                    golesLocal={f.goles_local}
                    golesVisitante={f.goles_visitante}
                    penalesLocal={f.penales_local}
                    penalesVisitante={f.penales_visitante}
                  />
                </span>
                <span className={ganaVisitante ? "font-semibold" : ""}>
                  {f.visitante}
                  {f.pais_visitante || f.conf_visitante ? (
                    <span className="text-tinta/40 text-xs"> ({f.pais_visitante ?? f.conf_visitante})</span>
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
