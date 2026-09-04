"use client";

import { useState } from "react";
import type { ReactNode } from "react";

const EXTENSIONES = ["png", "jpg", "jpeg", "webp", "svg"];

/**
 * Muestra /public/<carpeta>/<slug>.<ext>, probando extensiones en orden
 * hasta encontrar una que exista. Se comprueba en el navegador (no en
 * el servidor) porque en Vercel el servidor no siempre tiene acceso al
 * sistema de archivos de /public para comprobaciones dinámicas — el
 * navegador, en cambio, siempre puede pedir el archivo porque se sirve
 * como estático (mismo patrón que ImagenTrofeo).
 *
 * Si ninguna extensión existe todavía, muestra "respaldo" (por ejemplo
 * el emoji que ya se usaba) en vez de romper el diseño.
 */
export default function ImagenLogo({
  carpeta,
  slug,
  alt,
  className,
  respaldo,
}: {
  carpeta: string;
  slug: string;
  alt: string;
  className?: string;
  respaldo?: ReactNode;
}) {
  const [indice, setIndice] = useState(0);
  const [fallo, setFallo] = useState(false);

  if (fallo) {
    return <>{respaldo ?? null}</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/${carpeta}/${slug}.${EXTENSIONES[indice]}`}
      alt={alt}
      className={className}
      onError={() => {
        if (indice < EXTENSIONES.length - 1) {
          setIndice(indice + 1);
        } else {
          setFallo(true);
        }
      }}
    />
  );
}
