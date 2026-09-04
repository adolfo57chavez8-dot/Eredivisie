import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/admin");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-campo hover:text-campo2 font-medium mb-4"
      >
        ← Volver a la página principal
      </Link>
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-56 shrink-0">
          <h2 className="font-display text-2xl mb-4">Panel de administración</h2>
          <nav className="flex md:flex-col gap-2 text-sm flex-wrap">
            <Link className="px-3 py-2 rounded hover:bg-campo hover:text-crema transition" href="/admin">
              Resumen
            </Link>
            <Link className="px-3 py-2 rounded hover:bg-campo hover:text-crema transition" href="/admin/clubes">
              Clubes
            </Link>
            <Link className="px-3 py-2 rounded hover:bg-campo hover:text-crema transition" href="/admin/resultados">
              Cargar resultado
            </Link>
            <Link className="px-3 py-2 rounded hover:bg-campo hover:text-crema transition" href="/admin/ranking">
              Ranking (1 año)
            </Link>
            <Link className="px-3 py-2 rounded hover:bg-campo hover:text-crema transition" href="/admin/campeones">
              Campeones
            </Link>
            <Link className="px-3 py-2 rounded hover:bg-campo hover:text-crema transition" href="/admin/finales">
              Finales
            </Link>
            <Link className="px-3 py-2 rounded hover:bg-campo hover:text-crema transition" href="/admin/historial">
              Historial / Papelera
            </Link>
          </nav>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
