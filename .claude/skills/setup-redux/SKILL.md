---
name: setup-redux
description: >
  Scaffold a full Redux state management setup for a React or React Native project.
  "create a global state", "add a global state", "add action/reducer", "add a slice", "set up redux-persist", "configure redux-persist", "add persistence to redux", "add redux-persist", "configure redux-persist storage"
  Use this skill whenever the user asks to "set up redux", "add redux", "configure
  redux", "add state management", "create a redux store", or mentions setting up
  thunk/saga/slice. Detects the installed Redux library from package.json to determine
  the setup type (traditional redux-thunk, redux toolkit slice, or redux-saga),
  installs missing packages if needed, creates a todo feature with loading state and
  data fetching from a real API as a working reference implementation, places all store
  files in src/store/, wires up types in interfaces/ if that folder already exists,
  configures redux-persist with a storage engine detected from package.json (ask user
  if ambiguous or missing), generates a PERSIST_WHITELIST-based opt-in config, and
  wraps the app entry point with Provider + PersistGate. Always use this skill
  instead of setting up redux ad hoc.
---

# Setup Redux

Scaffold a complete Redux setup with a working todo state as a reference implementation.

---

## Step 1 — Detect the Redux Setup Type

Read `package.json` dependencies and devDependencies. Detect which Redux libraries
are installed:

| Detected package | Setup type |
|---|---|
| `@reduxjs/toolkit` | **Redux Toolkit (slice)** |
| `redux-saga` | **Redux Saga** |
| `redux` + `redux-thunk` (no toolkit) | **Traditional redux-thunk** |
| `redux` alone (no thunk, no saga, no toolkit) | **Traditional redux-thunk** (thunk is now built into redux v4+) |

If **no Redux-related package is found at all**, ask the user:
> "No Redux library detected. Which setup would you like?"
>
> 1. Redux Toolkit (slice) — recommended, modern, least boilerplate
> 2. Traditional Redux + Thunk — classic pattern
> 3. Redux + Saga — side-effect heavy apps, complex async flows

Install the required packages based on the choice before proceeding (see Step 2).

If **multiple** Redux libraries are found (e.g. both `redux` and `@reduxjs/toolkit`),
prefer `@reduxjs/toolkit` — it supersedes plain `redux` + `redux-thunk`.

---

## Step 2 — Install Missing Packages

For each setup type, ensure the full required package set is installed. Only install
what's missing — don't reinstall packages already in `package.json`.

### Redux Toolkit (slice)
```bash
npm install @reduxjs/toolkit react-redux
```

### Traditional Redux + Thunk
```bash
npm install redux redux-thunk react-redux
```

### Redux Saga
```bash
npm install redux redux-saga react-redux
```

Also install TypeScript types if the project uses TypeScript (detected by presence
of `tsconfig.json` or `.ts`/`.tsx` source files):

```bash
npm install --save-dev @types/react-redux   # if not already present
```

### Persistence packages

Always install `redux-persist`:

```bash
npm install redux-persist
```

Then detect the available storage engine from `package.json` dependencies:

| Detected package | Storage engine |
|---|---|
| `@react-native-async-storage/async-storage` | `AsyncStorage` |
| `react-native-mmkv` | MMKV (synchronous, needs custom adapter) |
| `@react-native-community/async-storage` | `AsyncStorage` (legacy) |

If **more than one** storage library is found, ask:
> "Multiple storage engines detected. Which should redux-persist use?"
> 1. AsyncStorage (`@react-native-async-storage/async-storage`)
> 2. MMKV (`react-native-mmkv`)

If **none** is found, ask:
> "No storage engine found for redux-persist. Which would you like to install?"
> 1. AsyncStorage — standard React Native choice, no native linking required
> 2. MMKV — faster synchronous storage, requires native linking (`npx pod-install` on iOS)

Install any missing storage package before proceeding.

---

## Step 3 — Resolve the Todo Type

The todo state will use this shape, fetched from
`https://jsonplaceholder.typicode.com/todos`:

```ts
interface Todo {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
}
```

**Check whether `interfaces/` (or `types/`) folder exists in the project.** (Same
detection logic as the create-type skill.)

- **If `interfaces/` exists** — create `interfaces/todo.ts` with the `Todo` interface
  and add `export * from './todo'` to `interfaces/index.ts` (following the barrel
  pattern). Import from `interfaces/` in all store files.
- **If no interfaces folder exists** — define the `Todo` interface inline at the top
  of the relevant store file. Don't create an interfaces folder that doesn't exist yet.

---

## Step 4 — Create `src/store/` Structure

Create `src/store/` if it doesn't already exist. The sub-structure differs per setup
type:

### Redux Toolkit (slice)
```
src/store/
  index.ts          ← configureStore, exports RootState + AppDispatch
  todoSlice.ts      ← createSlice with createAsyncThunk
```

### Traditional Redux + Thunk
```
src/store/
  index.ts          ← createStore + applyMiddleware(thunk)
  reducers/
    index.ts        ← combineReducers
    todoReducer.ts  ← todo reducer function
  actions/
    todoActions.ts  ← action creators + thunk action
  types/
    todoTypes.ts    ← action type string constants
```

### Redux Saga
```
src/store/
  index.ts          ← createStore + sagaMiddleware.run(rootSaga)
  reducers/
    index.ts        ← combineReducers
    todoReducer.ts  ← todo reducer function
  sagas/
    index.ts        ← rootSaga (all watchers)
    todoSaga.ts     ← watcher + worker saga for fetch
  actions/
    todoActions.ts  ← action creators
  types/
    todoTypes.ts    ← action type string constants
```

See `references/templates.md` for the full file content for each setup type.

