import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useTheme } from "../../../store/hooks";
import { neumorphic } from "../../../utils";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  /** "primary" tints the label with the secondary (dark grey) accent. */
  variant?: "default" | "primary";
  disabled?: boolean;
  style?: CSSProperties;
}

export function Button({
  children,
  onClick,
  variant = "default",
  disabled = false,
  style,
}: ButtonProps) {
  const { theme } = useTheme();
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        ...neumorphic(theme, {
          radius: theme.borderRadius.md,
          distance: 5,
          pressed: pressed && !disabled,
        }),
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        padding: `${theme.spacing.sm}px ${theme.spacing.xl}px`,
        color:
          variant === "primary"
            ? theme.colors.secondary
            : theme.colors.textSecondary,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        transition: "box-shadow 0.1s ease, color 0.1s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
