import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Busca un club por nombre (sin distinguir mayúsculas). Si no existe, lo crea.
 * Devuelve el id del club.
 */
export async function obtenerOCrearClub(
  supabase: SupabaseClient,
  nombre: string,
  pais: string,
  confederacion?: string | null
): Promise<string> {
  const nombreLimpio = nombre.trim();

  const { data: existente } = await supabase
    .from("clubes")
    .select("id")
    .ilike("nombre", nombreLimpio)
    .maybeSingle();

  if (existente) return existente.id;

  const { data: nuevo, error } = await supabase
    .from("clubes")
    .insert({
      nombre: nombreLimpio,
      pais: pais.trim(),
      confederacion: confederacion ?? detectarConfederacionPorPais(pais),
    })
    .select("id")
    .single();

  if (error || !nuevo) {
    throw new Error(error?.message ?? "No se pudo crear el club");
  }

  return nuevo.id;
}

/**
 * Detección automática simplificada de la confederación a partir del país.
 * Se usa para el Mundial de Clubes. Ampliable con más países según se necesite.
 */
const PAISES_POR_CONFEDERACION: Record<string, string[]> = {
  UEFA: [
    "Holanda", "Países Bajos", "España", "Inglaterra", "Alemania", "Italia",
    "Francia", "Portugal", "Bélgica", "Escocia", "Turquía", "Rusia", "Ucrania",
  ],
  CONMEBOL: [
    "Brasil", "Argentina", "Uruguay", "Colombia", "Chile", "Paraguay",
    "Ecuador", "Perú", "Bolivia", "Venezuela",
  ],
  CONCACAF: [
    "México", "Estados Unidos", "Canadá", "Costa Rica", "Honduras",
    "Jamaica", "Panamá",
  ],
  CAF: [
    "Egipto", "Marruecos", "Túnez", "Argelia", "Nigeria", "Sudáfrica",
    "Senegal", "Ghana",
  ],
  AFC: [
    "Japón", "Corea del Sur", "Arabia Saudita", "Catar", "Irán", "Australia",
    "China", "Emiratos Árabes Unidos",
  ],
  OFC: ["Nueva Zelanda", "Fiyi", "Tahití"],
};

export function detectarConfederacionPorPais(pais: string): string {
  const paisNormalizado = pais.trim().toLowerCase();
  for (const [confederacion, paises] of Object.entries(PAISES_POR_CONFEDERACION)) {
    if (paises.some((p) => p.toLowerCase() === paisNormalizado)) {
      return confederacion;
    }
  }
  return "Sin definir";
}

/**
 * Calcula 3/1/0 (sistema de liga clásico) a partir de un resultado.
 * Se usa como valor inicial; el trigger de la base de datos recalcula
 * el ranking acumulado de cada club automáticamente.
 */
export function calcularPuntosPartido(golesLocal: number, golesVisitante: number) {
  if (golesLocal > golesVisitante) return { local: 3, visitante: 0 };
  if (golesLocal < golesVisitante) return { local: 0, visitante: 3 };
  return { local: 1, visitante: 1 };
}
