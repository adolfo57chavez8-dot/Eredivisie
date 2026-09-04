/**
 * País (en español, mismas claves que PAISES_POR_CONFEDERACION en
 * helpers.ts) -> nombre de la liga doméstica de primera división de
 * ese país. Se usa solo para mostrar un nombre reconocible junto al
 * país en el ranking de ligas; no afecta el cálculo de puntos.
 */
export const NOMBRE_LIGA_POR_PAIS: Record<string, string> = {
  Alemania: "Bundesliga",
  Andorra: "Primera Divisió",
  Austria: "Bundesliga (Austria)",
  Azerbaiyán: "Premier League (Azerbaiyán)",
  Bulgaria: "Parva Liga",
  Bélgica: "Pro League",
  Chipre: "First Division (Chipre)",
  Croacia: "Prva HNL",
  Dinamarca: "Superliga (Dinamarca)",
  Escocia: "Premiership (Escocia)",
  Eslovaquia: "Niké Liga",
  Eslovenia: "PrvaLiga",
  España: "LaLiga",
  Francia: "Ligue 1",
  Grecia: "Super League Greece",
  Holanda: "Eredivisie",
  "Países Bajos": "Eredivisie",
  Hungría: "NB I",
  Inglaterra: "Premier League",
  Israel: "Ligat ha'Al",
  Italia: "Serie A",
  Kazajistán: "Premier League (Kazajistán)",
  Moldavia: "Super Liga (Moldavia)",
  Noruega: "Eliteserien",
  Polonia: "Ekstraklasa",
  Portugal: "Primeira Liga",
  "República Checa": "Chance Liga",
  Rumania: "Superliga (Rumania)",
  Rusia: "Premier League (Rusia)",
  Serbia: "SuperLiga (Serbia)",
  Suecia: "Allsvenskan",
  Suiza: "Super League (Suiza)",
  Turquía: "Süper Lig",
  Ucrania: "Premier League (Ucrania)",
};

/**
 * Devuelve el nombre de la liga doméstica para un país. Si el país no
 * está en el diccionario, devuelve el propio nombre del país en vez
 * de romper el render (por ejemplo, países fuera de UEFA que igual
 * hayan sumado puntos en el ranking global).
 */
export function nombreLiga(pais: string | null | undefined): string {
  const nombre = (pais ?? "").trim();
  if (!nombre) return "—";
  return NOMBRE_LIGA_POR_PAIS[nombre] ?? nombre;
}
