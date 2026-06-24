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
  style?: CSSProperties;
}

export function TextInput({
  value,
  onChange,
  placeholder,
  id,
  type = "text",
  disabled = false,
  style,
}: TextInputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

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
      style={{
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
      }}
    />
  );
}
