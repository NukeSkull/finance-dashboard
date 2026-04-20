# Project Decisions

## Initial Decisions

- Use a single repository with `pnpm workspaces`.
- Keep the frontend in `apps/web` and deploy it to Vercel.
- Keep the backend in `apps/api` and deploy it to Render.
- Use Google Sheets as the main source of truth.
- Use MongoDB only as auxiliary storage, not as the primary financial database.
- Keep v1 focused on dashboard reads and quick expense creation.
- Start without Turborepo. Add it later only if workspace scripts become painful.
- Keep `packages/shared` small and use it only for types or utilities that are genuinely shared.

## Product Constraints

- Do not redesign the existing Google Sheets structure in v1.
- Do not replicate the spreadsheet visually; reinterpret it as a cleaner app.
- Do not build multiuser SaaS behavior in v1.
- Prioritize simple, maintainable implementation over generalized abstractions.
