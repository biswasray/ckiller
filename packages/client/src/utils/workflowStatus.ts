import type { Theme } from "../constants/themes";
import type { WorkflowStatus } from "../store/workflowSlice";

interface StatusPalette {
  /** Strong color for strokes/borders. */
  accent: string;
  /** Soft tint for fills/backgrounds. */
  fill: string;
}

/**
 * Map a node/group execution status to theme-driven colors:
 * idle → grey, running → blue, success → green, failed → red.
 * Unknown/missing status falls back to idle (keeps old persisted data safe).
 */
export function statusPalette(
  theme: Theme,
  status: WorkflowStatus | undefined,
): StatusPalette {
  const { colors } = theme;
  switch (status) {
    case "running":
      return { accent: colors.info, fill: colors.infoLight };
    case "success":
      return { accent: colors.success, fill: colors.successLight };
    case "failed":
      return { accent: colors.error, fill: colors.errorLight };
    case "idle":
    default:
      return { accent: colors.textSecondary, fill: colors.surfaceVariantLight };
    // return { accent: colors.border, fill: colors.surfaceVariant };
  }
}

export function setAlpha(color: string, alpha: number): string {
  // Clean the string by removing extra spaces and forcing lowercase
  const cleanColor = color.trim().toLowerCase();

  let r = 0,
    g = 0,
    b = 0;

  // 1. Match Hexadecimal (#fff, #ffffff, #ffffffff)
  if (cleanColor.startsWith("#")) {
    const hex = cleanColor.slice(1);

    if (hex.length === 3 || hex.length === 4) {
      // Shorthand hex (e.g., "fff" or "fffa")
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6 || hex.length === 8) {
      // Standard hex (e.g., "ffffff" or "ffffffaa")
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else {
      throw new Error("Invalid Hex color format");
    }
  }
  // 2. Match RGB or RGBA functional notation
  else if (cleanColor.startsWith("rgb")) {
    // Regex extracts all numbers/decimals inside the parentheses
    const matches = cleanColor.match(/[\d.]+/g);

    if (matches && matches.length >= 3) {
      r = parseInt(matches[0], 10);
      g = parseInt(matches[1], 10);
      b = parseInt(matches[2], 10);
    } else {
      throw new Error("Invalid RGB/RGBA color format");
    }
  } else {
    throw new Error("Unsupported color format. Use Hex, RGB, or RGBA.");
  }

  // Return the newly constructed RGBA string
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
