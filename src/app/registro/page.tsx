"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const supabase = createClient();
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);

  async function manejarRegistro(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const { data, error: errorAuth } = await supabase.auth.signUp({
      email: correo,
      password: contrasena,
      options: { data: { nombre } },
    });

    if (errorAuth) {
      setError(errorAuth.message);
      setCargando(false);
      return;
    }

    if (data.user) {
      // Crea el registro correspondiente en la tabla "usuarios"
      await supabase.from("usuarios").insert({
        id: data.user.id,
        nombre,
        correo,
        rol: "usuario",
      });
    }

    setCargando(false);
    setExito(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <h1 className="font-display text-4xl mb-1">Crear cuenta</h1>
      <p className="text-tinta/60 mb-6">
        Regístrate para acceder al panel de administración.
      </p>

      {exito ? (
        <div className="bg-green-50 border border-green-300 text-green-800 rounded p-4">
          Cuenta creada. Redirigiendo a inicio de sesión…
        </div>
      ) : (
        <form onSubmit={manejarRegistro} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-tinta/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-acento"
            />
          </div>
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
              minLength={6}
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
            {cargando ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>
      )}
    </div>
  );
}
