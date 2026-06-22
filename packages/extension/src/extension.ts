import * as vscode from "vscode";
import { APP_NAME, greet } from "@ckiller/universe";

/**
 * Called when the extension is activated.
 * Activation is triggered by the commands declared in package.json.
 */
export function activate(context: vscode.ExtensionContext): void {
  const runCommand = vscode.commands.registerCommand("ckiller.run", () => {
    vscode.window.showInformationMessage(`${APP_NAME}: ${greet("Subagent")}`);
  });

  context.subscriptions.push(runCommand);
}

/**
 * Called when the extension is deactivated.
 */
export function deactivate(): void {
  // no-op
}
