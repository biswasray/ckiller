// constants/themes.ts — "shadow" greyscale theme (primary: light grey, secondary: dark grey)

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  surfaceVariantLight: string;
  border: string;
  text: string;
  textSecondary: string;
  textDisabled: string;
  error: string;
  errorLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
  overlay: string;
  shadow: string;
}

export interface Theme {
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  isDark: boolean;
}

// ─── Static tokens (shared between light and dark) ────────────────────────────

export const typography = {
  fontFamily: {
    regular: "System",
    medium: "System",
    semiBold: "System",
    bold: "System",
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semiBold: "600" as const,
    bold: "700" as const,
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
};

export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// ─── Color palettes ───────────────────────────────────────────────────────────

const lightColors: ThemeColors = {
  primary: "#CED4DA",
  primaryLight: "#E9ECEF",
  primaryDark: "#ADB5BD",
  secondary: "#495057",
  secondaryLight: "#6C757D",
  secondaryDark: "#343A40",
  background: "#F8F9FA",
  surface: "#FFFFFF",
  surfaceVariant: "#F1F3F5",
  surfaceVariantLight: "#F1F3F514",
  border: "#DEE2E6",
  text: "#1A1A2E",
  textSecondary: "#6C757D",
  textDisabled: "#ADB5BD",
  error: "#DC3545",
  errorLight: "#DC354514",
  success: "#28A745",
  successLight: "#28A74514",
  warning: "#FFC107",
  warningLight: "#FFC10714",
  info: "#3B82F6",
  infoLight: "#3B82F614",
  overlay: "rgba(0, 0, 0, 0.5)",
  shadow: "rgba(0, 0, 0, 0.1)",
};

const darkColors: ThemeColors = {
  primary: "#CED4DA",
  primaryLight: "#E9ECEF",
  primaryDark: "#ADB5BD",
  secondary: "#6C757D",
  secondaryLight: "#ADB5BD",
  secondaryDark: "#495057",
  background: "#0D1117",
  surface: "#161B22",
  surfaceVariant: "#21262D",
  surfaceVariantLight: "#21262D14",
  border: "#30363D",
  text: "#F0F6FC",
  textSecondary: "#8B949E",
  textDisabled: "#484F58",
  error: "#FF6B6B",
  errorLight: "#FF6B6B14",
  success: "#4ADE80",
  successLight: "#4ADE8014",
  warning: "#FFD60A",
  warningLight: "#FFD60A14",
  info: "#38BDF8",
  infoLight: "#38BDF814",
  overlay: "rgba(0, 0, 0, 0.7)",
  shadow: "rgba(0, 0, 0, 0.4)",
};

// ─── Theme objects ────────────────────────────────────────────────────────────

export const themes = {
  light: {
    colors: lightColors,
    typography,
    spacing,
    borderRadius,
    isDark: false,
  } satisfies Theme,
  dark: {
    colors: darkColors,
    typography,
    spacing,
    borderRadius,
    isDark: true,
  } satisfies Theme,
};

export type ThemeMode = keyof typeof themes; // 'light' | 'dark'
