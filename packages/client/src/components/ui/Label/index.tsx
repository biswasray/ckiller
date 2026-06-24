import type { CSSProperties, ReactNode } from "react";
import { useTheme } from "../../../store/hooks";

interface LabelProps {
  children: ReactNode;
  htmlFor?: string;
  /** "muted" renders in the secondary text color, smaller. */
  variant?: "default" | "muted";
  style?: CSSProperties;
}

export function Label({
  children,
  htmlFor,
  variant = "default",
  style,
}: LabelProps) {
  const { theme } = useTheme();
  const muted = variant === "muted";

  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: "block",
        color: muted ? theme.colors.textSecondary : theme.colors.text,
        fontSize: muted
          ? theme.typography.fontSize.sm
          : theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        letterSpacing: 0.2,
        ...style,
      }}
    >
      {children}
    </label>
  );
}
