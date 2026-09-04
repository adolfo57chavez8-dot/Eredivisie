import Link from "next/link";
import { COMPETICIONES } from "@/lib/competiciones";

const ACCIONES = [
  { href: "/admin/clubes", titulo: "Agregar club", desc: "Registra un nuevo club y su país." },
  { href: "/admin/resultados", titulo: "Cargar resultado", desc: "Ingresa un resultado manualmente; el ranking se recalcula solo." },
  { href: "/admin/ranking", titulo: "Ranking (1 año)", desc: "Carga la posición de hace 1 año para activar el indicador ▲/▼." },
  { href: "/admin/campeones", titulo: "Registrar campeón", desc: "Suma un título a un club en una competición." },
  { href: "/admin/finales", titulo: "Agregar final histórica", desc: "Carga finales pasadas al historial." },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Resumen</h1>
      <p className="text-tinta/60 mb-6">
        Elige qué información quieres gestionar. Los cambios se reflejan de
        inmediato en la web pública.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {ACCIONES.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="border border-tinta/10 rounded-lg p-4 hover:border-acento hover:shadow transition bg-white"
          >
            <h3 className="font-semibold mb-1">{a.titulo}</h3>
            <p className="text-sm text-tinta/60">{a.desc}</p>
          </Link>
        ))}
      </div>

      <h2 className="font-display text-2xl mb-3 stitch pb-2">Competiciones disponibles</h2>
      <ul className="grid sm:grid-cols-2 gap-2 text-sm">
        {COMPETICIONES.map((c) => (
          <li key={c.slug} className="flex items-center gap-2 bg-white border border-tinta/10 rounded px-3 py-2">
            <span>{c.emoji}</span> {c.nombre}
          </li>
        ))}
      </ul>
    </div>
  );
}
