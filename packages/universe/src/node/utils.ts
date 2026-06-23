import { exec } from "child_process";

/** Open a URL in the user's default browser (Node.js implementation). */
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
