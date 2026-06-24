import { useTheme } from "../../../store/hooks";
import { Button } from "../Button";
import { TextInput } from "../TextInput";

interface HeaderProps {
  title: string;
  onTitleChange: (value: string) => void;
  onRun?: () => void;
}

export function Header({ title, onTitleChange, onRun }: HeaderProps) {
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
      <Button onClick={toggleTheme}>{mode === "dark" ? "☀ Light" : "🌙 Dark"}</Button>
      <Button variant="primary" onClick={onRun}>
        Run
      </Button>
    </header>
  );
}
