type Fila = {
  club: string;
  pais: string;
  titulos: number;
  primer_titulo: number | null;
  ultimo_titulo: number | null;
};

export default function TablaCampeones({ filas }: { filas: Fila[] }) {
  if (filas.length === 0) {
    return (
      <p className="text-tinta/50 text-sm py-6">
        Todavía no hay campeones registrados para esta competición.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-campo text-crema text-left">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Club</th>
            <th className="px-3 py-2">País</th>
            <th className="px-3 py-2 text-center">Títulos</th>
            <th className="px-3 py-2 text-center">Primero</th>
            <th className="px-3 py-2 text-center">Último</th>
          </tr>
        </thead>
        <tbody>
          {filas
            .sort((a, b) => b.titulos - a.titulos)
            .map((f, i) => (
              <tr key={f.club} className="odd:bg-white even:bg-crema border-b border-tinta/5">
                <td className="px-3 py-2 text-tinta/50">{i + 1}</td>
                <td className="px-3 py-2 font-medium">{f.club}</td>
                <td className="px-3 py-2 text-tinta/70">{f.pais}</td>
                <td className="px-3 py-2 text-center font-semibold text-campo">
                  {f.titulos}
                </td>
                <td className="px-3 py-2 text-center text-tinta/60">
                  {f.primer_titulo ?? "—"}
                </td>
                <td className="px-3 py-2 text-center text-tinta/60">
                  {f.ultimo_titulo ?? "—"}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
