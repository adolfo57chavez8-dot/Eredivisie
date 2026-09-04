import Link from "next/link";
import { COMPETICIONES } from "@/lib/competiciones";
import ImagenLogo from "@/components/ImagenLogo";

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
              className={`rounded-lg p-5 flex flex-col items-center text-center gap-2 hover:shadow-md hover:opacity-90 transition ${c.colorFondo} ${c.colorTexto}`}
            >
              <ImagenLogo
                carpeta="logos-competiciones"
                slug={c.slug}
                alt={c.nombre}
                className="h-14 w-14 object-contain"
                respaldo={<span className="text-3xl">{c.emoji}</span>}
              />
              <span className="font-semibold leading-tight">{c.nombre}</span>
              <span className="text-xs opacity-70">{c.descripcion}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-14">
        <h2 className="font-display text-3xl mb-2 stitch pb-2">Rankings globales</h2>
        <p className="text-tinta/60 text-sm mb-6">
          Estos rankings suman los puntos de varias competiciones en conjunto.
        </p>
        <div className="flex flex-col gap-4">
          <Link
            href="/ranking/uefa-global"
            className="bg-tinta text-crema rounded-lg p-5 hover:opacity-90 transition flex items-center gap-4"
          >
            <ImagenLogo
              carpeta="logos-rankings"
              slug="uefa"
              alt="UEFA"
              className="h-14 w-14 object-contain shrink-0 bg-white rounded-full p-1.5"
              respaldo={
                <span className="h-14 w-14 shrink-0 rounded-full bg-white text-tinta font-display flex items-center justify-center text-xs">
                  UEFA
                </span>
              }
            />
            <div>
              <h3 className="font-display text-2xl">Ranking UEFA Global</h3>
              <p className="text-crema/70 text-sm mt-1">
                Champions League + Europa League + Conference League + Super Copa de Europa
              </p>
            </div>
          </Link>
          <Link
            href="/ranking/fifa-world"
            className="bg-campo text-crema rounded-lg p-5 hover:opacity-90 transition flex items-center gap-4"
          >
            <ImagenLogo
              carpeta="logos-rankings"
              slug="fifa"
              alt="FIFA"
              className="h-14 w-14 object-contain shrink-0 bg-white rounded-full p-1.5"
              respaldo={
                <span className="h-14 w-14 shrink-0 rounded-full bg-white text-campo font-display flex items-center justify-center text-xs">
                  FIFA
                </span>
              }
            />
            <div>
              <h3 className="font-display text-2xl">Ranking FIFA World</h3>
              <p className="text-crema/70 text-sm mt-1">Mundial de Clubes — todas las confederaciones</p>
            </div>
          </Link>
          <Link
            href="/ranking/ligas"
            className="bg-acento text-tinta rounded-lg p-5 hover:opacity-90 transition flex items-center gap-4"
          >
            <ImagenLogo
              carpeta="logos-rankings"
              slug="uefa"
              alt="UEFA"
              className="h-14 w-14 object-contain shrink-0 bg-white rounded-full p-1.5"
              respaldo={
                <span className="h-14 w-14 shrink-0 rounded-full bg-white text-acento font-display flex items-center justify-center text-xs">
                  UEFA
                </span>
              }
            />
            <div>
              <h3 className="font-display text-2xl">Ranking de Ligas</h3>
              <p className="text-tinta/70 text-sm mt-1">
                Suma de puntos por país dentro del Ranking UEFA Global
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
