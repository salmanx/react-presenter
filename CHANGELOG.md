# v0.1.0 — Initial release

A Rails-style presenter/decorator pattern for TypeScript, with a
framework-agnostic core (React, Next.js, Angular, Vue, NestJS, or plain
Node all work) and an optional React hook.

## Highlights

- **Automatic attribute mapping** — `UserPresenter.present(user).email`
  works without writing a pass-through getter for every field. A `Proxy`
  checks your presenter's getters first, then falls back to the raw
  entity.
- **Collections** — `UserPresenter.presentMany(users, context)`, sharing
  one context object across every item.
- **Context-aware presentation** — pass locale, current user, permissions,
  or anything else as a second argument; read it back via `this.context`
  in any getter.
- **Authorization-aware fields** — a getter can return `undefined` or
  throw when the viewer isn't allowed to see it; either way it's safely
  omitted from serialized output instead of failing.
- **Formatting & i18n** — `this.format.date/number/currency/relativeTime`
  (Intl-backed, locale-aware) and `this.t(key)`, pluggable once via
  `configurePresenter({ translate, locale, formatters })`.
- **Safe, allowlist-based serialization** — `.toJSON()`, `.only(...)`,
  `.except(...)` expose _only_ the getters you defined on the presenter,
  never the raw entity. Built for crossing a server/client or
  controller/response boundary (Next.js Server Actions, NestJS
  controllers, API routes) without accidentally leaking a full DB row.
- **Async computed properties** — plain `async` methods (not `async get`,
  which isn't valid JS) are auto-detected and resolved via
  `await presenter.resolve()`, merged with the sync getters.
- **Functional API** — `decorate(data, PresenterClass, context)` /
  `decorateMany(...)` as an alternative to the static `.present()` call.
- **React integration** (`react-presenter/react`, optional peer dep) —
  `usePresenter` / `usePresenterMany` hooks that memoize presenter
  creation across re-renders. The core package has no React dependency
  at all.

## Install

```bash
npm install react-presenter
```

## Package

- Two entry points: `react-presenter` (core) and `react-presenter/react`
  (hooks, `"use client"`-tagged).
- Zero runtime dependencies. `react` is an optional peer dependency,
  only required if you use the `/react` subpath.

## Tested

32 tests across 7 suites covering automatic attribute mapping and
overrides, memoization, collections, `toJSON`/`only`/`except` (including
throwing/unauthorized getters), `resolve()` (including a rejected async
property), context-driven authorization and i18n, the Intl format
adapter and global config overrides, and the React hooks.
