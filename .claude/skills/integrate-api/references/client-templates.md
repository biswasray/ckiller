# HTTP Client Templates

Full boilerplate for axios and fetch base clients.

---

## Axios Client — `services/client.ts`

```ts
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { endpoints } from '../constants/endpoints';  // adjust path if needed

// ─── Instance ─────────────────────────────────────────────────────────────────

export const client = axios.create({
  baseURL: endpoints.BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request interceptor ──────────────────────────────────────────────────────

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Token: pull from storage util if it exists, else localStorage/AsyncStorage
    // import { storage } from '../utils/storage';
    // const token = await storage.getItem('token');
    const token = null; // replace with actual token retrieval
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response interceptor ─────────────────────────────────────────────────────

client.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 — token expired, attempt refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // const newToken = await AuthService.refresh();
        // storage.setItem('token', newToken);
        // originalRequest.headers.Authorization = `Bearer ${newToken}`;
        // return client(originalRequest);
      } catch {
        // refresh failed — redirect to login or clear session
      }
    }

    // 403 — forbidden
    if (error.response?.status === 403) {
      console.warn('Access forbidden');
    }

    // 500 — server error
    if (error.response?.status && error.response.status >= 500) {
      console.error('Server error', error.response.status);
    }

    return Promise.reject(error);
  }
);

// ─── Typed error helper ───────────────────────────────────────────────────────

export const isAxiosError = (error: unknown): error is AxiosError =>
  axios.isAxiosError(error);

export const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message ?? 'Unknown error';
  }
  if (error instanceof Error) return error.message;
  return 'Unknown error';
};
```

---

## Fetch Client — `services/client.ts`

```ts
import { endpoints } from '../constants/endpoints';  // adjust path if needed

// ─── Token retrieval ──────────────────────────────────────────────────────────

const getToken = (): string | null => {
  // Replace with storage util call if available:
  // import { storage } from '../utils/storage';
  // return storage.getItem('token');
  return null;
};

// ─── Base request ─────────────────────────────────────────────────────────────

const request = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  extraHeaders?: HeadersInit
): Promise<T> => {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };

  const response = await fetch(`${endpoints.BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = `${method} ${path} failed: ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) message = data.message;
    } catch {
      // non-JSON error body
    }
    throw new Error(message);
  }

  // 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
};

// ─── Client object ────────────────────────────────────────────────────────────

export const client = {
  get: <T>(path: string, headers?: HeadersInit): Promise<T> =>
    request<T>('GET', path, undefined, headers),

  post: <T>(path: string, body: unknown, headers?: HeadersInit): Promise<T> =>
    request<T>('POST', path, body, headers),

  put: <T>(path: string, body: unknown, headers?: HeadersInit): Promise<T> =>
    request<T>('PUT', path, body, headers),

  patch: <T>(path: string, body: unknown, headers?: HeadersInit): Promise<T> =>
    request<T>('PATCH', path, body, headers),

  delete: <T>(path: string, headers?: HeadersInit): Promise<T> =>
    request<T>('DELETE', path, undefined, headers),
};

// ─── Error helper ─────────────────────────────────────────────────────────────

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return 'Unknown error';
};
```

---

## Auth Service — `services/auth.ts` (common pattern)

### Class pattern
```ts
import { client } from './client';
import { endpoints } from '../constants/endpoints';
import { LoginRequest, LoginResponse } from '../interfaces/auth';

export class AuthService {
  static async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await client.post<LoginResponse>(endpoints.auth.login, payload);
    return response.data; // axios; fetch client returns directly
  }

  static async logout(): Promise<void> {
    await client.post(endpoints.auth.logout, {});
  }

  static async refresh(): Promise<string> {
    const response = await client.post<{ token: string }>(endpoints.auth.refresh, {});
    return response.data.token;
  }
}
```

### Object pattern
```ts
import { client } from './client';
import { endpoints } from '../constants/endpoints';
import { LoginRequest, LoginResponse } from '../interfaces/auth';

const login = async (payload: LoginRequest): Promise<LoginResponse> => {
  const response = await client.post<LoginResponse>(endpoints.auth.login, payload);
  return response.data;
};

const logout = async (): Promise<void> => {
  await client.post(endpoints.auth.logout, {});
};

const refresh = async (): Promise<string> => {
  const response = await client.post<{ token: string }>(endpoints.auth.refresh, {});
  return response.data.token;
};

export const authService = { login, logout, refresh };
```

---

## Product Service — `services/product.ts`

### Object pattern with query params
```ts
import { client } from './client';
import { endpoints } from '../constants/endpoints';
import { Product, CreateProductPayload, UpdateProductPayload } from '../interfaces/product';
import { PaginatedResponse, PaginationParams } from '../interfaces/common';

const getAll = async (params?: PaginationParams): Promise<PaginatedResponse<Product>> => {
  const response = await client.get<PaginatedResponse<Product>>(
    `${endpoints.products}?page=${params?.page ?? 1}&limit=${params?.limit ?? 20}`
  );
  return response.data;
};

const getById = async (id: string): Promise<Product> => {
  const response = await client.get<Product>(`${endpoints.products}/${id}`);
  return response.data;
};

const create = async (payload: CreateProductPayload): Promise<Product> => {
  const response = await client.post<Product>(endpoints.products, payload);
  return response.data;
};

const update = async (id: string, payload: UpdateProductPayload): Promise<Product> => {
  const response = await client.put<Product>(`${endpoints.products}/${id}`, payload);
  return response.data;
};

const remove = async (id: string): Promise<void> => {
  await client.delete(`${endpoints.products}/${id}`);
};

export const productService = { getAll, getById, create, update, remove };
```

---

## Traditional Redux wiring (non-toolkit)

When the project uses plain redux + thunk (no `@reduxjs/toolkit`), add thunks to
the existing actions file:

```ts
// store/actions/userActions.ts  (additions)
import { Dispatch } from 'redux';
import { UserService } from '../../services/user';
import {
  FETCH_USERS_REQUEST,
  FETCH_USERS_SUCCESS,
  FETCH_USERS_FAILURE,
  CREATE_USER_SUCCESS,
} from '../types/userTypes';

export const fetchUsers = () => async (dispatch: Dispatch) => {
  dispatch({ type: FETCH_USERS_REQUEST });
  try {
    const data = await UserService.getAll();
    dispatch({ type: FETCH_USERS_SUCCESS, payload: data.items });
  } catch (err) {
    dispatch({ type: FETCH_USERS_FAILURE, payload: err instanceof Error ? err.message : 'Error' });
  }
};

export const createUser = (payload: CreateUserPayload) => async (dispatch: Dispatch) => {
  try {
    const user = await UserService.create(payload);
    dispatch({ type: CREATE_USER_SUCCESS, payload: user });
  } catch (err) {
    // handle error
  }
};
```

---

## Services barrel — `services/index.ts`

```ts
// services/index.ts
export * from './client';
export * from './auth';
export * from './product';
export * from './user';
```

Always keep alphabetical order. Add new service exports in the same operation as
the service file creation.