import { useTheme } from "../../../store/hooks";
import { Button } from "../Button";
import { TextInput } from "../TextInput";
import { SelectIcon } from "../icons";

interface HeaderProps {
  title: string;
  onTitleChange: (value: string) => void;
  onRun?: () => void;
  /** Whether the marquee selection tool is currently active. */
  selectActive?: boolean;
  onToggleSelect?: () => void;
}

export function Header({
  title,
  onTitleChange,
  onRun,
  selectActive = false,
  onToggleSelect,
}: HeaderProps) {
  const { theme, mode, toggleTheme } = useTheme();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: theme.spacing.lg,
        padding: `${theme.spacing.md}px ${theme.spacing.xl}px`,
        background: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
      }}
    >
      <TextInput
        value={title}
        onChange={onTitleChange}
        placeholder="Unnamed"
        style={{ maxWidth: 320, fontWeight: theme.typography.fontWeight.bold }}
      />
      <div style={{ flex: 1 }} />
      <Button
        onClick={onToggleSelect}
        style={
          selectActive
            ? {
                color: theme.colors.info,
                boxShadow: `inset 0 0 0 2px ${theme.colors.info}`,
              }
            : undefined
        }
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing.sm,
          }}
        >
          <SelectIcon /> Select
        </span>
      </Button>
      <Button onClick={toggleTheme}>{mode === "dark" ? "☀ Light" : "🌙 Dark"}</Button>
      <Button variant="primary" onClick={onRun}>
        Run
      </Button>
    </header>
  );
}
