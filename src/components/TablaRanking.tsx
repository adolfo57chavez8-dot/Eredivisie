type Fila = {
  club: string;
  pais: string;
  puntos: number;
  partidos_jugados: number;
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-tinta text-crema text-left">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Club</th>
            <th className="px-3 py-2">País</th>
            <th className="px-3 py-2 text-center">PJ</th>
            <th className="px-3 py-2 text-center">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {filas
            .sort((a, b) => b.puntos - a.puntos)
            .map((f, i) => (
              <tr key={f.club} className="odd:bg-white even:bg-crema border-b border-tinta/5">
                <td className="px-3 py-2 text-tinta/50">{i + 1}</td>
                <td className="px-3 py-2 font-medium">{f.club}</td>
                <td className="px-3 py-2 text-tinta/70">{f.pais}</td>
                <td className="px-3 py-2 text-center">{f.partidos_jugados}</td>
                <td className="px-3 py-2 text-center font-semibold text-acento bg-tinta/90 text-white rounded">
                  {f.puntos}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
