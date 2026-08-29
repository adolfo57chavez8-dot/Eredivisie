# Fútbol Holanda & Europa — Plataforma Web

Web construida con **Next.js 14** + **Supabase** (base de datos, autenticación y
almacenamiento de fotos) + **Tailwind CSS**, según el diagrama: Liga, Copa y
Super Copa de Holanda, Champions League, UEFA Europa League, Conference
League, Mundial de Clubes y Super Copa de Europa, con tabla de campeones,
ranking automático, historial de finales y de enfrentamientos.

## 1. Requisitos previos

- Tener instalado **Node.js** (versión 18 o superior) → https://nodejs.org
- Tener una cuenta gratuita en **Supabase** → https://supabase.com
- (Opcional pero recomendado) una cuenta en **GitHub** y otra en **Vercel** para publicar la web

## 2. Crear el proyecto en Supabase

1. Entra a https://supabase.com/dashboard y crea un **New project**.
2. Cuando esté listo, ve a **SQL Editor** (menú lateral).
3. Ejecuta, **en este orden**, cada uno de los 4 archivos `.sql` que te entregué
   por fuera del zip (copia y pega el contenido completo de cada archivo y
   dale a "Run"):
   1. `01_schema.sql` (crea las tablas)
   2. `02_rls_policies.sql` (activa la seguridad y crea el bucket de fotos)
   3. `03_triggers_ranking.sql` (cálculo automático de puntos)
   4. `04_seed_competiciones.sql` (crea las 8 competiciones)
4. Ve a **Project Settings > API** y copia:
   - `Project URL`
   - `anon public key`

## 3. Configurar el proyecto localmente

1. Descomprime el `.zip` que te entregué en una carpeta, por ejemplo `futbol-web`.
2. Abre una terminal dentro de esa carpeta.
3. Copia el archivo de ejemplo de variables de entorno:
   - Windows (PowerShell): `copy .env.local.example .env.local`
   - Mac/Linux: `cp .env.local.example .env.local`
4. Abre `.env.local` con un editor de texto y pega tus datos de Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-publica
   ```
5. Instala las dependencias:
   ```
   npm install
   ```
6. Levanta la web en modo desarrollo:
   ```
   npm run dev
   ```
7. Abre tu navegador en **http://localhost:3000** — la web ya debería
   funcionar: podrás registrarte, iniciar sesión, entrar al panel de
   administración y cargar clubes, resultados, campeones y finales.

## 4. Subir el código a GitHub

1. Crea una cuenta en https://github.com si no tienes una.
2. Crea un repositorio nuevo (botón **New repository**), sin marcar ninguna
   casilla de "README" ni ".gitignore" (ya vienen incluidos en el zip).
3. En la terminal, dentro de la carpeta del proyecto, ejecuta:
   ```
   git init
   git add .
   git commit -m "Primera versión de la plataforma de fútbol"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
   git push -u origin main
   ```
   (Reemplaza `TU-USUARIO` y `TU-REPOSITORIO` por los tuyos; GitHub te pedirá
   iniciar sesión la primera vez, o crear un "token" si te lo solicita en vez
   de la contraseña).

## 5. Publicar la web (Vercel)

1. Entra a https://vercel.com y crea una cuenta (puedes usar tu cuenta de GitHub).
2. Dale a **Add New > Project** y elige el repositorio que acabas de subir.
3. En **Environment Variables**, agrega las mismas dos variables de tu
   `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Dale a **Deploy** y espera unos minutos. Vercel te dará una URL pública
   (por ejemplo `https://futbol-web.vercel.app`) donde tu web ya estará
   funcionando en internet.

## 5.1. Actualizar en el futuro

Cada vez que hagas cambios en el código y quieras que se reflejen en la web
publicada, desde la terminal:
```
git add .
git commit -m "Descripción del cambio"
git push
```
Vercel vuelve a publicar automáticamente.

## 6. Cómo usar la web

- Cualquier visitante puede ver competiciones, campeones, rankings y finales
  sin necesidad de registrarse.
- Para **cargar o editar datos** hace falta crear una cuenta (`/registro`) e
  iniciar sesión (`/login`); luego se accede al **panel de administración**
  (`/admin`) desde el botón del menú superior.
- Desde el panel se puede: agregar clubes, cargar resultados (con o sin foto
  de evidencia), registrar campeones (se suma 1 título automáticamente si el
  club ya es campeón) y agregar finales históricas.
- El **ranking** (puntos y partidos jugados) y el **historial de
  enfrentamientos** entre dos clubes se calculan solos con cada resultado
  cargado — no hace falta tocarlos a mano.
- La **confederación** de un club (para el Mundial de Clubes) se detecta
  automáticamente según el país al crear el club (ver
  `src/lib/helpers.ts` si quieres ampliar la lista de países).

## 7. Estructura del proyecto

```
src/
  app/
    page.tsx                 → Página de inicio
    registro/                → Registro de usuario
    login/                   → Inicio de sesión
    competicion/[slug]/      → Página pública de cada competición
    admin/                   → Panel de administración (protegido)
  components/                → Header, Footer, tablas, historial de finales
  lib/
    supabase/                → Clientes de Supabase (navegador y servidor)
    competiciones.ts         → Lista de las 8 competiciones del diagrama
    helpers.ts                → Crear/buscar clubes, detección de confederación
```

## 8. Alcance de esta primera versión

Esta entrega cubre el flujo completo de extremo a extremo (registro → login →
panel de administración → carga de resultados → ranking y tabla de campeones
automáticos → visualización pública) para las 8 competiciones del diagrama,
usando un modelo de datos genérico que sirve para todas ellas. Cosas que
puedes pedirme que agreguemos después si las necesitas:
- Roles de administrador más estrictos (solo cuentas marcadas como `admin`
  pueden escribir — ya dejé la política SQL comentada y lista para activar).
- Subida de resultados por foto con reconocimiento automático del marcador
  (por ahora la foto se guarda como evidencia, pero el marcador se ingresa
  a mano).
- Edición/borrado de resultados ya cargados desde el panel.
