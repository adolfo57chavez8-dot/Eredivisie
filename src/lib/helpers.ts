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
 * Detección automática de la confederación a partir del país.
 * Cubre los 89 países presentes en las listas de clubes (Holanda,
 * Europa y resto del mundo) para el Mundial de Clubes y para cuando
 * se agrega un club nuevo a mano.
 */
const PAISES_POR_CONFEDERACION: Record<string, string[]> = {
  UEFA: ["Alemania", "Andorra", "Austria", "Azerbaiyán", "Bulgaria", "Bélgica", "Chipre", "Croacia", "Dinamarca", "Escocia", "Eslovaquia", "Eslovenia", "España", "Francia", "Grecia", "Holanda", "Países Bajos", "Hungría", "Inglaterra", "Israel", "Italia", "Kazajistán", "Moldavia", "Noruega", "Polonia", "Portugal", "República Checa", "Rumania", "Rusia", "Serbia", "Suecia", "Suiza", "Turquía", "Ucrania"],
  CONMEBOL: ["Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Ecuador", "Paraguay", "Perú", "Uruguay", "Venezuela"],
  CONCACAF: ["Canadá", "Costa Rica", "Estados Unidos", "Haití", "Jamaica", "México", "Nicaragua", "República Dominicana", "Honduras", "Panamá"],
  CAF: ["Angola", "Botsuana", "Camerún", "Costa de Marfil", "Egipto", "Ghana", "Libia", "Mali", "Marruecos", "Nigeria", "República del Congo", "Sudáfrica", "Sudán", "Tanzania", "Túnez", "Uganda", "Zambia", "Argelia", "Senegal"],
  AFC: ["Arabia Saudita", "Australia", "Bahréin", "Bangladesh", "China", "Corea del Sur", "Emiratos Árabes Unidos", "Hong Kong", "India", "Indonesia", "Irak", "Irán", "Japón", "Jordania", "Malasia", "Qatar", "Catar", "Singapur", "Tailandia", "Uzbekistán", "Vietnam"],
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
