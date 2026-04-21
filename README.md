# Finance Dashboard

Aplicacion web personal para visualizar y gestionar finanzas usando un Google Sheets existente como fuente principal de verdad.

El objetivo no es replicar el Excel visualmente, sino convertirlo en una app privada, limpia y comoda para consultar KPIs, revisar historico y, mas adelante, anadir gastos rapidamente escribiendo de vuelta en Google Sheets.

## Estado Actual

Estado del proyecto: **Fase 7.6 completada y deploy operativo**.

Ya existe una base monorepo con frontend Next.js, backend NestJS, login Firebase, una primera integracion read-only real con Google Sheets protegida por token y un dashboard mensual v1.

Hecho hasta ahora:

- Repositorio inicializado y conectado a GitHub.
- Monorepo con `pnpm workspaces`.
- Frontend Next.js en `apps/web`.
- Backend NestJS en `apps/api`.
- Paquete compartido minimo en `packages/shared`.
- Configuracion flexible de entorno en backend.
- Healthcheck backend en `GET /health`.
- Modulos base backend: `config`, `database`, `auth`, `sheets`, `finance`, `health`.
- Conexion opcional preparada para MongoDB.
- Integracion real read-only con Google Sheets usando service account.
- Endpoint backend funcional para resumen mensual:
  ```txt
  GET /finance/monthly-summary?year=2026&month=4
  ```
- Tests basicos para helpers de resumen mensual.
- Credenciales locales protegidas con `.gitignore`.
- Login con Firebase Authentication.
- Ruta principal privada.
- Logout desde el dashboard privado.
- Verificacion de ID tokens Firebase en backend.
- `GET /finance/monthly-summary` protegido con `Authorization: Bearer <idToken>`.
- Dashboard general v1 con selector de mes y ano.
- KPIs reales del resumen mensual: ingresos, gastos vitales, gastos extra, gasto total, inversion y ahorro.
- Metricas derivadas en frontend: balance mensual y ratio aproximado de ahorro.
- Estados de carga, error y periodo sin valores.
- Cards placeholder para las secciones previstas.
- Deploy funcional:
  - frontend en Vercel
  - backend en Render
- Quick add de gastos operativo:
  - categorias dinamicas leidas desde Google Sheets
  - escritura protegida en celdas mensuales
  - normalizacion de valores literales a formulas
  - refresco del frontend tras guardar
- Primera vista por seccion operativa:
  - ruta dedicada de ingresos y gastos
  - periodo persistido en query params
  - bloques de ingresos, gastos vitales y gastos extra
  - navegacion real desde la home
- Vistas tabulares de activos operativas:
  - rutas dedicadas para compras y ventas
  - filtros por rango de fechas en query params
  - fechas legibles y orden descendente
  - resumen corto y tabla detallada por operaciones
- Vista Zen operativa:
  - ruta dedicada `/zen`
  - KPIs de total y disponible Zen
  - tabla de objetivos de ahorro
  - progreso porcentual por objetivo
- Vista VT Markets operativa:
  - ruta dedicada `/vt-markets`
  - tabs de resultados, global y cuentas
  - selector de ano por resultados
  - resumen contextual por tab
  - desglose agrupado y exacto de cuentas
- Patrimonio total operativo en la home:
  - KPIs globales de patrimonio, liquido e invertido
  - ratio liquido vs invertido
  - tabla por sitio ordenada por peso en patrimonio
  - lectura directa desde la hoja `Total`

No esta hecho todavia:

- Las subfases 7.7 en adelante.
- Configuracion general de la app.

## Stack

- Frontend: Next.js, TypeScript
- Backend: NestJS, TypeScript
- Auth: Firebase Authentication con email y contrasena
- Base auxiliar: MongoDB
- Fuente principal: Google Sheets
- Integracion Sheets: Google Sheets API desde backend
- Frontend deploy: Vercel
- Backend deploy: Render
- Package manager: pnpm

## Estructura

```txt
apps/web
  Frontend Next.js.

apps/api
  Backend NestJS. Aqui viven Google Sheets, Firebase Admin, MongoDB y logica financiera.

packages/shared
  Tipos y utilidades compartidas cuando sean realmente necesarias.

docs
  Decisiones del proyecto y fases de desarrollo.
```

## Arranque Local

Instalar dependencias:

```bash
pnpm install
```

Arrancar frontend:

```bash
pnpm dev:web
```

Abrir:

```txt
http://localhost:3000
```

Arrancar backend:

```bash
pnpm dev:api
```

