import { useState } from "react";
import type { CSSProperties } from "react";
import { useTheme } from "../../../store/hooks";
import { neumorphic } from "../../../utils";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  type?: "text" | "search";
  disabled?: boolean;
  /** Render a multi-line <textarea> instead of a single-line <input>. */
  multiline?: boolean;
  /** Visible rows when multiline (default 3). */
  rows?: number;
  style?: CSSProperties;
}

export function TextInput({
  value,
  onChange,
  placeholder,
  id,
  type = "text",
  disabled = false,
  multiline = false,
  rows = 3,
  style,
}: TextInputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  const sharedStyle: CSSProperties = {
    ...neumorphic(theme, {
      radius: theme.borderRadius.md,
      distance: focused ? 4 : 3,
      pressed: true,
    }),
    border: "none",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    padding: `${theme.spacing.sm}px ${theme.spacing.lg}px`,
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    transition: "box-shadow 0.15s ease",
    ...style,
  };

  if (multiline) {
    return (
      <textarea
        id={id}
        value={value}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...sharedStyle,
          resize: "vertical",
          fontFamily: "inherit",
          lineHeight: theme.typography.lineHeight.normal,
        }}
      />
    );
  }

  return (
    <input
      id={id}
      type={type}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={sharedStyle}
    />
  );
}
