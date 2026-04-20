# Development Phases

## 1. Preparation and Initial Scaffolding

- Initialize Git.
- Create a `pnpm` workspace monorepo.
- Scaffold Next.js in `apps/web`.
- Scaffold NestJS in `apps/api`.
- Add base TypeScript, linting, environment, and documentation files.

## 2. Minimal Backend and Configuration

- Add healthcheck.
- Configure environment variables.
- Prepare `config`, `auth`, `sheets`, and `finance` modules.
- Add env validation.
- Prepare MongoDB connection without complex models.

## 3. Google Sheets Read-Only Integration

- Connect to the Google Sheets API from NestJS.
- Read configurable sheet ranges.
- Add endpoints for monthly summary data.
- Normalize data without changing the sheet structure.

## 4. Authenticated Frontend Base

- Add Firebase Authentication with email and password.
- Protect private routes.
- Create the dark responsive app layout.
- Add the main navigation structure.

## 5. General Dashboard v1

- Default to the current month and year.
- Add month/year selector for historical views.
- Display the main KPIs: net worth, income, expenses, invested amount, savings, Zen total, and VT Markets total.
- Add account, bank, and exchange summaries.

## 6. Quick Add Expenses

- Add a fast expense form.
- Use fixed type `expense`.
- Use closed categories.
- Default to EUR and current month.
- Read the current Google Sheets formula and append the new amount.
- Create a formula when the target cell is empty.

## 7. Section Views

- Monthly income and expenses.
- Asset purchases.
- Asset sales.
- Zen savings goals.
- VT Markets results.
- Total net worth.
- Settings.

## 8. Hardening

- Add critical backend tests.
- Validate permissions.
- Improve Google Sheets error handling.
- Document setup for cloning the project with a different sheet.
