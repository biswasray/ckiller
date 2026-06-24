---
name: setup-theme
description: >
  Scaffold a complete theme system for a React or React Native project. Use this skill
  whenever the user asks to "set up a theme", "add dark mode", "create a theme system",
  "add a color palette", "set up light and dark themes", or wants to centralise design
  tokens (colors, typography, spacing, border radius). Asks the user for primary and
  secondary colors and suggests a full complementary palette for light and dark modes.
  Detects the styling approach from package.json (React Native StyleSheet,
  styled-components, or emotion), detects whether Redux or Context API is already in
  use and wires the theme switcher accordingly, always scaffolds themes in pairs
  (light + dark), places everything in constants/themes.ts following the
  create-util-and-constant convention, and registers the file in constants/index.ts.
  Always use this skill instead of creating theme files ad hoc.
---

# Setup Theme

Scaffold a full theme system with light/dark mode, all design token categories, and
a theme switcher wired to the project's existing state management approach.

---

## Step 1 — Detect the Styling Approach

Read `package.json`. Check for:

| Package found | Styling approach |
|---|---|
| `styled-components` | styled-components theming (`ThemeProvider`) |
| `@emotion/react` or `@emotion/native` | Emotion theming (`ThemeProvider`) |
| Neither | React Native `StyleSheet` (plain token objects) |

If **no** styling library is found but the project is a web React project (no
`react-native` in package.json), ask:
> "No styling library detected. Which would you like to use for theming?"
> 1. Plain CSS variables / token objects (no library)
> 2. styled-components
> 3. Emotion

For React Native projects with no styling library, default to plain token objects
consumed via `StyleSheet` — do not ask.

---

## Step 2 — Ask for Brand Colors

Ask the user for two brand colors:
> "What are your primary and secondary brand colors? (hex values, e.g. #6C63FF and #FF6584)"

If the user provides only one color, derive a complementary secondary using a 150°
hue rotation on the HSL wheel.

If the user provides neither (e.g. "just suggest something"), generate a modern
default palette — e.g. a blue-purple primary `#6C63FF` with a coral secondary
`#FF6584`.

---

## Step 3 — Generate the Full Color Palette

From the two brand colors, derive a complete, accessible color set for both light
and dark modes. Use the following derivation rules:

### Light theme color derivation

| Token | Rule |
|---|---|
| `primary` | User's primary color as-is |
| `primaryLight` | Primary at 80% saturation, 85% lightness |
| `primaryDark` | Primary at 90% saturation, 35% lightness |
| `secondary` | User's secondary color as-is |
| `secondaryLight` | Secondary at 80% saturation, 85% lightness |
| `secondaryDark` | Secondary at 90% saturation, 35% lightness |
| `background` | Near-white: `#F8F9FA` |
| `surface` | White: `#FFFFFF` |
| `surfaceVariant` | Light grey: `#F1F3F5` |
| `border` | Soft grey: `#DEE2E6` |
| `text` | Near-black: `#1A1A2E` |
| `textSecondary` | Medium grey: `#6C757D` |
| `textDisabled` | Light grey: `#ADB5BD` |
| `error` | Red: `#DC3545` |
| `errorLight` | Light red: `#F8D7DA` |
| `success` | Green: `#28A745` |
| `successLight` | Light green: `#D4EDDA` |
| `warning` | Amber: `#FFC107` |
| `warningLight` | Light amber: `#FFF3CD` |
| `info` | Blue: `#17A2B8` |
| `infoLight` | Light blue: `#D1ECF1` |
| `overlay` | `rgba(0, 0, 0, 0.5)` |
| `shadow` | `rgba(0, 0, 0, 0.1)` |

### Dark theme color derivation

| Token | Rule |
|---|---|
| `primary` | User's primary at 90% saturation, 65% lightness (brighten for dark bg) |
| `primaryLight` | Primary at 70% saturation, 80% lightness |
| `primaryDark` | Primary at 95% saturation, 45% lightness |
| `secondary` | User's secondary at 90% saturation, 65% lightness |
| `secondaryLight` | Secondary at 70% saturation, 80% lightness |
| `secondaryDark` | Secondary at 95% saturation, 45% lightness |
| `background` | Very dark: `#0D1117` |
| `surface` | Dark card: `#161B22` |
| `surfaceVariant` | Slightly lighter: `#21262D` |
| `border` | Dark border: `#30363D` |
| `text` | Near-white: `#F0F6FC` |
| `textSecondary` | Muted: `#8B949E` |
| `textDisabled` | Dim: `#484F58` |
| `error` | Brightened red: `#FF6B6B` |
| `errorLight` | Dark red bg: `#3D1A1A` |
| `success` | Brightened green: `#4ADE80` |
| `successLight` | Dark green bg: `#1A3D2B` |
| `warning` | Brightened amber: `#FFD60A` |
| `warningLight` | Dark amber bg: `#3D3000` |
| `info` | Brightened blue: `#38BDF8` |
| `infoLight` | Dark blue bg: `#0C2D3D` |
| `overlay` | `rgba(0, 0, 0, 0.7)` |
| `shadow` | `rgba(0, 0, 0, 0.4)` |

Show the user a preview of the generated palette before writing any files:
> "Here's your generated palette — let me know if you'd like to adjust any colors
> before I create the files."
>
> Primary: #6C63FF → light: #B8B4FF / dark: #8B7FFF
> Secondary: #FF6584 → light: #FFAABB / dark: #FF8FA3
> ...

Adjust any specific tokens the user requests before proceeding.

---

## Step 4 — Define the Full Token Set

Beyond colors, the theme also covers typography, spacing, and border radius. These
are **fixed across light and dark** (only colors change per theme).

