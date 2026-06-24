---
name: create-util-and-constant
description: >
  Create or extend utility functions and constants in a project's utils/ and constants/
  folders. Use this skill whenever the user asks to "create a util", "add a helper",
  "add a constant", "create a storage util", "add date helpers", "extract this to a
  util", or any request to write reusable pure functions or constant values outside
  of components. Detects or creates utils/ and constants/ folders, infers whether the
  code is a one-off (goes in common.ts as a named export) or a cohesive group (gets
  its own dedicated file exported as a named object, e.g. export const storage = {...}),
  checks for duplicate/existing code before creating, and registers everything in a
  barrel index.ts with export *. Always use this skill instead of writing util or
  constant code ad hoc inside component or service files.
---

# Create Util and Constant

Create or extend utility functions and constants, routing each piece of code to the
right file and keeping both folders registered through barrel `index.ts` files.

---

## Step 1 — Understand the Request

The user describes what they need — a function, a group of related functions, a
constant value, or a set of related constants. Parse:

- **What it does** (e.g. format a date, read from AsyncStorage, validate an email)
- **How many related pieces** are involved (single vs. multiple functions/constants
  that belong together)
- **Which folder it belongs in** — `utils/` for functions with logic, `constants/`
  for static values with no logic

If the request is vague (e.g. "add a helper for dates"), ask for enough detail to
write it correctly:
> "What should the date helper do — format, compare, parse, or something else?"

---

## Step 2 — Find or Create the Target Folder

Check whether `utils/` and `constants/` exist. Look at the project's source root —
wherever sibling folders like `components/`, `interfaces/`, `store/` live.

- If `utils/` doesn't exist and the request is for a utility → create it
- If `constants/` doesn't exist and the request is for a constant → create it
- If both are absent, create whichever one(s) are needed

Tell the user when a new folder is created.

---

## Step 3 — Check for Existing Code

Before writing anything, check whether the desired code already exists:

1. **Read the target folder's `index.ts`** (if it exists) to see what's already
   exported.
2. **Read the likely target file** (`common.ts`, or the group file like `storage.ts`,
   `date.ts`) if it exists — scan for existing functions/constants with the same or
   very similar names or behavior.
3. If a duplicate is found, tell the user and ask whether to:
   - **Reuse** the existing code as-is
   - **Extend** it (add a new variant/overload)
   - **Replace** it (rewrite the existing implementation)

Never silently overwrite existing code.

---

## Step 4 — Classify: Common vs. Grouped

Decide whether the new code goes in `common.ts` or a dedicated grouped file by
inferring from the function/constant name and what it does. Use this logic:

### Goes in `common.ts` as a named export when:
- It's a **single, standalone function or constant** with no natural siblings
- It doesn't interact with any specific subsystem or external API
- It would feel orphaned in its own file (e.g. a `capitalize` string helper,
  a `noop` function, an `APP_NAME` constant)

### Gets its own dedicated grouped file when:
- It's **one of several functions that all operate on the same subsystem** or share
  the same domain concern — and more will likely be added over time
- It interacts with a specific external API or platform feature (storage, network,
  file system, notifications, camera, etc.)
- It has a clear, nameable category

Use this mapping to identify the group and filename:

| Function/constant involves... | File |
|---|---|
| `AsyncStorage`, `localStorage`, `SecureStore`, `MMKV` | `storage.ts` |
| `fetch`, `axios`, HTTP requests, base URLs, headers | `api.ts` |
| Date formatting, parsing, comparison, durations | `date.ts` |
| String formatting, truncation, casing, slugify | `string.ts` |
| Number formatting, currency, rounding, math | `number.ts` |
| Validation (email, phone, URL, password rules) | `validation.ts` |
| Navigation params, route helpers | `navigation.ts` |
| Platform detection, device info | `platform.ts` |
| Permissions (camera, location, notifications) | `permissions.ts` |
| File/image picking, MIME types | `file.ts` |
| Color manipulation, hex/rgb conversion | `color.ts` |
| Theme tokens, spacing scale, font sizes | `theme.ts` (constants/) |
| API endpoint strings, route paths | `endpoints.ts` (constants/) |
| App-wide config values, feature flags | `config.ts` (constants/) |
| Environment variables | `env.ts` (constants/) |

