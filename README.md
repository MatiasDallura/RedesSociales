# Social Prospecting AI

App web privada para descubrir, organizar y priorizar perfiles potenciales de LinkedIn, Facebook e Instagram. Está diseñada como herramienta de asistencia manual: no hace auto-follow, no contacta automáticamente, no scrapea agresivamente y no intenta evadir límites ni captchas.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres
- OpenAI API o proveedor compatible
- Preparada para Vercel

## Funcionalidades

- Login privado sin registro público.
- Business Profile / ICP para definir oferta, cliente ideal, señales buenas y señales malas.
- Dashboard con campañas, perfiles encontrados, guardados, revisados y seguidos manualmente.
- Cuentas sociales propias para referencia.
- Campañas por plataforma, nicho, ubicación, keywords, hashtags y límite diario recomendado.
- Resultados con datos mock, carga manual, CSV y estructura preparada para futuras APIs oficiales.
- Discovery de candidatos reales mediante API de búsqueda web y URLs públicas indexadas.
- Análisis IA de bio/descripción con score, explicación, sugerencia de acercamiento y categoría usando campaña + ICP.
- CRM de leads con filtros por plataforma, estado, nicho, campaña, score y ubicación.
- Detalle de lead con notas y acciones manuales.
- Sección Safety & Compliance con límites diarios, historial y alertas.
- Diagnóstico privado para validar variables, Supabase, schema, auth y SearXNG.

## Instalación local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

Si no configuras Supabase, la app funciona en modo demo con datos mock. En modo demo los cambios no persisten.

## Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_ALLOWED_EMAIL=
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-4o-mini
SEARXNG_BASE_URL=
```

`NEXT_PUBLIC_ALLOWED_EMAIL` es opcional, pero recomendado para restringir el login a tu email.

`OPENAI_BASE_URL` es opcional y permite usar proveedores compatibles con la API de OpenAI.

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. Ve a SQL Editor.
3. Ejecuta el contenido de `supabase/schema.sql`. El archivo es re-ejecutable si luego agregas nuevas tablas.
4. En Authentication, crea manualmente tu usuario con email y contraseña.
5. Copia `Project URL` y `anon public key` a `.env.local`.
6. Configura `NEXT_PUBLIC_ALLOWED_EMAIL` con el email creado.

El esquema activa Row Level Security en todas las tablas y cada fila queda asociada a `auth.uid()`.

## Business Profile / ICP

Completa la página `Business ICP` antes de buscar leads. La app usa este perfil para mejorar el ranking:

- qué vendes
- a quién ayudas
- cliente ideal
- países o ciudades objetivo
- industrias objetivo
- señales de buen lead
- señales de mal lead
- ticket aproximado
- objetivo y tono de contacto

El ICP se combina con cada campaña para evitar que la IA puntúe solo por keywords superficiales.

## Configurar IA

La ruta `app/api/analyze-lead/route.ts` usa `OPENAI_API_KEY` si existe. Si no hay clave o la llamada falla, aplica scoring local seguro basado en coincidencias de campaña.

El prompt indica explícitamente que no debe recomendar automatización, scraping, resolución de captchas, evasión ni acciones masivas.

## Importar CSV

Columnas esperadas:

```csv
name,url,bio,location,platform,niche
```

La importación limita la vista previa a 100 filas por carga. Los duplicados se evitan con la restricción única `(user_id, url)`.

## Discovery real de perfiles

La página `Discovery` puede encontrar candidatos reales usando una instancia SearXNG configurada con `SEARXNG_BASE_URL`. La app genera queries con `site:linkedin.com`, `site:facebook.com` o `site:instagram.com`, filtra URLs públicas indexadas, analiza el snippet y permite guardar candidatos en el CRM.

SearXNG es gratis y open-source, pero para resultados estables conviene usar una instancia propia o controlada con `format=json` habilitado. Muchas instancias públicas bloquean JSON o aplican rate limits. Este módulo no entra a LinkedIn, Facebook ni Instagram para scrapeo directo. Si no configuras `SEARXNG_BASE_URL`, la app genera enlaces de búsqueda manual para Google y Bing.

Ejemplo:

```bash
SEARXNG_BASE_URL=https://tu-instancia-searxng.com
```

## Deploy en Vercel

1. Sube este proyecto a GitHub.
2. Importa el repo en Vercel.
3. Agrega las variables de entorno en Project Settings.
4. Ejecuta el deploy.
5. Crea tu usuario en Supabase antes de entrar.
6. Abre `/diagnostics` dentro de la app para confirmar que todo quedó conectado.

## Límites de cumplimiento

Esta app solo abre URLs oficiales en una nueva pestaña para revisión manual. No ejecuta seguimiento automático, mensajes automáticos, navegación oculta, scraping agresivo, simulación de comportamiento humano ni evasión de límites.
