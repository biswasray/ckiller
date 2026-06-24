import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useTheme } from "../../../store/hooks";
import { neumorphic } from "../../../utils";

interface CardProps {
  children?: ReactNode;
  onClick?: () => void;
  /** Lift the card on hover (only when interactive). */
  interactive?: boolean;
  style?: CSSProperties;
}

export function Card({ children, onClick, interactive, style }: CardProps) {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState(false);
  const clickable = interactive ?? Boolean(onClick);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...neumorphic(theme, {
          radius: theme.borderRadius.xl,
          distance: clickable && hovered ? 10 : 8,
        }),
        padding: theme.spacing.xl,
        cursor: clickable ? "pointer" : "default",
        transition: "box-shadow 0.15s ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
