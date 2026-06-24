---
name: create-type
description: >
  Create or extend TypeScript type/interface definitions organized by entity inside
  an interfaces folder. Use this skill whenever the user asks to "create a type",
  "add an interface", "define types for X", "create the User type", "add auth types",
  or similar requests naming an entity or data shape that needs a TypeScript type.
  Routes each type into a per-entity file (e.g. user.ts, auth.ts, product.ts) inside
  the interfaces folder, falls back to common.ts for generic/shared types like
  ApiResponse or PaginationParams that don't belong to one entity, uses named
  export interface/export type (never default exports), and keeps a barrel index.ts
  exporting every type file with export *. Always use this skill instead of creating
  type files ad hoc or inlining types directly in component/service files.
---

# Create Type

Create TypeScript type/interface definitions, organized per-entity inside the
project's interfaces folder, and keep them registered in a barrel `index.ts`.

---

## Step 1 — Get the Type Request

The user describes what needs typing — an entity name (e.g. "User"), a request/response
shape (e.g. "login request type"), or pastes a data shape directly (e.g. a JSON sample
or existing inline type to extract).

If the request is just an entity name with no shape given (e.g. "create a Product
type"), infer a reasonable shape from context if there's existing code that uses that
entity (e.g. a service call, a component prop, a mock data file) — otherwise ask:
> "What fields should the Product type have?"

---

## Step 2 — Find or Create the Interfaces Folder

Look for an existing types folder, commonly one of: `interfaces/`, `types/`,
`src/interfaces/`, `src/types/`. Use whichever already exists in the project.

If none exists, create `interfaces/` at the project's source root (match wherever
sibling top-level folders like `components/`, `utils/`, `constants/` live) and tell
the user where it was created.

If both `interfaces/` and `types/` exist, ask which one is the canonical one rather
than guessing:
> "I see both interfaces/ and types/ — which one should new types go in?"

---

## Step 3 — Determine the Target Entity File

Map the requested type to an entity file using the **subject of the type**, not its
exact requested name:

- A `User`, `UserRole`, `UserProfile` type → entity is **user** → `user.ts`
- A `LoginRequest`, `LoginResponse`, `AuthState`, `RegisterPayload` type → entity is
  **auth** → `auth.ts`
- A `Product`, `ProductVariant`, `ProductCategory` type → entity is **product** →
  `product.ts`

Filename is the lowercase, singular entity name: `user.ts`, `auth.ts`, `product.ts`
(not `users.ts`, `Auth.ts`, or `products.ts`).

### Generic / shared types → `common.ts`

If the type is generic infrastructure rather than belonging to one entity — e.g.
`ApiResponse<T>`, `PaginatedResponse<T>`, `PaginationParams`, `SortOrder`,
`ErrorResponse`, `Nullable<T>` — put it in `common.ts` instead of forcing it into an
entity file.

Rule of thumb: if the type would be imported by multiple unrelated entity files (e.g.
both `user.ts` and `product.ts` would wrap their list responses in
`PaginatedResponse<T>`), it belongs in `common.ts`.

### Ambiguous entity mapping

If it's genuinely unclear which entity a type belongs to (e.g. a `CheckoutSummary`
type that touches both `Order` and `Product`), ask rather than guessing:
> "Should CheckoutSummary live in order.ts, product.ts, or its own checkout.ts?"

---

## Step 4 — Check for Existing File / Types to Extend

Before writing, check whether the target entity file already exists:

- **If it exists**, read it first. Add the new type(s) to the existing file rather
  than overwriting it, placing the new type near related types if there's a logical
  grouping already (e.g. request/response types kept together).
- Check whether the new type should **extend or reuse** an existing type (e.g. a new
  `UpdateUserPayload` might be `Partial<Pick<User, 'name' | 'email'>>` rather than a
  fully redefined shape). Prefer composition over duplication when a clear base type
  already exists.
- Check `common.ts` for shared primitives (`ID`, `Timestamp`, `Nullable<T>`,
  `PaginatedResponse<T>`, etc.) the new type should reuse instead of redefining.

---

## Step 5 — Write the Type File

Rules:
- **Named exports only** — `export interface Foo { ... }` or `export type Foo = ...`.
  Never `export default`.
- Use `interface` for object shapes that represent an entity/data structure. Use
  `type` for unions, intersections, mapped types, and aliases of primitives/generics.
- If an existing types file in the project already shows a clear preference (e.g.
  everything is `type` even for object shapes), match that established convention
  instead of the default above.
- Keep each entity file focused — don't let unrelated entities leak into it.

```ts
// interfaces/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type UserRole = 'admin' | 'member' | 'guest';

export interface UpdateUserPayload {
  name?: string;
  email?: string;
}
```

```ts
// interfaces/auth.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
```

If `auth.ts` needs `User` from `user.ts`, import it directly rather than duplicating
the shape:

```ts
import { User } from './user';
```

```ts
// interfaces/common.ts
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
```

---

## Step 6 — Register in the Barrel `index.ts`

Find `interfaces/index.ts` (create it if it doesn't exist yet).

Every entity file gets a wildcard re-export, alphabetically ordered unless the
existing file shows a different established order:

```ts
// interfaces/index.ts
export * from './auth';
export * from './common';
export * from './product';
export * from './user';
```

When creating a brand-new entity file, add its line to `index.ts` in the same
operation — don't leave a type file unregistered. When adding types to an
**existing** entity file, no `index.ts` change is needed since it's already exported.

---

## Step 7 — Summary

After creating/updating files, report back concisely:
- Type(s) created and which file they went in
- Whether a new entity file was created or an existing one was extended
- Anything placed in `common.ts` and why
- Any existing types reused/extended rather than duplicated
- Confirmation `index.ts` includes the file (or already did)

---

## Quick Reference

| Requested type | Entity file | Reasoning |
|---|---|---|
| `User`, `UserRole` | `user.ts` | Entity: user |
| `LoginRequest`, `AuthState` | `auth.ts` | Entity: auth |
| `Product`, `ProductVariant` | `product.ts` | Entity: product |
| `ApiResponse<T>`, `PaginationParams` | `common.ts` | Generic, used across entities |
| `CheckoutSummary` (touches Order + Product) | ask user | Ambiguous entity ownership |