import { exec } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

function getRootPath(inputPath: string) {
  // Normalize path separators to work cross-platform
  const normalizedPath = inputPath.split(path.sep).join("/");
  const marker = "/packages/server";
  const markerIndex = normalizedPath.indexOf(marker);

  // If marker not found, path is already the root — do nothing
  if (markerIndex === -1) return inputPath;

  const rootPath = normalizedPath.slice(0, markerIndex);

  // Convert back to platform-specific separators
  return rootPath.split("/").join(path.sep);
}
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

/**
 * Prints all Claude Code skills found in:
 *   - the project (root) folder:  <cwd>/.claude/skills
 *   - the global folder:          ~/.claude/skills
 *
 * A skill is any sub-folder containing a SKILL.md file with YAML frontmatter
 * (name + description). Usage: node listSkills.js
 */

const localPath = getRootPath(process.cwd());

/** Locations to scan, in priority order. */
const SKILL_DIRS = [
  {
    label: "Root (project) skills",
    dir: path.join(localPath, ".claude", "skills"),
  },
  { label: "Global skills", dir: path.join(os.homedir(), ".claude", "skills") },
];

/** Pull the `name` and `description` out of a SKILL.md frontmatter block. */
function parseFrontmatter(content: string) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const body = match[1];
  const get = (key: string) => {
    // Handle both inline (`key: value`) and folded (`key: >`) YAML scalars.
    const inline = body.match(new RegExp(`^${key}:[ \\t]+([^>|\\s].*)$`, "m"));
    if (inline) return inline[1].trim().replace(/^["']|["']$/g, "");

    const folded = body.match(
      new RegExp(`^${key}:\\s*[>|][\\s\\S]*?\\n([\\s\\S]*?)(?:\\n\\S|$)`, "m"),
    );
    if (folded) {
      return folded[1]
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join(" ");
    }
    return undefined;
  };

  return { name: get("name"), description: get("description") };
}

/** Return a list of skills discovered in a single skills directory. */
function readSkills(dir: string) {
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const skillFile = path.join(dir, entry.name, "SKILL.md");
      if (!fs.existsSync(skillFile)) return null;

      const { name, description } = parseFrontmatter(
        fs.readFileSync(skillFile, "utf8"),
      );
      return {
        name: name || entry.name,
        description: description || "(no description)",
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.name.localeCompare(b!.name ?? "")) as {
    name: string;
    description: string;
  }[];
}

export function getSkills(type: "local" | "global") {
  const skillDir = type === "global" ? SKILL_DIRS[1] : SKILL_DIRS[0];
  const skills = readSkills(skillDir.dir);
  return {
    ...skillDir,
    skills,
  };
}

export function getAllSkills() {
  return [getSkills("local"), getSkills("global")];
}
