/**
 * Muestra un marcador tipo "1 - 1", y si hubo penales, los agrega
 * arriba en chiquito a cada lado: "²1 - 1⁰" (2 = penales del local,
 * 0 = penales del visitante). Si no hay penales, se ve igual que
 * siempre.
 */
export default function Marcador({
  golesLocal,
  golesVisitante,
  penalesLocal,
  penalesVisitante,
  className,
}: {
  golesLocal: number;
  golesVisitante: number;
  penalesLocal?: number | null;
  penalesVisitante?: number | null;
  className?: string;
}) {
  const hayPenales = penalesLocal != null && penalesVisitante != null;

  return (
    <span className={className}>
      {hayPenales && <sup className="text-[0.65em] font-normal opacity-70 mr-0.5">{penalesLocal}</sup>}
      {golesLocal} - {golesVisitante}
      {hayPenales && <sup className="text-[0.65em] font-normal opacity-70 ml-0.5">{penalesVisitante}</sup>}
    </span>
  );
}
