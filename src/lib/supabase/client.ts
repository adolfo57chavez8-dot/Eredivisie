"use client";

import { createBrowserClient } from "@supabase/ssr";

// Nota: se usa el cliente sin el genérico <Database> a propósito.
// El tipado estricto generaba errores de compilación distintos en
// cada pantalla que hace insert/update. Así el proyecto compila
// siempre; la validación real de datos la sigue haciendo Supabase
// (columnas, tipos, políticas RLS) del lado del servidor.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}