import { NextRequest, NextResponse } from "next/server";

// Esta ruta corre en el servidor (nunca en el navegador), así que la
// API key de Gemini nunca queda expuesta al público. Recibe una foto
// (que puede tener UN resultado o VARIOS juntos, como una jornada
// completa) + la lista de clubes válidos para esa competición, y le
// pide a Gemini que identifique todos los partidos que encuentre.

export const runtime = "nodejs";

type ClubParaIA = { id: string; nombre: string };

type FilaIA = {
  local_id: string | null;
  visitante_id: string | null;
  local_texto?: string | null;
  visitante_texto?: string | null;
  goles_local: number | null;
  goles_visitante: number | null;
  penales_local?: number | null;
  penales_visitante?: number | null;
  anio?: number | null;
  confianza: "alta" | "media" | "baja" | null;
};

// Modelo de Gemini a usar. Se puede cambiar sin tocar código si Google
// renombra sus modelos: solo hay que agregar GEMINI_MODEL en las
// variables de entorno con el nombre nuevo.
const MODELO = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const TAMANO_MAXIMO_MB = 8;
const MAXIMO_RESULTADOS = 40;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Falta configurar GEMINI_API_KEY en el servidor. Consulta el LEEME de esta actualización.",
      },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "No se pudo leer la imagen enviada." }, { status: 400 });
  }

  const imagen = form.get("imagen");
  const clubesJson = form.get("clubes");

  if (!(imagen instanceof File)) {
    return NextResponse.json({ error: "Falta la imagen." }, { status: 400 });
  }
  if (imagen.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `La imagen pesa demasiado (máximo ${TAMANO_MAXIMO_MB} MB).` },
      { status: 400 }
    );
  }

  let clubes: ClubParaIA[] = [];
  if (typeof clubesJson === "string") {
    try {
      const parseado = JSON.parse(clubesJson);
      if (Array.isArray(parseado)) {
        clubes = parseado
          .filter(
            (c): c is ClubParaIA =>
              !!c && typeof c.id === "string" && typeof c.nombre === "string"
          )
          .map((c) => ({ id: c.id, nombre: c.nombre }));
      }
    } catch {
      // Sin lista de clubes válida: se maneja abajo (se corta con error).
    }
  }

  if (clubes.length === 0) {
    return NextResponse.json(
      { error: "No hay clubes cargados para esta competición todavía." },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await imagen.arrayBuffer());
  const base64 = bytes.toString("base64");
  const mimeType = imagen.type || "image/jpeg";

  const listaClubes = clubes.map((c) => `- ${c.id}: ${c.nombre}`).join("\n");

  const prompt = `Estás leyendo una captura de resultados de fútbol (puede ser de un videojuego tipo FIFA/PES, un marcador real, o una TABLA con el historial de varias finales/temporadas). La imagen puede tener UN SOLO resultado o VARIOS juntos (una jornada completa, una tabla con muchos partidos o finales, etc.). Identifica TODOS los resultados que aparezcan en la imagen, uno por uno, sin saltarte ninguno.

Para cada resultado que encuentres, identifica el equipo local, el equipo visitante, el marcador final, y si la imagen muestra una temporada o año (por ejemplo una columna "Temporada" con "25/26", o un año como "2026"), el año correspondiente.

Si el partido se definió por penales tras un empate (a veces se ve como "(5-4 pen)", "pen.", o dos números chiquitos arriba del marcador), incluye "penales_local" y "penales_visitante" con esos números. Si NO hubo penales, deja esos dos campos en null — no los confundas con el marcador normal.

Para "local_id" y "visitante_id": elige ÚNICAMENTE de esta lista de clubes válidos (copia el id EXACTO tal cual aparece, nunca inventes uno nuevo ni uses el nombre en vez del id):
${listaClubes}

Si el equipo que ves no coincide con confianza razonable con ninguno de la lista de arriba, deja ese id en null (no inventes), pero de todas formas escribe en "local_texto"/"visitante_texto" el nombre o texto que sí lograste leer en la imagen, para que un humano lo pueda revisar y completar a mano.

Para "anio": si ves una temporada tipo "25/26", usa el año en que termina esa temporada (25/26 → 2026). Si ves un año simple, úsalo tal cual. Si no hay ninguna información de año o temporada visible, deja "anio" en null.

Devuelve el JSON con el array "resultados", uno por cada partido o final que encuentres en la imagen, en el mismo orden en que aparecen de arriba hacia abajo.`;

  const cuerpo = {
    contents: [
      {
        parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }],
      },
    ],
    generationConfig: {
      response_mime_type: "application/json",
      response_schema: {
        type: "OBJECT",
        properties: {
          resultados: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                local_id: { type: "STRING", nullable: true },
                visitante_id: { type: "STRING", nullable: true },
                local_texto: { type: "STRING", nullable: true },
                visitante_texto: { type: "STRING", nullable: true },
                goles_local: { type: "INTEGER", nullable: true },
                goles_visitante: { type: "INTEGER", nullable: true },
                penales_local: { type: "INTEGER", nullable: true },
                penales_visitante: { type: "INTEGER", nullable: true },
                anio: { type: "INTEGER", nullable: true },
                confianza: { type: "STRING", enum: ["alta", "media", "baja"], nullable: true },
              },
              required: ["goles_local", "goles_visitante"],
            },
          },
        },
        required: ["resultados"],
      },
    },
  };

  let respuestaGemini: Response;
  try {
    respuestaGemini = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      }
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudo contactar a Gemini. Intenta de nuevo." },
      { status: 502 }
    );
  }

  if (!respuestaGemini.ok) {
    const detalle = await respuestaGemini.text().catch(() => "");
    if (respuestaGemini.status === 429) {
      return NextResponse.json(
        {
          error:
            "Se alcanzó el límite gratuito de Gemini por ahora. Espera un poco o carga los resultados a mano.",
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: `Gemini respondió con error (${respuestaGemini.status}). ${detalle.slice(0, 200)}` },
      { status: 502 }
    );
  }

  const datos = await respuestaGemini.json();
  const texto: string | undefined = datos?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!texto) {
    return NextResponse.json({ error: "Gemini no devolvió una respuesta legible." }, { status: 502 });
  }

  let resultado: { resultados?: FilaIA[] };
  try {
    resultado = JSON.parse(texto);
  } catch {
    return NextResponse.json({ error: "Gemini devolvió un formato inesperado." }, { status: 502 });
  }

  const lista = Array.isArray(resultado.resultados) ? resultado.resultados : [];

  if (lista.length === 0) {
    return NextResponse.json(
      { error: "No se identificó ningún resultado en la imagen." },
      { status: 422 }
    );
  }

  // Verificación defensiva: solo aceptamos IDs que de verdad estén en la
  // lista de clubes que mandamos. Así nunca se puede guardar un club
  // inventado, aunque Gemini se equivoque o alucine un id.
  const idsValidos = new Set(clubes.map((c) => c.id));

  const resultados = lista.slice(0, MAXIMO_RESULTADOS).map((fila) => {
    const localId = fila.local_id && idsValidos.has(fila.local_id) ? fila.local_id : null;
    const visitanteId =
      fila.visitante_id && idsValidos.has(fila.visitante_id) ? fila.visitante_id : null;
    return {
      local_id: localId,
      visitante_id: visitanteId,
      local_texto: fila.local_texto ?? null,
      visitante_texto: fila.visitante_texto ?? null,
      goles_local: typeof fila.goles_local === "number" ? fila.goles_local : null,
      goles_visitante: typeof fila.goles_visitante === "number" ? fila.goles_visitante : null,
      penales_local: typeof fila.penales_local === "number" ? fila.penales_local : null,
      penales_visitante: typeof fila.penales_visitante === "number" ? fila.penales_visitante : null,
      anio: typeof fila.anio === "number" ? fila.anio : null,
      confianza: fila.confianza ?? null,
    };
  });

  return NextResponse.json({ resultados });
}