Healthcheck:

```txt
http://localhost:4000/health
```

Resumen mensual desde Google Sheets:

```txt
http://localhost:4000/finance/monthly-summary?year=2026&month=4
```

Este endpoint requiere token Firebase:

```txt
Authorization: Bearer <firebase_id_token>
```

En Windows, si PowerShell bloquea `pnpm`, usa `pnpm.cmd`:

```bash
pnpm.cmd dev:web
pnpm.cmd dev:api
```

## Variables De Entorno

Crea un `.env` local en la raiz del repo. No se sube a Git.

Variables principales:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

PORT=4000
FRONTEND_ORIGIN=http://localhost:3000

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SHEETS_CLIENT_EMAIL=
GOOGLE_SHEETS_PRIVATE_KEY=

MONGODB_URI=
```

Notas importantes:

- Comparte el Google Sheet con el email de `GOOGLE_SHEETS_CLIENT_EMAIL`.
- `GOOGLE_SHEETS_PRIVATE_KEY` debe mantener los saltos de linea como `\n` si esta en una sola linea.
- `FIREBASE_PRIVATE_KEY` tambien debe mantener los saltos de linea como `\n` si esta en una sola linea.
- El frontend carga el `.env` de la raiz con `dotenv-cli`, pero arranca explicitamente en el puerto `3000` para no chocar con la API en `4000`.
- No subas nunca `.env` ni JSONs de service account.
- Los ficheros `finance-dashboard-*.json` y `finance-dashboard-credentials.json` estan ignorados por Git.

## Scripts Utiles

```bash
pnpm lint
pnpm typecheck
pnpm test:api
pnpm build:web
pnpm build:api
```

## Deploy

Conviene hacer el deploy en este orden:

1. Render para la API.
2. Vercel para el frontend, ya apuntando a la URL real del backend.

### Render

El backend NestJS debe ir en Render como un `Web Service`.

Este repo incluye un [`render.yaml`](./render.yaml) base para arrancar mas rapido. Importante en este monorepo:

- No pongas `Root Directory` en `apps/api` si usas el workspace tal como esta hoy.
- Render indica que los ficheros fuera del root no estan disponibles en build ni runtime, y este backend depende del `pnpm-workspace`, lockfile y configuracion de la raiz.
- Por eso aqui el servicio se construye desde la raiz del repo y se filtran los builds con `buildFilter`.

Pasos recomendados:

1. En Render, elige `New +` -> `Blueprint` si quieres usar `render.yaml`, o `Web Service` si prefieres configurarlo a mano.
2. Conecta el repositorio de GitHub.
3. Si usas `Blueprint`, Render te pedira los valores marcados con `sync: false`.
4. Si lo haces manual:
   - Runtime: `Node`
   - Build Command: `pnpm install --frozen-lockfile && pnpm --filter @finance-dashboard/api build`
   - Start Command: `pnpm --filter @finance-dashboard/api start`
   - Health Check Path: `/health`
   - Root Directory: vacio, dejando la raiz del repo
5. Configura estas variables de entorno:

```env
NODE_VERSION=22
PORT=10000
FRONTEND_ORIGIN=https://tu-frontend.vercel.app

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SHEETS_CLIENT_EMAIL=
GOOGLE_SHEETS_PRIVATE_KEY=

MONGODB_URI=
```

Notas importantes para Render:

- `PORT=10000` encaja con el puerto por defecto esperado por Render para `Web Services`.
- `FRONTEND_ORIGIN` debe ser exactamente la URL publica de Vercel, sin slash final.
- `FIREBASE_PRIVATE_KEY` y `GOOGLE_SHEETS_PRIVATE_KEY` deben mantenerse en una sola linea con `\n`.
- Comparte el Google Sheet con el email de `GOOGLE_SHEETS_CLIENT_EMAIL`.
- `MONGODB_URI` hoy es opcional; si no lo defines, la API deberia arrancar igualmente.
- Cuando termine, comprueba:
  - `https://tu-api.onrender.com/health`

### Vercel

El frontend Next.js debe ir en Vercel como proyecto separado apuntando a `apps/web`.

Pasos recomendados:

1. Importa el repo en Vercel.
2. En el proyecto del frontend, configura:
   - Root Directory: `apps/web`
   - Framework Preset: `Next.js`
   - Node.js Version: `22.x`
3. En `Environment Variables`, anade:

