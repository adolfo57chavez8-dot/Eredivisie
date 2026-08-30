import fs from "fs";
import path from "path";

const EXTENSIONES = ["png", "jpg", "jpeg", "webp", "svg"];

/**
 * Busca en /public/trofeos/<slug>.<ext> la imagen real del trofeo de una
 * competición. Solo funciona en el servidor (Server Components).
 * Devuelve la ruta pública (ej. "/trofeos/champions-league.png") si el
 * archivo existe, o null si todavía no se subió. No se usa ningún emoji
 * ni trofeo genérico como reemplazo: si no existe, simplemente no se
 * muestra imagen (ver el componente ImagenTrofeo).
 */
export function buscarImagenTrofeo(slug: string): string | null {
  for (const ext of EXTENSIONES) {
    const rutaArchivo = path.join(process.cwd(), "public", "trofeos", `${slug}.${ext}`);
    if (fs.existsSync(rutaArchivo)) {
      return `/trofeos/${slug}.${ext}`;
    }
  }
  return null;
}
