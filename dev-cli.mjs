#!/usr/bin/env node
import { execSync } from "child_process";

try {
  let cmd = "npm run dev";
  const argv = process.argv;
  switch (argv.find((arg) => arg.toLowerCase())) {
    case "server":
      cmd = "npm run dev:server";
      break;
    case "client":
      cmd = "npm run dev:client";
      break;
  }
  // Enforce running the development script through npm
  execSync(cmd, { stdio: "inherit" });
} catch (error) {
  console.error(error);
  process.exit(1);
}
