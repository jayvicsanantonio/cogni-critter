# Repository Guidelines

## Project Structure & Module Organization
- `App.tsx` bootstraps the Expo client and binds initial navigation.
- `src/components` hosts reusable UI and animation primitives; colocate component-specific tests in the matching `__tests__` folder.
- `src/screens` contains full-screen flows that compose components and services.
- `src/services` wraps TensorFlow inference, persistence, and model loading; keep API clients and side-effects here.
- `src/utils` surfaces pure helpers reused across the app, while `src/assets` stores sprites and model downloads triggered by `npm run download-models`.
- Platform shells live in `ios/` and `public/`; design notes and context diagrams reside under `docs/`.

## Build, Test, and Development Commands
- `npm run start` launches the Expo dev client with Metro cache cleared.
- `npm run dev:ios` runs Metro and the iOS simulator in parallel once the dev server responds.
- `npm run android` / `npm run ios` call the raw React Native CLI for device builds.
- `npm test` executes Jest suites; pair with `--watch` during active development.
- `npm run lint` and `npm run format` rely on Biome for linting and formatting; use `npm run lint:fix` before submitting changes.
- `npm run typecheck` gates merges with a strict TypeScript compile.

## Coding Style & Naming Conventions
- TypeScript files use 2-space indentation, single quotes, and trailing commas per `biome.json`.
- Prefer functional components with explicit prop interfaces; default to named exports when sharing across modules.
- Name files in PascalCase for components (`AnimatedCritter.tsx`) and camelCase for helpers (`animationHelpers.ts`).
- Keep side-effectful logic inside services; screens should orchestrate state via hooks.

## Testing Guidelines
- Write Jest tests alongside source in `__tests__` directories, mirroring the component or service name.
- Use React Testing Library patterns for UI and Jest mocks for TensorFlow services; avoid snapshot bloat unless covering visual regressions.
- Target critical flows (critter state transitions, scoring, storage) and run `npm test -- --coverage` when touching core logic.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `chore(lint):`, `fix:`) with concise, imperative subjects under ~72 chars.
- Keep commits scoped to a single concern; include any necessary script outputs in the body.
- Pull requests should summarize the change, reference related issues, list manual QA (device/simulator, platforms), and attach screenshots or screen recordings for UI updates.
- Confirm `npm run lint`, `npm run typecheck`, and `npm test` before asking for review.
