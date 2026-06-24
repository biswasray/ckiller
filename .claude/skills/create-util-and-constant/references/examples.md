# Util & Constant Examples

Extended examples for common grouped files. Use these as the reference when
scaffolding each category.

---

## utils/api.ts
```ts
const BASE_URL = process.env.API_URL ?? 'https://api.example.com';

const get = async <T>(path: string, headers?: HeadersInit): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`);
  return response.json() as Promise<T>;
};

const post = async <T>(path: string, body: unknown, headers?: HeadersInit): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`POST ${path} failed: ${response.status}`);
  return response.json() as Promise<T>;
};

const put = async <T>(path: string, body: unknown, headers?: HeadersInit): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`PUT ${path} failed: ${response.status}`);
  return response.json() as Promise<T>;
};

const del = async <T>(path: string, headers?: HeadersInit): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  if (!response.ok) throw new Error(`DELETE ${path} failed: ${response.status}`);
  return response.json() as Promise<T>;
};

export const api = { get, post, put, delete: del };
```

---

## utils/validation.ts
```ts
const isEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isPhone = (value: string): boolean =>
  /^\+?[\d\s\-().]{7,15}$/.test(value);

const isUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const isStrongPassword = (value: string): boolean =>
  value.length >= 8 &&
  /[A-Z]/.test(value) &&
  /[a-z]/.test(value) &&
  /\d/.test(value);

const isRequired = (value: unknown): boolean =>
  value !== null && value !== undefined && value !== '';

export const validation = { isEmail, isPhone, isUrl, isStrongPassword, isRequired };
```

---

## utils/string.ts
```ts
const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const truncate = (str: string, maxLength: number, suffix = '...'): string =>
  str.length <= maxLength ? str : str.slice(0, maxLength - suffix.length) + suffix;

const slugify = (str: string): string =>
  str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

const toTitleCase = (str: string): string =>
  str.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

const stripHtml = (str: string): string => str.replace(/<[^>]*>/g, '');

export const stringUtil = { capitalize, truncate, slugify, toTitleCase, stripHtml };
```

---

## utils/number.ts
```ts
const formatCurrency = (amount: number, currency = 'USD', locale = 'en-US'): string =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);

const formatCompact = (value: number): string =>
  new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value);

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const toFixed = (value: number, decimals = 2): number =>
  Number(value.toFixed(decimals));

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const numberUtil = { formatCurrency, formatCompact, clamp, toFixed, randomInt };
```

---

## utils/platform.ts (React Native)
```ts
import { Dimensions, Platform } from 'react-native';

const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const isSmallScreen = (): boolean => SCREEN_WIDTH < 375;
const isTablet = (): boolean => SCREEN_WIDTH >= 768;

const select = <T>(options: { ios: T; android: T }): T =>
  Platform.select(options) as T;

export const platform = {
  isIOS,
  isAndroid,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  isSmallScreen,
  isTablet,
  select,
};
```

---

## constants/config.ts
```ts
export const config = {
  appName: 'MyApp',
  version: '1.0.0',
  supportEmail: 'support@example.com',
  privacyPolicyUrl: 'https://example.com/privacy',
  termsUrl: 'https://example.com/terms',
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  timeouts: {
    apiRequest: 30_000,
    splash: 2_000,
  },
};
```

---

## constants/env.ts
```ts
// For React Native (Expo):
import Constants from 'expo-constants';

export const env = {
  apiUrl: Constants.expoConfig?.extra?.apiUrl ?? 'https://api.example.com',
  environment: Constants.expoConfig?.extra?.environment ?? 'development',
  isDevelopment: Constants.expoConfig?.extra?.environment === 'development',
  isProduction: Constants.expoConfig?.extra?.environment === 'production',
};

// For plain React (CRA/Vite):
// export const env = {
//   apiUrl: import.meta.env.VITE_API_URL ?? 'https://api.example.com',
//   environment: import.meta.env.MODE,
//   isDevelopment: import.meta.env.DEV,
//   isProduction: import.meta.env.PROD,
// };
```

---

## utils/common.ts (single one-off helpers)
```ts
export const noop = (): void => {};

export const wait = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

export const isNonEmptyArray = <T>(arr: T[] | null | undefined): arr is T[] =>
  Array.isArray(arr) && arr.length > 0;

export const deepClone = <T>(obj: T): T =>
  JSON.parse(JSON.stringify(obj));

export const generateId = (): string =>
  Math.random().toString(36).slice(2, 11);
```

---

## Adding to an existing grouped file

When the user requests a new function that belongs to an already-existing grouped
file (e.g. adding `clearAll` to `storage.ts`):

1. Read the existing file top to bottom
2. Add the new private function implementation ABOVE the existing `export const` line
3. Add the new function name to the exported object

Before:
```ts
const setItem = async (...) => { ... };
const getItem = async (...) => { ... };

export const storage = { setItem, getItem };
```

After:
```ts
const setItem = async (...) => { ... };
const getItem = async (...) => { ... };
const clearAll = async (): Promise<void> => {
  await AsyncStorage.clear();
};

export const storage = { setItem, getItem, clearAll };
```

Never change the exported object name. Never reorganize existing code unless asked.