# Contributing to react-presenter

Thanks for considering a contribution. This doc covers how to get set
up, how the project is organized, and what's expected in a PR.

## Getting started

```bash
git clone <your fork URL>
cd react-presenter
npm install
```

That installs everything needed — the package itself has zero runtime
dependencies; `react` is an optional peer dependency only needed if
you're working on `src/react.ts`.

### Scripts

| Command              | What it does                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run build`      | Builds `dist/` (ESM + CJS + `.d.ts`) via tsup, then re-adds the `"use client"` directive to the React entry. |
| `npm run dev`        | `tsup --watch` — rebuilds on save.                                                                           |
| `npm test`           | Runs the full Vitest suite once.                                                                             |
| `npm run test:watch` | Vitest in watch mode.                                                                                        |
| `npm run typecheck`  | `tsc --noEmit` — no build output, just type errors.                                                          |

Before opening a PR, all three of these should pass clean:

```bash
npm run typecheck
npm run build
npm test
```

`prepublishOnly` runs `build` + `test` automatically, so a broken build
or a failing test blocks `npm publish` even if you forget to run them
by hand.

## Project layout

```
src/
  Presenter.ts     core abstract class: present/presentMany/resolve/toJSON/only/except
  proxy.ts          Proxy-based automatic attribute pass-through (+ optional memoization)
  reflection.ts     prototype-chain scanning for getters / async methods
  serialize.ts      toJSON/only/except implementation
  config.ts         configurePresenter() / getPresenterConfig()
  format.ts         Intl-backed FormatAdapter
  decorate.ts        decorate() / decorateMany()
  types.ts          shared types + DataOf<P>/ContextOf<P> inference helpers
  index.ts          core package entry point
  react.ts          "use client" — usePresenter / usePresenterMany
tests/
  fixtures.ts        shared User type + UserPresenter used by every test file
  *.test.ts / *.test.tsx
scripts/
  add-use-client.mjs postbuild step, see below
```

If you're adding a new capability, it almost always belongs as its own
file in `src/` with its own test file in `tests/`, re-exported from
`src/index.ts` (or `src/react.ts` if it's React-specific) — avoid
growing `Presenter.ts` into a catch-all.

## Adding a new feature

1. Add the implementation in its own file under `src/`, with clear
   TSDoc comments — the README's code samples and the doc comments
   should stay consistent with each other.
2. Add a test file under `tests/` covering the happy path and at least
   one edge case (an empty/missing value, a thrown error, or similar —
   see `tests/serialize.test.ts` for the pattern of testing both).
3. Re-export the new public API from `src/index.ts` (or `src/react.ts`).
4. Update `README.md` — new use cases go in the numbered use-case list
   if they're presenter-level features, or the API reference table if
   they're a new method/option.
5. Run `npm run typecheck && npm run build && npm test` before opening
   the PR.

## Reporting bugs

Please include:

- A minimal presenter class + the data shape you're presenting.
- What you expected vs. what happened.
- Whether it's a type-level issue (TypeScript complains but the code is
  logically correct) or a runtime issue (wrong value, throws, etc.) —
  these usually point to very different parts of the codebase (`types.ts`
  vs. `proxy.ts`/`serialize.ts`).

## Code style

- TypeScript `strict` mode is on — please don't add `any` without a
  `// eslint-disable-next-line` comment explaining why it's needed (a
  few already exist in `Presenter.ts`/`decorate.ts`/`react.ts` for the
  polymorphic `this`-typed static methods, which is the one place it's
  genuinely hard to avoid).
- Prefer small, single-purpose files (see the current `src/` layout)
  over adding more logic to `Presenter.ts`.
- Match the existing TSDoc comment style on exported members — these
  comments are what most editors show on hover, so they're part of the
  public API's usability, not just internal notes.

## License

By contributing, you agree your contributions are licensed under the
project's [MIT License](./LICENSE).
