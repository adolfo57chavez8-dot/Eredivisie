type Fila = {
  fecha: string;
  fase: string;
  local: string;
  paisLocal: string;
  visitante: string;
  paisVisitante: string;
  golesLocal: number;
  golesVisitante: number;
};

const NOMBRE_FASE: Record<string, string> = {
  liga: "Fase de liga",
  eliminatoria: "Eliminatoria",
  final: "Final",
};

export default function HistorialPartidos({ filas }: { filas: Fila[] }) {
  if (filas.length === 0) {
    return (
      <p className="text-tinta/50 text-sm py-6">
        Todavía no hay partidos registrados en esta competición.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-tinta/10 rounded-lg">
      <table className="w-full text-sm border-collapse min-w-[560px]">
        <thead>
          <tr className="bg-tinta text-crema text-left">
            <th className="px-3 py-2">Fecha</th>
            <th className="px-3 py-2">Fase</th>
            <th className="px-3 py-2 text-right">Local</th>
            <th className="px-3 py-2 text-center">Resultado</th>
            <th className="px-3 py-2">Visitante</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i} className="odd:bg-white even:bg-crema border-b border-tinta/5">
              <td className="px-3 py-2 whitespace-nowrap text-tinta/60">{f.fecha}</td>
              <td className="px-3 py-2 whitespace-nowrap text-tinta/60">
                {NOMBRE_FASE[f.fase] ?? f.fase}
              </td>
              <td className="px-3 py-2 text-right font-medium">
                {f.local} <span className="text-tinta/40 text-xs">({f.paisLocal})</span>
              </td>
              <td className="px-3 py-2 text-center font-display text-base bg-campo/5 rounded">
                {f.golesLocal} - {f.golesVisitante}
              </td>
              <td className="px-3 py-2 font-medium">
                {f.visitante} <span className="text-tinta/40 text-xs">({f.paisVisitante})</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
