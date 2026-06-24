---
name: integrate-api
description: >
  Integrate REST API calls into a project by creating typed service files in a
  services/ folder. Use this skill whenever the user asks to "integrate an API",
  "add an API call", "create a service for users", "add a fetch for products",
  "connect to an endpoint", or any request that involves calling an external or
  internal HTTP API. Detects whether axios or fetch is used from package.json and
  existing code, creates a shared base client in services/client.ts if one does not
  exist, groups related endpoints into one service file per entity (user.ts,
  product.ts, auth.ts), binds methods as either a class with static methods or a
  plain object (asks user or detects from existing services), uses create-type for
  request/response interfaces, uses create-util-and-constant for endpoint constants,
  and detects existing Redux slices to offer automatic wiring via thunks or
  createAsyncThunk. Always use this skill instead of writing API calls inline in
  components or creating service files ad hoc.
---

# Integrate API

Create typed, grouped API service files with a shared base client, and optionally
wire them into existing Redux state.

---

## Step 1 — Understand the Request

The user describes the API to integrate — an endpoint URL, a group of endpoints, or
an entity name (e.g. "add user API", "integrate product endpoints", "add auth service").

Parse from the request:
- **Entity** — the domain the endpoints belong to (user, product, auth, order, etc.)
- **Operations** — the specific calls needed (getAll, getById, create, update, delete,
  login, etc.)
- **Base URL** — if given. If not, check `constants/` or `utils/` for an existing
  base URL or `endpoints` constant. If still not found, ask:
  > "What's the base URL for this API? (e.g. https://api.example.com)"

---

## Step 2 — Detect HTTP Client

Read `package.json` and check for `axios` in dependencies. Then scan existing service
or util files for `import axios` or `fetch(` usage.

| Finding | Client to use |
|---|---|
| `axios` in package.json | **axios** |
| `fetch` used in existing code, no axios | **fetch** |
| Neither found | Ask user (see below) |

If no HTTP client is detected:
> "Should I use axios or the built-in fetch API for requests?"
> 1. axios — interceptors, automatic JSON, better error handling
> 2. fetch — no install needed, built-in

If **axios** is chosen and not installed:
```bash
npm install axios
```

---

## Step 3 — Find or Create `services/` Folder

Check for a `services/` folder at the same level as `components/`, `utils/`,
`constants/` (the project source root). Create it if absent.

Check for a `services/index.ts` barrel file. Create it if absent.

---

## Step 4 — Create or Reuse `services/client.ts`

Check if `services/client.ts` already exists. If it does, read it and use the
existing instance — do not create a second one.

If it doesn't exist, create it now. See `references/client-templates.md` for the
full axios and fetch client templates.

### Axios client (summary)
```ts
// services/client.ts
import axios from 'axios';

export const client = axios.create({
  baseURL: endpoints.BASE_URL,   // from constants/endpoints or constants/config
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach auth token
client.interceptors.request.use((config) => {
  const token = storage.getItem('token'); // from utils/storage if it exists
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — normalise errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // handle 401, 403, network errors centrally
    return Promise.reject(error);
  }
);
```

### Fetch client (summary)
```ts
// services/client.ts
export const client = {
  get: <T>(path: string, headers?: HeadersInit): Promise<T> => request('GET', path, undefined, headers),
  post: <T>(path: string, body: unknown, headers?: HeadersInit): Promise<T> => request('POST', path, body, headers),
  put: <T>(path: string, body: unknown, headers?: HeadersInit): Promise<T> => request('PUT', path, body, headers),
  patch: <T>(path: string, body: unknown, headers?: HeadersInit): Promise<T> => request('PATCH', path, body, headers),
  delete: <T>(path: string, headers?: HeadersInit): Promise<T> => request('DELETE', path, undefined, headers),
};
```

Pull the base URL from `constants/` if the **create-util-and-constant** skill has
already created an `endpoints` or `config` constant. If not, create one now using
that skill's conventions:

```ts
// constants/endpoints.ts
export const endpoints = {
  BASE_URL: 'https://api.example.com',
  users: '/users',
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
  },
};
```

If `utils/storage.ts` exists (from the **create-util-and-constant** skill), import
`storage.getItem` for the token — otherwise read from `AsyncStorage` or `localStorage`
directly and leave a comment to swap once the util is added.

---

## Step 5 — Determine Binding Style

Check existing service files for the binding pattern already in use:

- **Found `export class UserService`** → pattern is **class with static methods**
- **Found `export const userService = {`** → pattern is **object methods**
- **Nothing found** → ask the user:
  > "How would you like to group the API methods?"
  > 1. Class with static methods — `UserService.getAll()`
  > 2. Plain object — `userService.getAll()`

Store this choice — use it consistently for all service files created in this session.

---

## Step 6 — Create the Type Definitions

Use the **create-type skill** to define request/response interfaces for all endpoints
being created. Place them in `interfaces/` following that skill's conventions.

```ts
// interfaces/user.ts (extend existing file if present)

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
}
```

Use `ApiResponse<T>` and `PaginatedResponse<T>` from `interfaces/common.ts` if they
exist (created by the create-type skill) rather than duplicating wrapper shapes.

---

## Step 7 — Create the Entity Service File

Name the file after the entity in lowercase singular: `user.ts`, `auth.ts`,
`product.ts`. Place it in `services/`.

### Class with static methods pattern

