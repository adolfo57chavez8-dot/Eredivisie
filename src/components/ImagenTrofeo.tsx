"use client";

import { useState } from "react";

const EXTENSIONES = ["png", "jpg", "jpeg", "webp", "svg"];

/**
 * Muestra la imagen real del trofeo desde /public/trofeos/<slug>.<ext>.
 * Se comprueba en el NAVEGADOR (no en el servidor) porque en Vercel el
 * servidor (función serverless) no siempre tiene acceso al sistema de
 * archivos de /public para comprobaciones dinámicas — el navegador, en
 * cambio, siempre puede pedir ese archivo porque se sirve como estático.
 * Si ninguna extensión existe, muestra un aviso en vez de un emoji o
 * trofeo genérico.
 */
export default function ImagenTrofeo({ slug, alt }: { slug: string; alt: string }) {
  const [indice, setIndice] = useState(0);
  const [fallo, setFallo] = useState(false);

  if (fallo) {
    return (
      <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded border border-crema/20 flex items-center justify-center text-center text-[10px] text-crema/40 px-1">
        Falta imagen del trofeo
      </div>
    );
  }

  return (
    <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/trofeos/${slug}.${EXTENSIONES[indice]}`}
        alt={alt}
        className="w-full h-full object-contain"
        onError={() => {
          if (indice < EXTENSIONES.length - 1) {
            setIndice(indice + 1);
          } else {
            setFallo(true);
          }
        }}
      />
    </div>
  );
}
