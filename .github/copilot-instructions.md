# Project Guidelines

## Code Style

- Use TypeScript for all frontend code with strict type checking
- Follow ESLint rules (auto-fix with `pnpm lint`) and Prettier formatting (`pnpm format`)
- Date handling: Always use YYYY-MM-DD string format, never timestamps or ISO strings
- See [src/lib/calendarUtils.ts](src/lib/calendarUtils.ts) for date utilities

## Architecture

- **Frontend**: React + Material-UI in [src/](src/), using hooks for data fetching (React Query)
- **Localization**: Client-side translations are handled in `src/lib/i18n.ts`, with locale selection persisted in localStorage and Material-UI locale support in `src/theme.ts`
- **Backend**: Rust + Tauri in [src-tauri/](src-tauri/), with Diesel ORM for SQLite
- **Data Flow**: Components → Hooks → Services → Tauri Commands → Database
- Services are the single source of Tauri invocations; all DB timestamps injected server-side
- Database: SQLite with WAL mode, foreign key enforcement, and embedded migrations

## Build and Test

- Install: `pnpm install`
- Dev: `pnpm tauri dev` (starts Vite dev server on port 1420 and Tauri)
- Build: `pnpm build` or `tauri build` for production
- Lint: `pnpm lint`
- Format: `pnpm format`
- No test suite; manual testing via dev mode

## Conventions

- UUIDs generated server-side for new entities (client does not provide IDs)
- React Query: Full cache invalidation on mutations (e.g., ['sessions'] key)
- Error handling: Rust errors serialized as {kind, message} and converted to JS Errors
- Optional updates: Use Option<Option<T>> to distinguish unset from NULL
- All dates in local time; avoid timezone conversions</content>

<parameter name="filePath">/home/joaoz/session-tracker/.github/copilot-instructions.md
