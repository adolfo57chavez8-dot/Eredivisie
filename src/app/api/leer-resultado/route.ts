import { NextRequest, NextResponse } from "next/server";

// Esta ruta corre en el servidor (nunca en el navegador), así que la
// API key de Gemini nunca queda expuesta al público. Recibe una foto
// de un resultado + la lista de clubes válidos para esa competición,
// y le pide a Gemini que identifique equipos y marcador.

export const runtime = "nodejs";

type ClubParaIA = { id: string; nombre: string };

type RespuestaIA = {
  local_id: string | null;
  visitante_id: string | null;
  goles_local: number | null;
  goles_visitante: number | null;
  confianza: "alta" | "media" | "baja" | null;
};

// Modelo de Gemini a usar. Se puede cambiar sin tocar código si Google
// renombra sus modelos: solo hay que agregar GEMINI_MODEL en las
// variables de entorno con el nombre nuevo.
const MODELO = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const TAMANO_MAXIMO_MB = 8;

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
      // Sin lista de clubes válida: seguimos, pero Gemini no va a poder
      // devolver ningún id (más abajo se descarta todo lo que no matchee).
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

  const prompt = `Estás leyendo una captura de un resultado de fútbol (puede ser de un videojuego tipo FIFA/PES o un marcador real).
Identifica el equipo local, el equipo visitante y el marcador final.

Elige "local_id" y "visitante_id" ÚNICAMENTE de esta lista de clubes válidos (copia el id EXACTO tal cual aparece, nunca inventes uno nuevo ni uses el nombre):
${listaClubes}

Si el equipo que ves en la imagen no coincide con confianza razonable con ninguno de la lista de arriba, deja ese campo en null en vez de adivinar.

Responde SOLO con un JSON, sin texto adicional, con este formato exacto:
{"local_id": string|null, "visitante_id": string|null, "goles_local": number|null, "goles_visitante": number|null, "confianza": "alta"|"media"|"baja"}`;

  const cuerpo = {
    contents: [
      {
        parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }],
      },
    ],
    generationConfig: {
      response_mime_type: "application/json",
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
            "Se alcanzó el límite gratuito de Gemini por ahora. Espera un poco o carga el resultado a mano.",
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

  let resultado: RespuestaIA;
  try {
    resultado = JSON.parse(texto);
  } catch {
    return NextResponse.json({ error: "Gemini devolvió un formato inesperado." }, { status: 502 });
  }

  // Verificación defensiva: solo aceptamos IDs que de verdad estén en la
  // lista de clubes que mandamos. Así nunca se puede guardar un club
  // inventado, aunque Gemini se equivoque o alucine un id.
  const idsValidos = new Set(clubes.map((c) => c.id));
  const localId =
    resultado.local_id && idsValidos.has(resultado.local_id) ? resultado.local_id : null;
  const visitanteId =
    resultado.visitante_id && idsValidos.has(resultado.visitante_id)
      ? resultado.visitante_id
      : null;

  return NextResponse.json({
    local_id: localId,
    visitante_id: visitanteId,
    goles_local: typeof resultado.goles_local === "number" ? resultado.goles_local : null,
    goles_visitante:
      typeof resultado.goles_visitante === "number" ? resultado.goles_visitante : null,
    confianza: resultado.confianza ?? null,
  });
}
