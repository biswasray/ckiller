import { exec } from "child_process";

/** Build a friendly greeting. */
export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export function openUrl(url: string): void {
  switch (process.platform) {
    case "darwin": // macOS
      exec(`open "${url}"`);
      break;
    case "win32": // Windows
      exec(`start "" "${url}"`);
      break;
    default: // Linux and others
      exec(`xdg-open "${url}"`);
      break;
  }
}
