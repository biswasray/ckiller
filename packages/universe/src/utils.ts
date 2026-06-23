/**
 * Isomorphic utilities — safe to use in both Node.js and the browser.
 * Do NOT import platform-only modules (e.g. `child_process`, `http`) here,
 * or reference platform globals (e.g. `process`, `window`). Put those in the
 * platform-specific entries under `src/platform/*`.
 */

/** Build a friendly greeting. */
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
