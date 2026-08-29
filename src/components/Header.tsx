"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Header() {
  const supabase = createClient();
  const router = useRouter();
  const [correo, setCorreo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCorreo(data.user?.email ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCorreo(session?.user?.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="bg-campo text-crema sticky top-0 z-40 border-b-4 border-acento">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">⚽</span>
          <span className="font-display text-2xl leading-none">
            Fútbol Holanda &amp; Europa
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm">
          <Link href="/" className="hover:text-acento transition-colors">
            Inicio
          </Link>
          <Link href="/admin" className="hover:text-acento transition-colors">
            Administración
          </Link>
        </nav>

        <div className="flex items-center gap-3 text-sm shrink-0">
          {correo ? (
            <>
              <span className="hidden sm:inline text-crema/70">{correo}</span>
              <button
                onClick={cerrarSesion}
                className="bg-acento text-tinta font-semibold px-3 py-1.5 rounded hover:brightness-95 transition"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 rounded border border-crema/30 hover:border-acento transition"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="bg-acento text-tinta font-semibold px-3 py-1.5 rounded hover:brightness-95 transition"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
