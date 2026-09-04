import { banderaPais } from "@/lib/helpers";

type Fila = {
  club: string;
  pais: string;
  confederacion?: string | null;
  puntos: number;
  partidos_jugados: number;
  // Posición que ocupaba el club hace 1 año (cargada manualmente por el
  // administrador en /admin/ranking). Si es null/undefined todavía no
  // hay dato de comparación y se muestra como "Nuevo".
  posicion_anterior?: number | null;
};

export default function TablaRanking({ filas }: { filas: Fila[] }) {
  if (filas.length === 0) {
    return (
      <p className="text-tinta/50 text-sm py-6">
        Todavía no hay ranking calculado. Se genera automáticamente al cargar
        resultados.
      </p>
    );
  }

  const ordenadas = [...filas].sort((a, b) => b.puntos - a.puntos);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[640px]">
        <thead>
          <tr className="bg-tinta text-crema text-left">
            <th className="px-3 py-2">Rank</th>
            <th className="px-3 py-2">Club / País</th>
            <th className="px-3 py-2">Confederación</th>
            <th className="px-3 py-2 text-center">Puntos</th>
            <th className="px-3 py-2 text-center">Cambio 1 año</th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((f, i) => {
            const posicionActual = i + 1;
            const hayAnterior = typeof f.posicion_anterior === "number" && (f.posicion_anterior as number) > 0;
            const delta = hayAnterior ? (f.posicion_anterior as number) - posicionActual : null;

            return (
              <tr key={`${f.club}-${i}`} className="odd:bg-white even:bg-crema border-b border-tinta/5">
                <td className="px-3 py-2 text-tinta/50 font-semibold align-top">{posicionActual}</td>
                <td className="px-3 py-2 align-top">
                  <span className="mr-1.5">{banderaPais(f.pais)}</span>
                  <span className="font-medium">{f.club}</span>
                  <div className="text-xs text-tinta/50 pl-6">{f.pais}</div>
                </td>
                <td className="px-3 py-2 text-tinta/70 align-top">{f.confederacion ?? "—"}</td>
                <td className="px-3 py-2 text-center align-top">
                  <span className="font-semibold text-acento bg-tinta/90 text-white rounded px-2 py-1">
                    {f.puntos}
                  </span>
                </td>
                <td className="px-3 py-2 text-center align-top">
                  {!hayAnterior && <span className="text-tinta/40 text-xs">Nuevo</span>}
                  {hayAnterior && delta! > 0 && (
                    <div className="flex flex-col items-center leading-tight">
                      <span className="text-green-600 font-semibold">▲ {delta}</span>
                      <span className="text-[10px] text-tinta/40">{f.posicion_anterior}</span>
                    </div>
                  )}
                  {hayAnterior && delta! < 0 && (
                    <div className="flex flex-col items-center leading-tight">
                      <span className="text-red-600 font-semibold">▼ {Math.abs(delta as number)}</span>
                      <span className="text-[10px] text-tinta/40">{f.posicion_anterior}</span>
                    </div>
                  )}
                  {hayAnterior && delta === 0 && (
                    <div className="flex flex-col items-center leading-tight">
                      <span className="text-tinta/40 font-semibold">▬ 0</span>
                      <span className="text-[10px] text-tinta/40">{f.posicion_anterior}</span>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
