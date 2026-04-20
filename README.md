# Finance Dashboard

Aplicacion web personal para visualizar y gestionar finanzas usando un Google Sheets existente como fuente principal de verdad.

El objetivo no es replicar el Excel visualmente, sino convertirlo en una app privada, limpia y comoda para consultar KPIs, revisar historico y, mas adelante, anadir gastos rapidamente escribiendo de vuelta en Google Sheets.

## Estado Actual

Estado del proyecto: **Fase 5 completada**.

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

No esta hecho todavia:

- Escritura en Google Sheets.
- Quick add de gastos.
- Vistas completas por seccion.
- KPIs globales de patrimonio, Zen, VT Markets y cuentas.
- Deploy en Vercel/Render.

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

- Patrimonio total.
- Total en Zen.
- Total en VT Markets.
- Resumen por cuentas, bancos y exchanges.

### [ ] Fase 6: Quick add de gastos

Objetivo: anadir gastos desde la app escribiendo en Google Sheets.

Pendiente:

- Formulario rapido tipo gasto.
- Categoria cerrada.
- Importe EUR.
- Mes actual por defecto.
- Backend lee la formula actual de la celda destino.
- Si hay formula, concatena el nuevo importe.
- Si la celda esta vacia, crea formula inicial.
- Validaciones para evitar romper formulas existentes.

### [ ] Fase 7: Vistas por seccion

Objetivo: cubrir las areas principales del Sheet con vistas comodas.

Pendiente:

- Vista mensual de ingresos y gastos.
- Compras de activos.
- Ventas de activos.
- Ahorro por objetivos Zen.
- Resultados VT Markets.
- Patrimonio total.
- Configuracion.

### [ ] Fase 8: Endurecimiento

Objetivo: dejar el proyecto mas robusto y facil de mantener.

Pendiente:

- Tests criticos del backend.
- Validacion de permisos.
- Manejo de errores de Google Sheets mas fino.
- Documentacion de setup para clonar el repo con otro Google Sheet.
- Preparacion de deploy en Vercel y Render.
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
