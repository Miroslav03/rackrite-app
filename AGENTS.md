# RackRite Agent Guidance

## Project

RackRite is an offline-first React Native application for planning and logging
powerlifting workouts.

- Stack: Expo 55, Expo Router, TypeScript, SQLite, Drizzle ORM, and NativeWind.
- Optimize for workout-data correctness, offline reliability, fast interaction,
  and maintainable domain boundaries.
- Preserve the established project structure and nearby patterns unless the task
  explicitly requires an architectural change.

## Commands

- Use the package manager selected by the existing lockfile. Never switch package
  managers or regenerate the lockfile unnecessarily.
- Inspect `package.json` and use existing scripts rather than guessing commands.
- Start the development build with the existing start script, or
  `npx expo start --dev-client` if no more specific script exists.
- Type-check with the existing script, or `npx tsc --noEmit` if none exists.
- Run the existing lint script and the nearest relevant tests after changes.
- If required verification tooling is missing, report it. Do not install new
  tooling solely to make a verification command available.

## Architecture

Maintain this dependency direction:

`UI -> feature/controller -> domain/use case -> repository contract -> persistence`

- `domain/` must not import React, React Native, Expo, SQLite, Drizzle, or UI code.
- Components and presentation hooks must not contain business rules or access
  SQLite/Drizzle directly.
- Keep selectors pure and do not mutate aggregates.
- Persistence implementations may depend on domain contracts; the domain must
  not depend on persistence implementations.
- Repository implementations may be objects. Do not convert them to classes
  without a concrete benefit.
- Do not add a new layer, pattern, or single-use abstraction unless it removes
  meaningful complexity.

## TypeScript and React

- Preserve strict typing and existing domain-specific types.
- Never introduce `any` to bypass a type error. Use `unknown` plus narrowing for
  untrusted external data.
- Prefer discriminated unions for finite states and handle them exhaustively.
- Reuse existing types instead of creating structurally identical duplicates.
- Avoid type assertions unless the runtime condition has been established.
- Prefer derived values over duplicated React state.
- Do not use effects to mirror props or derive values during render.
- Keep state at the narrowest appropriate feature boundary. Do not introduce
  application-wide state without a concrete need.
- For active-workout editors, verify keyboard behavior, Android back behavior,
  unmounting, and pending debounced updates.

## Persistence

SQLite is currently the local source of truth.

- Apply related aggregate changes atomically when partial persistence could
  create invalid state.
- Keep mappings between database rows and domain models explicit. Do not expose
  Drizzle row types as domain models.
- Do not change schemas or migrations as incidental refactoring.
- Never delete, rewrite, or squash an existing migration without explicit
  approval.
- Before a schema change, explain compatibility and existing-data impact.
- Keep boundaries compatible with future synchronization without adding
  speculative backend abstractions.

## UI and dependencies

- Preserve RackRite's dark visual system and established component patterns.
- Keep active, completed, disabled, and editable states distinct. Color must not
  be the only signal for important state.
- Prioritize readability and interaction speed during workouts over decoration.
- Do not redesign unrelated components during a focused change.
- Do not add a dependency without explaining why current code or installed
  dependencies cannot reasonably solve the problem.
- Confirm new dependencies are maintained and compatible with the current Expo
  and React Native versions. Never upgrade unrelated dependencies.

## Working process

Before editing:

1. Inspect relevant files and nearby patterns.
2. Trace the affected data flow and identify applicable invariants.
3. For multi-file or architectural work, present a short plan first.
4. Ask only questions whose answers materially affect the implementation.

While editing:

- Make the smallest coherent change that solves the requested problem.
- Preserve unrelated user changes and avoid unrelated cleanup.
- Follow existing naming, architecture, and module boundaries.
- Add or update tests for changed behavior when a test setup exists.

Before completion:

1. Inspect the complete diff.
2. Run relevant targeted tests, type checking, and linting.
3. Verify the requested behavior against its acceptance criteria.
4. Report the exact checks run and anything that could not be verified.

Never claim a change works without evidence from tests, compilation, runtime
verification, or direct code tracing.

## Code review rules

When asked to review, do not modify code unless explicitly requested.

Prioritize correctness, domain-invariant violations, data-loss risks, stale or
duplicated state, debounce/lifecycle races, offline failures, and missing tests.
Ignore subjective style preferences unless they create a concrete maintenance
or correctness problem.

For each finding provide severity, exact location, concrete failure scenario,
evidence from the code, and the smallest reasonable correction. Verify findings
against surrounding code and remove speculative ones. If there are no meaningful
findings, state that clearly.
