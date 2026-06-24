import type { CSSProperties } from "react";
import type { Theme } from "../constants/themes";

interface NeuOptions {
  /** Border radius in px. Defaults to theme.borderRadius.lg. */
  radius?: number;
  /** Shadow offset/blur scale in px. Larger = more pronounced. */
  distance?: number;
  /** Inset (pressed/engraved) instead of raised/extruded. */
  pressed?: boolean;
  /** Flat surface with no raised shadow (used for inputs at rest). */
  flat?: boolean;
}

/**
 * Build a neumorphic surface style: a soft UI look where elements appear
 * extruded from (or pressed into) the background using paired light + dark
 * shadows that share the surface color. Adapts automatically to light/dark.
 */
export function neumorphic(theme: Theme, opts: NeuOptions = {}): CSSProperties {
  const {
    radius = theme.borderRadius.lg,
    distance = 8,
    pressed = false,
    flat = false,
  } = opts;

  const blur = distance * 2;
  const dark = theme.isDark ? "rgba(0, 0, 0, 0.55)" : "rgba(163, 177, 198, 0.55)";
  const light = theme.isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.9)";

  const raised = `${distance}px ${distance}px ${blur}px ${dark}, -${distance}px -${distance}px ${blur}px ${light}`;
  const inset = `inset ${distance}px ${distance}px ${blur}px ${dark}, inset -${distance}px -${distance}px ${blur}px ${light}`;

  return {
    background: theme.colors.surfaceVariant,
    borderRadius: radius,
    boxShadow: flat ? "none" : pressed ? inset : raised,
  };
}