---

## Step 5 — Implement the Todo State

All three setups implement the same observable behavior:

- **State shape**:
  ```ts
  {
    todos: {
      items: Todo[];
      loading: boolean;
      error: string | null;
    }
  }
  ```

- **Actions / triggers**:
  - `FETCH_TODOS_REQUEST` (or equivalent) — sets `loading: true`, clears error
  - `FETCH_TODOS_SUCCESS` — sets `items`, clears `loading`
  - `FETCH_TODOS_FAILURE` — sets `error`, clears `loading`

- **API call**: `GET https://jsonplaceholder.typicode.com/todos`

- **Initial state**:
  ```ts
  { items: [], loading: false, error: null }
  ```

Implement the full async cycle — request, success, failure — for the fetch so
`loading` state is properly exercised. See `references/templates.md` for
implementation details per setup type.

---

## Step 5.5 — Configure Persistence

### Create `src/store/persistConfig.ts`

Generate this file. `PERSIST_WHITELIST` is empty by default — developers add slice
names to opt in to persistence. No slice is persisted until explicitly listed.

**AsyncStorage variant:**
```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PERSIST_WHITELIST: string[] = [
  // Add slice key names here to persist them across app restarts, e.g. 'auth'
];

export const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: PERSIST_WHITELIST,
};
```

**MMKV variant** — generate this instead when MMKV is chosen:
```ts
import { MMKV } from 'react-native-mmkv';
import { Storage } from 'redux-persist';

const mmkv = new MMKV();

export const mmkvStorage: Storage = {
  setItem: (key, value) => { mmkv.set(key, value); return Promise.resolve(true); },
  getItem: (key) => Promise.resolve(mmkv.getString(key)),
  removeItem: (key) => { mmkv.delete(key); return Promise.resolve(); },
};

export const PERSIST_WHITELIST: string[] = [
  // Add slice key names here to persist them, e.g. 'auth'
];

export const persistConfig = {
  key: 'root',
  storage: mmkvStorage,
  whitelist: PERSIST_WHITELIST,
};
```

### Update `src/store/index.ts`

Wrap the root reducer with `persistReducer` and export both `store` and `persistor`.
See `references/templates.md` → **Persistence: Updated `src/store/index.ts`** for the
full file per setup type. Key rules:

- Redux Toolkit: suppress serializable-check warnings for redux-persist's own actions
  (`FLUSH`, `REHYDRATE`, `PAUSE`, `PERSIST`, `PURGE`, `REGISTER`).
- Traditional / Saga: pass `persistedReducer` as the first argument to `createStore`.
- Always `export { store, persistor }` so the Provider step can import both.

---

## Step 6 — Wire Up the Provider

Find the app entry point. Check in this order:
1. `src/App.tsx` / `src/App.ts`
2. `App.tsx` / `App.ts` at root
3. `src/index.tsx` / `src/index.ts`
4. `index.tsx` / `index.ts` at root

Read the file first. Wrap the root component with **both** `<Provider store={store}>`
and `<PersistGate loading={null} persistor={persistor}>`. `PersistGate` must be
a child of `Provider`. `loading={null}` renders nothing while the store is
rehydrating from storage (blank screen, no flash of stale state).

Import `Provider` from `react-redux`, `PersistGate` from
`redux-persist/integration/react`, and both `store` and `persistor` from
`./src/store` (adjust path relative to the entry point).

**Match the existing file style** — if it uses function components, JSX, or specific
import ordering conventions, don't introduce a different style.

Example — before:
```tsx
export default function App() {
  return <NavigationContainer>...</NavigationContainer>;
}
```

After:
```tsx
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NavigationContainer>...</NavigationContainer>
      </PersistGate>
    </Provider>
  );
}
```

If the entry point is ambiguous (e.g. multiple `App.tsx` files at different nesting
levels) or the existing structure makes automatic wrapping risky (e.g. a complex HOC
chain), show the user the snippet and tell them exactly where to add it rather than
editing the file.

---

## Step 7 — Export RootState and AppDispatch (TypeScript only)

If the project uses TypeScript, ensure typed hooks are available. Add to
`src/store/index.ts`:

```ts
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

For Redux Toolkit projects, also create typed hook wrappers (conventional pattern):

```ts
// src/store/hooks.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

## Step 8 — Summary

After scaffolding, report:
- Setup type detected/chosen and packages installed (including redux-persist + storage engine)
- All files created (with their paths)
- Where the `Todo` type lives (interfaces/ or inline)
- That the Provider + PersistGate were added, and to which file
- The storage engine chosen and where its config lives (`src/store/persistConfig.ts`)
- That `PERSIST_WHITELIST` is currently empty — how to add a slice (e.g. add `'auth'` to the array once an auth slice exists)
- A minimal usage example showing how to dispatch the fetch and read the todo state
  from a component

Minimal usage example to include in the summary:

### Redux Toolkit
```tsx
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTodos } from '../store/todoSlice';

const dispatch = useAppDispatch();
const { items, loading, error } = useAppSelector(state => state.todos);
dispatch(fetchTodos());
```

### Traditional Thunk
```tsx
import { useDispatch, useSelector } from 'react-redux';
import { fetchTodos } from '../store/actions/todoActions';

const dispatch = useDispatch();
const { items, loading, error } = useSelector(state => state.todos);
dispatch(fetchTodos());
```

### Redux Saga
```tsx
import { useDispatch, useSelector } from 'react-redux';
import { fetchTodosRequest } from '../store/actions/todoActions';

const dispatch = useDispatch();
const { items, loading, error } = useSelector(state => state.todos);
dispatch(fetchTodosRequest());
```