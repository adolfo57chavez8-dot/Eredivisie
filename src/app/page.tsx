import Link from "next/link";
import { COMPETICIONES } from "@/lib/competiciones";

export default function HomePage() {
  return (
    <div>
      <section className="bg-campo text-crema">
        <div className="max-w-6xl mx-auto px-4 py-14 text-center">
          <h1 className="font-display text-5xl md:text-6xl">
            Historia, resultados y rankings
          </h1>
          <p className="mt-3 text-crema/80 max-w-2xl mx-auto">
            Una plataforma completa y actualizada del fútbol de Holanda y de las
            principales competiciones europeas: campeones, finales, enfrentamientos
            y rankings calculados automáticamente.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="font-display text-3xl mb-6 stitch pb-2">Competiciones</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {COMPETICIONES.map((c) => (
            <Link
              key={c.slug}
              href={`/competicion/${c.slug}`}
              className="bg-white border border-tinta/10 rounded-lg p-5 flex flex-col items-center text-center gap-2 hover:border-acento hover:shadow-md transition"
            >
              <span className="text-3xl">{c.emoji}</span>
              <span className="font-semibold leading-tight">{c.nombre}</span>
              <span className="text-xs text-tinta/60">{c.descripcion}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
