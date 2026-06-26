import type { CSSProperties, ReactNode } from "react";
import { useTheme } from "../../../store/hooks";

interface SidebarProps {
  children: ReactNode;
  width?: number;
  style?: CSSProperties;
}

export function Sidebar({ children, width = 260, style }: SidebarProps) {
  const { theme } = useTheme();

  return (
    <aside
      style={{
        width,
        flexShrink: 0,
        height: "100%",
        boxSizing: "border-box",
        padding: theme.spacing.xl,
        background: theme.colors.surface,
        borderRight: `1px solid ${theme.colors.border}`,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column" /* Stack children vertically */,
        rowGap: "20px" /* Adds 20px space only between elements */,
        ...style,
      }}
    >
      {children}
    </aside>
  );
}
