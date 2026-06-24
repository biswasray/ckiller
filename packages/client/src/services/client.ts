// Shared HTTP client. In dev, Vite proxies these paths to the server (see
// vite.config.ts); in production the server serves the client and same-origin
// requests resolve directly. Override the base via VITE_API_BASE_URL if needed.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed: ${response.status}`);
  }
  return (await response.json()) as T;
}
