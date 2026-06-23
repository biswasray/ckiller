/// <reference lib="dom" />

/** Open a URL in a new browser tab (browser implementation). */
export function openUrl(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}
