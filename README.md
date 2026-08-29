# react-presenter

Clean presentation logic for React and Next.js applications with TypeScript presenters. The core is framework-agnostic and also works with NestJS, Angular, Vue.js, and Node.js.

Keep formatting, derived booleans, i18n, and authorization-aware fields
out of your JSX and off your raw API/DB entities, put them in a small
class next to the component that uses them.

```tsx
class ProductPresenter extends Presenter<Product> {
  get isNew() {
    const days =
      (Date.now() - new Date(this.data.created_at).getTime()) / 86_400_000;
    return days <= 7;
  }

  get formattedPrice() {
    return this.format.currency(this.data.price, this.data.currency);
  }
}

function ProductCard({ product }: { product: Product }) {
  const p = ProductPresenter.present(product);
  return (
    <article>
      <h2>{p.title}</h2> {/* passed through from `product` automatically */}
      <span>{p.formattedPrice}</span>
      {p.isNew && <Badge>NEW</Badge>}
    </article>
  );
}
```

---

## Table of contents

- [Install](#install)
- [Quick start](#quick-start)
- [Core concepts](#core-concepts)
- [Use cases](#use-cases)
  1. [Generic `Presenter<T>` base + automatic attribute mapping](#1-generic-presentert-base--automatic-attribute-mapping)
  2. [Collections](#2-collections)
  3. [Server-action / RSC friendly output](#3-server-action--rsc-friendly-output)
  4. [Formatting & localization](#4-formatting--localization)
  5. [Serialization: `toJSON`, `only`, `except`](#5-serialization-tojson-only-except)
  6. [Context](#6-context)
  7. [Authorization-aware presentation](#7-authorization-aware-presentation)
  8. [Async computed properties](#8-async-computed-properties)
  9. [Functional `decorate()`](#9-functional-decorate)
  10. [Automatic attribute mapping (detail)](#10-automatic-attribute-mapping-detail)
- [React integration](#react-integration)
- [Next.js: Server Components & Server Actions](#nextjs-server-components--server-actions)
- [API reference](#api-reference)
- [A note on `async get`](#a-note-on-async-get)
- [Testing](#testing)
- [Project layout](#project-layout)

---

## Install

```bash
npm install react-presenter
```

React is an **optional peer dependency**, the core `Presenter` class has
no React dependency at all and works in plain Node, NestJs, Next.js Server
Components, API routes, or anywhere else. Only `react-presenter/react`
(the `usePresenter` hook) needs React installed.

## Quick start

```ts
// presenters/user-presenter.ts
import { Presenter } from "react-presenter";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export class UserPresenter extends Presenter<User> {
  get fullName() {
    return `${this.data.firstName} ${this.data.lastName}`;
  }

  get formattedCreatedAt() {
    return this.format.date(this.data.createdAt, { dateStyle: "medium" });
  }
}
```

```tsx
// components/user-card.tsx
import { UserPresenter } from "../presenters/user-presenter";

function UserCard({ user }: { user: User }) {
  const p = UserPresenter.present(user);
  return (
    <div>
      <h3>{p.fullName}</h3> {/* presenter getter */}
      <p>{p.email}</p> {/* passed through from `user` */}
      <time>{p.formattedCreatedAt}</time>
    </div>
  );
}
```

## Core concepts

- **`Presenter<T, C>`** — abstract base class. `T` is your raw data
  shape, `C` is an optional context type (locale, current user, etc).
- **`.present(data, context?, options?)`** — static factory. Instantiates
  your presenter and wraps it in a `Proxy` so any attribute of `data` not
  shadowed by a getter is available directly.
- **`.presentMany(dataList, context?, options?)`** — same, for arrays.
- **`.toJSON()` / `.only()` / `.except()`** — serialize _only_ the
  presenter's own computed getters, never the raw entity. Safe to send
  across a server boundary.
- **`.resolve()`** — await every async computed property and merge the
  result with `toJSON()`.

---

## Use cases

### 1. Generic `Presenter<T>` base + automatic attribute mapping

```ts
class ProductPresenter extends Presenter<Product> {
  get formattedPrice() {
    return this.format.currency(this.data.price, this.data.currency);
  }
  get isNew() {
    const days =
      (Date.now() - new Date(this.data.created_at).getTime()) / 86_400_000;
    return days <= 7;
  }
}

const product = ProductPresenter.present(rawProduct);
product.price; // ← raw pass-through, no getter needed
product.formattedPrice; // ← presenter getter
product.location; // ← raw pass-through
product.isNew; // ← presenter getter
product.seller; // ← raw pass-through (the whole nested object)
```

### 2. Collections

```ts
const user = UserPresenter.present(rawUser);
const users = UserPresenter.presentMany(rawUsers);

users.map((u) => u.fullName);
```

Context is shared across every item:

```ts
const users = UserPresenter.presentMany(rawUsers, { currentUserId: "456" });
users[0].canEdit; // evaluated per-item against the same context
```

### 3. Server-action / RSC friendly output

Presenter instances use `Proxies`, so they can't be passed directly between Next.js Server and Client Components but directly works in server component. Call `.toJSON()`, `.only()`, or `.except()` first to convert the presenter into a serializable object when you pass to client component.
— see the [Next.js section](#nextjs-server-components--server-actions) below for
the full pattern.

### 4. Formatting & localization

```ts
class UserPresenter extends Presenter<User, { locale?: string }> {
  get statusLabel() {
    return this.t(`users.status.${this.data.status}`);
  }
  get formattedJoinDate() {
    return this.format.date(this.data.createdAt, { dateStyle: "long" });
  }
}
```

`this.format` is an Intl-backed adapter (`.date`, `.number`, `.currency`,
`.relativeTime`) that automatically uses `context.locale`. `this.t(key,
params?)` calls whatever translate function you've wired up globally:

```ts
import { configurePresenter } from "react-presenter";
import i18next from "i18next";

configurePresenter({
  translate: (key, params, locale) =>
    i18next.t(key, { ...params, lng: locale }),
  locale: "en-US",
});
```

Call `configurePresenter` once, near your app's entry point. Without it,
`this.t(key)` just returns `key` unchanged, so it's always safe to call.

### 5. Serialization: `toJSON`, `only`, `except`

```ts
const presenter = UserPresenter.present(user);

presenter.toJSON(); // every presenter getter
presenter.only("id", "fullName", "avatarUrl"); // just these, in this order
presenter.except("internalNotes"); // everything except these
presenter.toJSON({ only: ["id", "fullName"] }); // equivalent to only()
presenter.toJSON({ except: ["internalNotes"] }); // equivalent to except()
```

`toJSON()` **only ever includes getters you defined on the presenter** —
never `data`, never `context`, never a raw attribute that's only visible
via the automatic pass-through. This is deliberate: it's what makes it
safe to return a presenter's `toJSON()` from an API route or Server
Action without worrying you've leaked the whole underlying entity.

### 6. Context

```ts
const presenter = UserPresenter.present(user, {
  locale: "ja-JP",
  currentUserId: "456",
});

class UserPresenter extends Presenter<
  User,
  { locale: string; currentUserId: string }
> {
  get canEdit() {
    return this.context.currentUserId === this.data.id;
  }
  get formattedDate() {
    return this.format.date(this.data.createdAt);
  }
}
```

Context is just a second constructor argument — put whatever your
presentation logic depends on in there (current user, feature flags,
locale, request-scoped data, etc).

### 7. Authorization-aware presentation

```ts
class UserPresenter extends Presenter<
  User,
  { currentUser?: { can(p: string): boolean } }
> {
  get showEmail() {
    return this.context.currentUser?.can("users.read_email") === true;
  }
  get email() {
    if (!this.showEmail) return undefined;
    return this.data.email;
  }
}
```

If a getter **throws** instead of returning `undefined` (e.g. you prefer
to `throw new Error("not authorized")`), `toJSON()` / `only()` /
`except()` catch it and omit the key rather than failing the whole
serialization — so either style works.

### 8. Async computed properties

```ts
class UserPresenter extends Presenter<User> {
  async profileScore() {
    return calculateScore(this.data);
  }
}

const presenter = UserPresenter.present(user);
const resolved = await presenter.resolve();
resolved.profileScore; // number
resolved.fullName; // sync getters are included too
```

See [the note below](#a-note-on-async-get) on why this is a plain
`async` method rather than `async get profileScore()`.

### 9. Functional `decorate()`

```ts
import { decorate, decorateMany } from "react-presenter";

const user = decorate(rawUser, UserPresenter);
const users = decorateMany(rawUsers, UserPresenter, context);
```

Identical to `UserPresenter.present(...)` / `.presentMany(...)` — pick
whichever reads better at the call site.

### 10. Automatic attribute mapping (detail)

Given:

```ts
type User = {
  id: string;
  email: string;
  active: boolean;
  firstName: string;
  lastName: string;
};
```

you do **not** need to write pass-through getters for every field:

```ts
class UserPresenter extends Presenter<User> {
  // nothing here yet — id/email/active/firstName/lastName all work already
}

const user = UserPresenter.present(rawUser);
user.email; // works — proxied straight through to rawUser.email
```

`.present()` wraps the presenter instance in a `Proxy`: a property read
checks the presenter itself first (so a getter you _do_ define always
wins), then falls back to the same key on the raw data object. This is
implemented with `Proxy` `get`/`has` traps, not code generation, so it
works for any object shape without configuration.

---

## React integration

The core package has zero React dependency — call `.present()` directly
in a Server Component. For Client Components, `react-presenter/react`
provides hooks that memoize presenter creation across re-renders:

```tsx
"use client";
import { usePresenter } from "react-presenter/react";

function ProductCard({ product }: { product: Product }) {
  const p = usePresenter(ProductPresenter, product);
  return <h2>{p.title}</h2>;
}
```

`usePresenterMany` is the collection equivalent. Both recompute only
when `data`/`context` (or your own custom `deps` array, passed as a 5th
argument) change.

## Next.js: Server Components & Server Actions

Presenters work directly in Server Components, no client boundary
needed if you're just rendering:

```tsx
// app/products/[id]/page.tsx  (Server Component)
import { ProductPresenter } from "@/presenters/product-presenter";

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);
  const p = ProductPresenter.present(product);
  return (
    <h1>
      {p.title} — {p.formattedPrice}
    </h1>
  );
}
```

If you need to **pass presented data across a server/client boundary**
(props into a Client Component, or a Server Action's return value),
serialize first — the Proxy-wrapped instance itself is not
serializable:

```tsx
// app/products/[id]/page.tsx
const p = ProductPresenter.present(product);
return <ProductCardClient product={p.toJSON()} />; // plain object, safe
```

```ts
// actions/update-user.ts
"use server";
import { UserPresenter } from "@/presenters/user-presenter";

export async function updateUser(id: string, data: FormData) {
  const user = await db.user.update({
    where: { id },
    data: { name: data.get("name") as string },
  });

  // Return only what the client needs, never the raw entity:
  return UserPresenter.present(user).only("id", "fullName", "avatarUrl");
}
```

This is also what makes `toJSON()`/`only()`/`except()` valuable even
outside Next.js: they're a deliberate allowlist between your database
entity and anything that leaves the server.

---

## API reference

### `class Presenter<T, C = Record<string, unknown>>`

| Member                               | Description                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `constructor(data: T, context?: C)`  | Usually called for you via `.present()`.                                                   |
| `this.data: T`                       | The raw entity.                                                                            |
| `this.context: C`                    | Whatever you passed as context (`{}` if omitted).                                          |
| `this.format` _(protected)_          | Intl-backed `{ date, number, currency, relativeTime }`, locale-aware via `context.locale`. |
| `this.t(key, params?)` _(protected)_ | Calls the globally configured `translate` function.                                        |
| `.toJSON(options?)`                  | Plain object of presenter-defined getters only.                                            |
| `.only(...keys)`                     | Shorthand for `toJSON({ only: keys })`.                                                    |
| `.except(...keys)`                   | Shorthand for `toJSON({ except: keys })`.                                                  |
| `.resolve(options?)`                 | `Promise<object>` — awaits every `async` method and merges with `toJSON(options)`.         |

### Static methods

| Method                                                | Description                                                    |
| ----------------------------------------------------- | -------------------------------------------------------------- |
| `Presenter.present(data, context?, options?)`         | Instantiate + wrap in the pass-through Proxy. Returns `P & T`. |
| `Presenter.presentMany(dataList, context?, options?)` | Array version of `present`.                                    |

`options: { memoize?: boolean }` — when `true`, each getter's value is
cached the first time it's read on a given instance (per-property, via
an internal `WeakMap`). Off by default.

### Top-level exports (`react-presenter`)

- `Presenter` — the base class.
- `decorate(data, PresenterClass, context?, options?)` / `decorateMany(...)`
- `configurePresenter({ translate?, locale?, formatters? })`
- `getPresenterConfig()`
- `createFormatAdapter(locale?)` — build a standalone formatter, e.g. for use outside a presenter.
- Types: `PresentOptions`, `ToJSONOptions`, `PresenterConstructor`, `FormatAdapter`, `TranslateFn`, `PresenterGlobalConfig`, `AnyRecord`.

### `react-presenter/react`

- `usePresenter(PresenterClass, data, context?, options?, deps?)`
- `usePresenterMany(PresenterClass, dataList, context?, options?, deps?)`

---

## A note on `async`

The implemented API keeps the spirit of "async computed
property" but as a plain `async` method (no `get`):

```ts
class UserPresenter extends Presenter<User> {
  async profileScore() {
    return calculateScore(this.data);
  }
}
```

`.resolve()` auto-detects every `async` method anywhere on the
presenter's prototype chain (no extra registration/decorator needed),
calls each with no arguments, and merges the resolved values with
`toJSON()`. If one rejects, it resolves to `undefined` in the output
instead of failing the whole call.

---

## Testing

The package ships with a full Vitest suite covering every use case
above: automatic attribute pass-through & override, memoization,
collections & shared context, `toJSON`/`only`/`except`, `resolve()`,
and context-driven authorization/i18n/formatting.

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run build       # tsup → dist/{index,react}.{js,cjs,d.ts}
npm test            # vitest run
```

## License

MIT
