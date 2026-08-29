"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function manejarLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const { error: errorAuth } = await supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
    });

    setCargando(false);

    if (errorAuth) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push(params.get("redirect") || "/admin");
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <h1 className="font-display text-4xl mb-1">Iniciar sesión</h1>
      <p className="text-tinta/60 mb-6">Accede al panel de administración.</p>

      <form onSubmit={manejarLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Correo electrónico</label>
          <input
            required
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className="w-full border border-tinta/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-acento"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            required
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className="w-full border border-tinta/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-acento"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
            {error}
          </p>
        )}

        <button
          disabled={cargando}
          className="w-full bg-campo text-crema font-semibold py-2.5 rounded hover:bg-campo2 transition disabled:opacity-60"
        >
          {cargando ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="text-sm text-tinta/60 mt-4">
        ¿No tienes cuenta?{" "}
        <a href="/registro" className="text-campo font-medium underline">
          Regístrate
        </a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
