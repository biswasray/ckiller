import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useTheme } from "../../../store/hooks";
import { neumorphic } from "../../../utils";

interface IconButtonProps {
  children: ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  title?: string;
  size?: number;
  style?: CSSProperties;
}

export function IconButton({
  children,
  onClick,
  ariaLabel,
  title,
  size = 30,
  style,
}: IconButtonProps) {
  const { theme } = useTheme();
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      // Stop card-drag (pointer) and canvas (click) handlers from firing.
      onPointerDown={(e) => {
        e.stopPropagation();
        setPressed(true);
      }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{
        ...neumorphic(theme, {
          radius: theme.borderRadius.sm,
          distance: 3,
          pressed,
        }),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        padding: 0,
        border: "none",
        cursor: "pointer",
        color: theme.colors.textSecondary,
        transition: "box-shadow 0.1s ease, color 0.1s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
