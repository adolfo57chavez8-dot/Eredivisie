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

/**
 * País (en español) -> código ISO 3166-1 alfa-2, para dibujar la
 * bandera como emoji sin depender de logos ni imágenes externas.
 * Cubre los mismos países que PAISES_POR_CONFEDERACION.
 */
const PAIS_A_ISO: Record<string, string> = {
  Alemania: "DE", Andorra: "AD", Austria: "AT", Azerbaiyán: "AZ", Bulgaria: "BG",
  Bélgica: "BE", Chipre: "CY", Croacia: "HR", Dinamarca: "DK", Eslovaquia: "SK",
  Eslovenia: "SI", España: "ES", Francia: "FR", Grecia: "GR", Holanda: "NL",
  "Países Bajos": "NL", Hungría: "HU", Israel: "IL", Italia: "IT", Kazajistán: "KZ",
  Moldavia: "MD", Noruega: "NO", Polonia: "PL", Portugal: "PT", "República Checa": "CZ",
  Rumania: "RO", Rusia: "RU", Serbia: "RS", Suecia: "SE", Suiza: "CH",
  Turquía: "TR", Ucrania: "UA",
  Argentina: "AR", Bolivia: "BO", Brasil: "BR", Chile: "CL", Colombia: "CO",
  Ecuador: "EC", Paraguay: "PY", Perú: "PE", Uruguay: "UY", Venezuela: "VE",
  Canadá: "CA", "Costa Rica": "CR", "Estados Unidos": "US", Haití: "HT", Jamaica: "JM",
  México: "MX", Nicaragua: "NI", "República Dominicana": "DO", Honduras: "HN", Panamá: "PA",
  Angola: "AO", Botsuana: "BW", Camerún: "CM", "Costa de Marfil": "CI", Egipto: "EG",
  Ghana: "GH", Libia: "LY", Mali: "ML", Marruecos: "MA", Nigeria: "NG",
  "República del Congo": "CG", Sudáfrica: "ZA", Sudán: "SD", Tanzania: "TZ", Túnez: "TN",
  Uganda: "UG", Zambia: "ZM", Argelia: "DZ", Senegal: "SN",
  "Arabia Saudita": "SA", Australia: "AU", Bahréin: "BH", Bangladesh: "BD", China: "CN",
  "Corea del Sur": "KR", "Emiratos Árabes Unidos": "AE", "Hong Kong": "HK", India: "IN",
  Indonesia: "ID", Irak: "IQ", Irán: "IR", Japón: "JP", Jordania: "JO", Malasia: "MY",
  Qatar: "QA", Catar: "QA", Singapur: "SG", Tailandia: "TH", Uzbekistán: "UZ", Vietnam: "VN",
  "Nueva Zelanda": "NZ", Fiyi: "FJ", Tahití: "PF",
};

// Reino Unido no tiene una única bandera para sus selecciones nacionales:
// se usan las secuencias de emoji específicas de Inglaterra/Escocia/Gales.
const BANDERAS_ESPECIALES: Record<string, string> = {
  Inglaterra: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Escocia: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  Gales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
};

/**
 * Devuelve el emoji de la bandera de un país (en español). Si no se
 * reconoce el país, devuelve una bandera blanca genérica en vez de
 * romper el render.
 */
export function banderaPais(pais: string | null | undefined): string {
  const nombre = (pais ?? "").trim();
  if (!nombre) return "🏳️";
  if (BANDERAS_ESPECIALES[nombre]) return BANDERAS_ESPECIALES[nombre];

  const iso = PAIS_A_ISO[nombre];
  if (!iso) return "🏳️";

  return iso
    .toUpperCase()
    .split("")
    .map((letra) => String.fromCodePoint(127397 + letra.charCodeAt(0)))
    .join("");
}