If the category is genuinely ambiguous after reading the function name and body,
ask the user:
> "Should this go in an existing file, or does it need its own file (e.g. `crypto.ts`)?"

---

## Step 5 — Write the Code

### Rule: named exports for `common.ts`, object export for grouped files

**`common.ts` — named exports:**
```ts
// utils/common.ts
export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const noop = (): void => {};

export const wait = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));
```

**Grouped file — export as a named object:**
```ts
// utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const setItem = async (key: string, value: string): Promise<void> => {
  await AsyncStorage.setItem(key, value);
};

const getItem = async (key: string): Promise<string | null> => {
  return AsyncStorage.getItem(key);
};

const removeItem = async (key: string): Promise<void> => {
  await AsyncStorage.removeItem(key);
};

const clear = async (): Promise<void> => {
  await AsyncStorage.clear();
};

export const storage = { setItem, getItem, removeItem, clear };
```

```ts
// utils/date.ts
import { format, parseISO, differenceInDays } from 'date-fns'; // if installed, else use Date API

const formatDate = (date: string | Date, pattern = 'MMM dd, yyyy'): string =>
  format(typeof date === 'string' ? parseISO(date) : date, pattern);

const daysBetween = (from: Date, to: Date): number =>
  differenceInDays(to, from);

const isExpired = (date: string | Date): boolean =>
  new Date(date) < new Date();

export const dateUtil = { formatDate, daysBetween, isExpired };
```

```ts
// constants/endpoints.ts
const BASE_URL = 'https://api.example.com';

export const endpoints = {
  todos: `${BASE_URL}/todos`,
  users: `${BASE_URL}/users`,
  auth: {
    login: `${BASE_URL}/auth/login`,
    logout: `${BASE_URL}/auth/logout`,
    refresh: `${BASE_URL}/auth/refresh`,
  },
};
```

### General rules
- **No default exports** — ever. Only named exports (`export const`, `export function`,
  `export type`, `export interface`).
- **Object wrapper name matches the file name** — `storage.ts` → `export const storage`,
  `date.ts` → `export const dateUtil` (append `Util` if the raw name clashes with a
  built-in or imported symbol).
- **Pure functions where possible** — no side effects in utils unless the utility's
  entire purpose is a side effect (e.g. `storage`, `logger`).
- **Types inline in the file** — if a util function needs a type that isn't defined
  elsewhere, define it in the same file. If `interfaces/` exists and the type is
  entity-level (e.g. a `StorageKey` enum that other files will import), add it there
  via the create-type convention instead.
- **If adding to an existing grouped file**, append the new function(s) to the private
  implementations above the object export, then add the new name(s) to the exported
  object.

---

## Step 6 — Register in the Barrel `index.ts`

Each folder (`utils/` and `constants/`) has its own `index.ts`. Create it if it
doesn't exist yet.

Use wildcard re-exports, alphabetically ordered:

```ts
// utils/index.ts
export * from './common';
export * from './date';
export * from './storage';
export * from './string';
export * from './validation';
```

```ts
// constants/index.ts
export * from './common';
export * from './config';
export * from './endpoints';
export * from './env';
```

When adding a **new file**, add its line to `index.ts` in the same operation.
When adding to an **existing file**, no `index.ts` change is needed — it's already
exported.

---

## Step 7 — Summary

After creating/updating files, report concisely:
- What was created or extended (function/constant names)
- Which file it went in and why (common.ts vs grouped — single vs. multiple, inferred
  category)
- Whether a new folder or file was created, or an existing one was extended
- Any duplicate code detected and how it was handled
- Confirmation `index.ts` includes the file (or already did)
- A brief usage example:

```ts
// Grouped util
import { storage } from '../utils/storage';
await storage.setItem('token', 'abc123');
const token = await storage.getItem('token');

// Common util
import { capitalize } from '../utils/common';
capitalize('hello'); // 'Hello'

// Constant
import { endpoints } from '../constants/endpoints';
fetch(endpoints.todos);
```