```env
NEXT_PUBLIC_API_URL=https://tu-api.onrender.com
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

4. Haz un redeploy despues de guardar variables.

Notas importantes para Vercel:

- Vercel aplica los cambios de variables de entorno solo a nuevos deploys, no a deploys ya creados.
- `NEXT_PUBLIC_API_URL` debe apuntar a la URL publica de Render, sin slash final.
- En este repo, el script local de `apps/web` usa `dotenv` para leer `../../.env`. Para Vercel, si el build no te funciona con la configuracion por defecto, fuerza el `Build Command` a `next build` para que el deploy use directamente las variables del proyecto y no dependa de un `.env` del repo.
- Si quieres traerte luego esas variables a local con Vercel CLI, el flujo habitual es vincular `apps/web` y tirar de `.env.local`.

### Checklist Rapido

- Render responde en `/health`.
- `NEXT_PUBLIC_API_URL` en Vercel apunta a Render.
- `FRONTEND_ORIGIN` en Render apunta a Vercel.
- Firebase Auth permite el dominio de Vercel en Authorized domains.
- El Google Sheet esta compartido con la service account de Google Sheets.

### Errores Tipicos

- `401` o `403` en `/finance/monthly-summary`: suele ser Firebase Admin mal configurado o token correcto pero backend sin credenciales.
- Error de CORS: `FRONTEND_ORIGIN` no coincide exactamente con la URL real de Vercel.
- Error de Google Sheets: hoja no compartida con `GOOGLE_SHEETS_CLIENT_EMAIL` o private key mal pegada.
- Vercel compila pero la app falla al abrir `/login`: falta alguna `NEXT_PUBLIC_FIREBASE_*`.

## Roadmap

### [x] Fase 1: Preparacion y scaffolding inicial

Objetivo: dejar una base ejecutable, no una app funcional completa.

Completado:

- Git inicializado.
- Repo conectado a GitHub.
- Monorepo `pnpm`.
- Next.js en `apps/web`.
- NestJS en `apps/api`.
- `packages/shared` creado.
- `.env.example`, `.gitignore`, README y docs iniciales.
- Scripts base de dev, build, lint y typecheck.

### [x] Fase 2: Backend minimo y configuracion

Objetivo: preparar la API para crecer sin conectar todavia toda la logica externa.

Completado:

- `GET /health`.
- `ConfigModule` con validacion flexible via Zod.
- Variables de entorno reconocidas para Google Sheets, Firebase, MongoDB, CORS y puerto.
- `DatabaseModule` con MongoDB opcional.
- Modulos placeholder para `auth`, `sheets` y `finance`.
- API arranca aunque falten credenciales reales no criticas.

### [x] Fase 3: Google Sheets read-only real

Objetivo: leer datos reales del Google Sheets desde el backend sin escribir nada.

Completado:

- Dependencia `googleapis`.
- `SheetsService` read-only con service account.
- Lectura con `valueRenderOption=UNFORMATTED_VALUE`.
- Endpoint:
  ```txt
  GET /finance/monthly-summary?year=2026&month=4
  ```
- Mapeo inicial de `Ingresos/Gastos {year}`:
  - ingresos
  - gastos vitales
  - gastos extraordinarios y ocio
  - gasto total
  - inversion mensual
  - ahorro
- Tests de helpers de resumen mensual.
- Verificado contra el Google Sheet real.

### [x] Fase 4: Frontend autenticado base

Objetivo: convertir la app en privada y empezar a tener una estructura usable.

Completado:

- Firebase Web SDK en frontend.
- Firebase Admin SDK en backend.
- Login con email y contrasena.
- Estado de sesion en cliente.
- Ruta `/login`.
- Ruta `/` protegida por sesion.
- Logout.
- Guard NestJS para validar ID tokens.
- `GET /finance/monthly-summary` protegido.
- `/` y `/health` siguen publicos en backend.
- Llamada autenticada minima desde la pantalla privada al resumen mensual.

### [x] Fase 5: Dashboard general v1

Objetivo: primera home realmente util.

Completado:

- Mostrar mes y ano actuales por defecto.
- Selector de mes/ano.
- Consumir `monthly-summary` desde frontend.
- Cards de KPIs mensuales principales.
- Estado loading/error/empty.
- Primer resumen visual responsive y mobile-first.
- Cards placeholder para navegacion futura.

KPIs implementados:

- Ingresos del mes.
- Gastos vitales.
- Gastos extraordinarios y ocio.
- Gasto total del mes.
- Invertido este mes.
- Ahorro del mes.
- Balance mensual.
- Ratio aproximado de ahorro.

Pendiente para fases posteriores:

- Resumen por cuentas, bancos y exchanges.

### [x] Fase 6: Quick add de gastos

Objetivo: anadir gastos desde la app escribiendo en Google Sheets.

Completado:

- Formulario rapido dentro del dashboard.
- Categorias dinamicas leidas desde Google Sheets.
- Importe EUR.
- Selector propio de mes/ano con periodo actual por defecto.
- Endpoint protegido para listar categorias de gasto.
- Endpoint protegido para escribir gasto en la celda mensual correcta.
- Backend lee la formula actual de la celda destino.
- Si hay formula, concatena el nuevo importe.
- Si la celda esta vacia o contiene `0`, crea formula inicial.
- Si la celda contiene un valor literal numerico, lo convierte a formula antes de anadir el nuevo importe.
- Validaciones para evitar romper formulas o escribir en filas no permitidas.
- Refresco del frontend tras guardar.

### [~] Fase 7: Vistas por seccion

Objetivo: cubrir las areas principales del Sheet con vistas comodas.

Estado: en progreso.

#### [x] Fase 7.1: Vista mensual de ingresos y gastos

Completado:

- Ruta dedicada `/income-expenses`.
- Navegacion real desde la card del dashboard.
- Periodo en query params `year` y `month`.
- Vista de lectura v1 con resumen superior.
- Bloques de ingresos, gastos vitales y gastos extra.
- Filas por categoria real del Google Sheet.
- Totales por seccion y gasto total del periodo.

#### [x] Fase 7.2: Compras de activos

Completado:

- Ruta dedicada `/asset-purchases`.
- Navegacion real desde la card del dashboard.
- Filtros por `dateFrom` y `dateTo` en query params.
- Tabla de operaciones con orden por fecha mas reciente.
- Fechas legibles derivadas del serial de Google Sheets.
- Resumen corto del rango filtrado.

#### [x] Fase 7.3: Ventas de activos

Completado:

- Ruta dedicada `/asset-sales`.
- Navegacion real desde la card del dashboard.
- Filtros por `dateFrom` y `dateTo` en query params.
- Tabla de operaciones con orden por fecha mas reciente.
- Fechas legibles derivadas del serial de Google Sheets.
- Resumen corto del rango filtrado.

#### [x] Fase 7.4: Zen

Completado:

- Ruta dedicada `/zen`.
- Navegacion real desde la card del dashboard.
- KPIs superiores de total y disponible Zen.
- Tabla de objetivos de ahorro con ahorrado, restante y objetivo.
- Porcentaje de progreso por objetivo con barra visual simple.

#### [x] Fase 7.5: VT Markets

Completado:

- Ruta dedicada `/vt-markets`.
- Navegacion real desde la card del dashboard.
- Tabs de `Resultados`, `Global` y `Cuentas`.
- Estado persistido en query params.
- Resultados anuales con bloques dinamicos por estrategia.
- Resumen global por ano desde la hoja de globales.
- Resumen agrupado y desglose exacto de cuentas VT.

#### [x] Fase 7.6: Patrimonio total

Completado:

- Bloque integrado en la home, sin ruta dedicada.
- KPIs de patrimonio total, liquido e invertido.
- Ratios de liquido vs invertido.
- Tabla por sitio con peso relativo dentro del patrimonio.
- Lectura de la hoja `Total` respetando la agrupacion `Bancos`, `Crypto`, `Forex` y `Participaciones`.

#### [ ] Fase 7.7: Configuracion

Pendiente:

- Configuracion.
- Siguiente punto recomendado para la proxima sesion.

### [ ] Fase 8: Endurecimiento

Objetivo: dejar el proyecto mas robusto y facil de mantener.

Pendiente:

- Tests criticos del backend.
- Validacion de permisos.
- Manejo de errores de Google Sheets mas fino.
- Documentacion de setup para clonar el repo con otro Google Sheet.
- Revision de seguridad de credenciales y variables.

## Decisiones Del Proyecto

- Google Sheets es la fuente principal de verdad.
- MongoDB sera auxiliar, no la base financiera principal.
- No se redisenara la estructura del Sheet en v1.
- La app no sera un SaaS ni multiusuario real.
- Se prioriza simplicidad y mantenimiento sobre abstracciones grandes.
- La escritura en Sheets se dejara para una fase especifica, no mezclada con la lectura.

## Referencias Internas

- Roadmap corto: `docs/phases.md`
- Decisiones tecnicas: `docs/project-decisions.md`