### Typography
```ts
export const typography = {
  fontFamily: {
    regular: 'System',     // replace with project font if detected in package.json
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
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
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
};
```

If a custom font is detected in `package.json` (e.g. `expo-font`, `react-native-fonts`,
or a specific font package like `@expo-google-fonts/*`), use the detected font family
name instead of `'System'`.

### Spacing (4pt grid)
```ts
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
```

### Border Radius
```ts
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
```

---

## Step 5 — Write `constants/themes.ts`

Check whether `constants/` folder exists (same detection as create-util-and-constant).
Create it if absent.

The file structure:

```ts
// constants/themes.ts

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

export const typography = { ... };  // full object from Step 4
export const spacing = { ... };     // full object from Step 4
export const borderRadius = { ... }; // full object from Step 4

// ─── Color palettes ───────────────────────────────────────────────────────────

const lightColors: ThemeColors = { ... }; // generated from Step 3
const darkColors: ThemeColors = { ... };  // generated from Step 3

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
```

---

## Step 6 — Detect State Management Approach

Decide how the active theme will be stored and switched. Check in this order:

1. **Read `package.json`** for Redux indicators (`@reduxjs/toolkit`, `redux`).
2. **Check `src/store/`** for existing slice files — if a `store/` directory exists
   with slice files, Redux is confirmed.
3. **Check for existing Context** — look for files named `ThemeContext`, `AppContext`,
   or any file using `React.createContext` in the codebase.

| Finding | Approach |
|---|---|
| Redux Toolkit (`@reduxjs/toolkit`) found | Create a `themeSlice.ts` in `src/store/` |
| Plain Redux (no toolkit) found | Create action/reducer/type files in `src/store/` |
| Context API pattern found or no Redux | Create `ThemeContext` using React Context |
| Both Redux and Context patterns found | Ask the user which to use |

---

## Step 7A — Redux Setup (if Redux detected)

### Redux Toolkit path — `src/store/themeSlice.ts`
```ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode } from '../constants/themes';

interface ThemeState {
  mode: ThemeMode;
}

const initialState: ThemeState = {
  mode: 'light',
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
    },
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export const themeReducer = themeSlice.reducer;
```

Add `theme: themeReducer` to the existing `configureStore` in `src/store/index.ts`.

Add a typed selector to `src/store/index.ts` or a `src/store/selectors.ts`:
```ts
export const selectThemeMode = (state: RootState) => state.theme.mode;
export const selectTheme = (state: RootState) => themes[state.theme.mode];
```

### Plain Redux path
Follow the traditional thunk pattern from `setup-redux` references — create
`src/store/types/themeTypes.ts`, `src/store/actions/themeActions.ts`,
`src/store/reducers/themeReducer.ts`, and register in `src/store/reducers/index.ts`.

---

## Step 7B — Context Setup (if Context detected or no Redux)

### `src/context/ThemeContext.tsx`
```tsx
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Theme, ThemeMode, themes } from '../constants/themes';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  const setTheme = useCallback((newMode: ThemeMode) => setMode(newMode), []);
  const toggleTheme = useCallback(
    () => setMode(prev => (prev === 'light' ? 'dark' : 'light')),
    []
  );

  const value = useMemo(
    () => ({ theme: themes[mode], mode, setTheme, toggleTheme }),
    [mode, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};
```

Create `src/context/` if it doesn't exist. Check if a `context/index.ts` barrel
exists and add `export * from './ThemeContext'` to it; create it if not.

---

## Step 8 — Wire Up the Provider

Find the app entry point (same logic as `setup-redux` skill — check `App.tsx`,
`src/App.tsx`, `index.tsx`, `src/index.tsx` in that order).

**Context path** — wrap with `ThemeProvider`:
```tsx
import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      {/* existing root */}
    </ThemeProvider>
  );
}
```

**Redux path** — `themeReducer` is already added to the store in Step 7A, so no
Provider change is needed — `<Provider store={store}>` already covers it.

If wrapping automatically is risky (multiple entry files, complex HOC chain), show
the snippet and tell the user exactly where to add it.

---

## Step 9 — Register in `constants/index.ts`

Add to the constants barrel:
```ts
export * from './themes';
```

If `constants/index.ts` doesn't exist, create it.

---

## Step 10 — Create a `useTheme` Hook (Redux path only)

For Redux setups, the Context already provides `useTheme`. For Redux, create a
convenience hook so component usage is identical regardless of which approach is used:

```ts
// src/store/hooks.ts  (add to existing hooks file or create)
import { useAppDispatch, useAppSelector } from './index';
import { selectTheme, selectThemeMode } from './index';
import { setTheme, toggleTheme } from './themeSlice';
import { ThemeMode } from '../constants/themes';

export const useTheme = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const mode = useAppSelector(selectThemeMode);

  return {
    theme,
    mode,
    setTheme: (m: ThemeMode) => dispatch(setTheme(m)),
    toggleTheme: () => dispatch(toggleTheme()),
  };
};
```

This ensures components always use `const { theme, toggleTheme } = useTheme()`
regardless of whether state lives in Redux or Context.

---

## Step 11 — Summary

After scaffolding, report:
- Primary and secondary colors chosen (and how the palette was derived)
- Files created with their paths
- State management approach detected/used and why
- How to use the theme in a component:

```tsx
// In any component — same API whether Redux or Context
import { useTheme } from '../store/hooks'; // Redux
// or
import { useTheme } from '../context/ThemeContext'; // Context

const MyComponent = () => {
  const { theme, toggleTheme, mode } = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{
        color: theme.colors.text,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.medium,
      }}>
        Current mode: {mode}
      </Text>
      <Button title="Toggle theme" onPress={toggleTheme} />
    </View>
  );
};
```