```ts
// services/user.ts
import {
  CreateUserPayload,
  UpdateUserPayload,
  User,
  UserListResponse,
} from '../interfaces/user';
import { endpoints } from '../constants/endpoints';
import { client } from './client';

export class UserService {
  static async getAll(): Promise<UserListResponse> {
    const response = await client.get<UserListResponse>(endpoints.users);
    return response.data;           // axios: .data   fetch: response directly
  }

  static async getById(id: string): Promise<User> {
    const response = await client.get<User>(`${endpoints.users}/${id}`);
    return response.data;
  }

  static async create(payload: CreateUserPayload): Promise<User> {
    const response = await client.post<User>(endpoints.users, payload);
    return response.data;
  }

  static async update(id: string, payload: UpdateUserPayload): Promise<User> {
    const response = await client.put<User>(`${endpoints.users}/${id}`, payload);
    return response.data;
  }

  static async remove(id: string): Promise<void> {
    await client.delete(`${endpoints.users}/${id}`);
  }
}
```

### Object methods pattern

```ts
// services/user.ts
import {
  CreateUserPayload,
  UpdateUserPayload,
  User,
  UserListResponse,
} from '../interfaces/user';
import { endpoints } from '../constants/endpoints';
import { client } from './client';

const getAll = async (): Promise<UserListResponse> => {
  const response = await client.get<UserListResponse>(endpoints.users);
  return response.data;
};

const getById = async (id: string): Promise<User> => {
  const response = await client.get<User>(`${endpoints.users}/${id}`);
  return response.data;
};

const create = async (payload: CreateUserPayload): Promise<User> => {
  const response = await client.post<User>(endpoints.users, payload);
  return response.data;
};

const update = async (id: string, payload: UpdateUserPayload): Promise<User> => {
  const response = await client.put<User>(`${endpoints.users}/${id}`, payload);
  return response.data;
};

const remove = async (id: string): Promise<void> => {
  await client.delete(`${endpoints.users}/${id}`);
};

export const userService = { getAll, getById, create, update, remove };
```

### Endpoint path conventions

- List / create: `endpoints.users` → `/users`
- Single item: `` `${endpoints.users}/${id}` `` → `/users/123`
- Nested: `` `${endpoints.users}/${userId}/orders` ``

If the API uses query params (pagination, filters), accept them as an optional
argument:
```ts
static async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<UserListResponse> {
  const response = await client.get<UserListResponse>(endpoints.users, { params });
  return response.data;
}
```

---

## Step 8 — Register in the Services Barrel

Add to `services/index.ts`:

```ts
// services/index.ts
export * from './client';
export * from './user';
export * from './auth';
export * from './product';
```

When adding a new entity file, add its export line in the same operation.

---

## Step 9 — Detect and Offer Redux Integration

### Detection

Scan `src/store/` for existing slice or reducer files. Try to match the service
entity to a slice by name:

| Service file | Likely matching slice |
|---|---|
| `user.ts` | `userSlice.ts`, `usersSlice.ts`, `reducers/userReducer.ts` |
| `auth.ts` | `authSlice.ts`, `reducers/authReducer.ts` |
| `product.ts` | `productSlice.ts`, `productsSlice.ts` |

If a matching slice is found, ask:
> "I found `userSlice.ts` in your store. Should I wire `UserService.getAll()` into
> a `fetchUsers` thunk there?"

If no matching slice is found, ask:
> "No Redux slice found for users. Would you like me to create one using the
> setup-redux skill conventions?"

If the user declines Redux integration, skip to Step 10.

---

### Redux Toolkit — wire into existing slice

Add `createAsyncThunk` calls for each operation the user wants wired. Update the
existing slice to handle the new thunks via `extraReducers`:

```ts
// src/store/userSlice.ts  (additions to existing file)
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { UserService } from '../services/user';
import { User } from '../interfaces/user';

// Add these thunks
export const fetchUsers = createAsyncThunk('users/fetchAll', async () => {
  return UserService.getAll();
});

export const fetchUserById = createAsyncThunk('users/fetchById', async (id: string) => {
  return UserService.getById(id);
});

export const createUser = createAsyncThunk('users/create', async (payload: CreateUserPayload) => {
  return UserService.create(payload);
});

export const updateUser = createAsyncThunk('users/update', async ({ id, payload }: { id: string; payload: UpdateUserPayload }) => {
  return UserService.update(id, payload);
});

export const removeUser = createAsyncThunk('users/remove', async (id: string) => {
  await UserService.remove(id);
  return id;
});

// Extend state shape if needed
interface UserState {
  items: User[];
  selected: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = { items: [], selected: null, loading: false, error: null };

export const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearSelected: (state) => { state.selected = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch users';
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.items.findIndex(u => u.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(removeUser.fulfilled, (state, action) => {
        state.items = state.items.filter(u => u.id !== action.payload);
      });
  },
});

export const { clearSelected } = userSlice.actions;
export const userReducer = userSlice.reducer;
```

### Traditional Redux — wire into existing reducer

Add thunk action creators to `store/actions/userActions.ts` following the same
pattern already in that file, and add the new action type constants to
`store/types/userTypes.ts`.

---

## Step 10 — Summary

After creating all files, report:

- HTTP client detected/chosen and whether axios was installed
- Whether `services/client.ts` was created or reused
- Binding style used (class / object) and how it was determined
- All service files created with their methods
- Types created via create-type skill
- Endpoint constants created or reused from constants/
- Redux wiring: slices found, thunks added, or declined
- Barrel `services/index.ts` updated

Usage example in the summary:

```ts
// Without Redux — call directly from a component or hook
import { UserService } from '../services/user';

const users = await UserService.getAll();
const user = await UserService.getById('123');
await UserService.create({ name: 'Alice', email: 'alice@example.com', password: 'secret' });

// With Redux — dispatch a thunk
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUsers, createUser } from '../store/userSlice';

const dispatch = useAppDispatch();
const { items, loading, error } = useAppSelector(state => state.users);

dispatch(fetchUsers());
dispatch(createUser({ name: 'Alice', email: 'alice@example.com', password: 'secret' }));
```