---
name: create-component
description: >
  Scaffold a new React/React Native component following project naming and folder
  conventions. Use this skill whenever the user asks to "create a component", "add a
  new component", "make a [Name] component", or similar requests that name a component
  (e.g. "create TextInput", "add a Header component", "scaffold BaseLayout"). Handles
  prefix detection (e.g. TextInput becomes AppTextInput), placement into components/ui or
  components/sections, snake-cased folder naming, index.tsx + styles.tsx generation
  using React Native StyleSheet, reuse of existing utils/constants/interfaces, named
  (not default) exports, and registration in the components barrel index.ts. Also
  detects and wires up theme/design-token systems, font/typography style systems, and
  i18n/translation libraries if any are already present in the project, so generated
  components automatically use existing theming, fonts, and translated strings instead
  of hardcoded values. Always use this skill instead of creating component files ad hoc.
---

# Create Component

Scaffold a new component, matching the existing project's conventions for naming,
placement, styling, and exports.

---

## Step 1 — Get the Component Name

The user provides a base name (e.g. `TextInput`, `BaseLayout`, `Header`).

If no name is given, ask:

> "What's the component called?"

---

## Step 2 — Resolve the Prefix

The final component name needs a prefix (e.g. `AppTextInput`). Resolve it in this order,
stopping at the first that succeeds:

1. **Explicit in the request** — if the user already typed a prefixed name (e.g.
   "create AppTextInput" or "create BaseLayout"), use exactly what they gave. Don't
   second-guess or re-prefix it.

2. **Infer from sibling components** — first figure out the likely target folder
   (Step 4 logic) and look at the existing component folder names already there
   (e.g. `app-button/`, `app-modal/` → component names `AppButton`, `AppModal`).
   If there's a clear, consistent prefix pattern among siblings, apply it silently:
   `TextInput` + sibling pattern `App-` → `AppTextInput`. Do not ask the user in
   this case — just proceed.

3. **Ask the user** — only if there are no existing sibling components in the
   target category folder, or the existing components use inconsistent/no prefixes.
   Ask plainly:
   > "What prefix should I use for the TextInput component? (e.g. AppTextInput)"

Never apply a guessed prefix without either inferring it from real sibling evidence
or getting it from the user.

---

## Step 3 — Derive Names

From the final prefixed component name, derive:

- **PascalCase component name**: `AppTextInput`
- **kebab-case folder name**: `app-text-input`
- **File paths**:
  - `components/<category>/app-text-input/index.tsx`
  - `components/<category>/app-text-input/styles.tsx`

Conversion rule: insert a hyphen before each uppercase letter (except the first),
lowercase everything. `AppTextInput` → `app-text-input`. `BaseLayout` → `base-layout`.

---

## Step 4 — Determine the Category Folder

Decide between `components/ui/` and `components/sections/` using keyword matching
on the **base name** (before the prefix was added):

- If the base name contains (case-insensitive): `Layout`, `Section`, `Page`, `Header`,
  `Footer`, `Screen`, `View` (as a suffix, e.g. `ProfileView`) → **`components/sections/`**
- Otherwise → **`components/ui/`**

Examples:

- `TextInput` → no keyword match → `components/ui/`
- `BaseLayout` → matches `Layout` → `components/sections/`
- `Header` → matches `Header` → `components/sections/`
- `Button` → no match → `components/ui/`

If genuinely ambiguous (e.g. a compound name with conflicting signals), ask the user
which category to use rather than guessing.

Before creating the folder, check whether `components/ui/` and `components/sections/`
actually exist in the project. If neither exists, ask the user to confirm the base
`components/` path.

---

## Step 5 — Check for Reusable Code

Before writing the component, look for existing project conventions to reuse rather
than duplicate:

1. **`utils/`** — check for existing helper functions relevant to this component
   (e.g. formatters, validators) that the component could import instead of
   reimplementing.
2. **`constants/`** — check for existing constants (colors, spacing, sizes, enums)
   that should be imported into `styles.tsx` rather than hardcoded.
3. **`interfaces/`** (or `types/`) — check for existing shared types/interfaces
   (e.g. a shared `BaseComponentProps`) that this component's props should extend,
   and check if a props interface for this exact component already exists.

If relevant files are found, import and reuse them. If a props interface doesn't
exist yet for this component, add one in `interfaces/` only if that's the
established pattern in the project (i.e. other components have their props defined
there) — otherwise define the props interface inline in `index.tsx`.

---

## Step 6 — Detect Theme, Font, and i18n Systems

These are **optional, conditional integrations** — only wire them up if real evidence
of each exists in the project. Never invent a theme/font/i18n system that isn't there,
and never block component creation if one or more are absent. Detect each
independently; a project might have theming but no i18n, or vice versa.

### Theme / design tokens

Look for a theme provider or token file, commonly one of:

- `theme/`, `theming/`, `styles/theme*`, `constants/theme*`, `constants/colors*`
- A `ThemeProvider` (from `styled-components`, a custom context, or a UI library)
- A `useTheme()` hook already used elsewhere in the codebase

If found:

- Check how existing components consume it (hook call vs. direct import of a static
  tokens object) and match that exact pattern.
- Pull colors, spacing, radii, etc. from the theme into `styles.tsx` instead of
  hardcoding literals.

If not found, use plain literal values in `StyleSheet.create` as before — don't
introduce a theme system that doesn't exist.

### Font / typography

Look for a typography system, commonly one of:

- `constants/fonts*`, `constants/typography*`, `theme/typography*`
- Exported font-family/font-size/font-weight constants or a `Typography`/`Text`
  preset object
- An existing custom `Text`/`AppText` component other components compose for
  rendering strings

If found:

- Reuse the existing font tokens/constants in `styles.tsx` (e.g. `fontFamily:
Fonts.regular`, `fontSize: Typography.body.size`) instead of hardcoding font values.
- If the project has a shared text component (e.g. `AppText`), use it inside the new
  component for any rendered text rather than a raw `Text` element, matching how
  sibling components do it.

If not found, use plain literal font values where needed — don't introduce a
typography system that doesn't exist.

### i18n / translations

Check `package.json` for any installed internationalization library (e.g. packages
with `i18n`, `intl`, `locale`, or `translat` in the name — whatever is actually
present, don't assume a specific one). Then check how existing components use it:

- Find a sibling component that renders user-facing text and see exactly how it pulls
  translated strings (a hook call, a higher-order component, a render-prop, a static
  helper function — whatever the existing pattern is).
- Match that exact usage pattern in the new component for any user-facing strings
  (labels, placeholders, button text, etc.).
- If the project also has a translation keys/strings file (e.g. `locales/en.json`,
  `i18n/strings.ts`), check whether the new component needs a new key added there,
  and add it following the existing key-naming convention if so.

If no i18n library is installed, write plain string literals — don't introduce a
translation layer that doesn't exist.

### When detection is ambiguous

If multiple candidate theme/font/i18n setups exist, or the pattern used by sibling
components is inconsistent, ask the user briefly rather than guessing:

> "I see both X and Y used for [theme/fonts/translations] in this project — which
> should the new component follow?"

---

## Step 7 — Write `styles.tsx`

Use React Native's `StyleSheet.create`. Pull colors/spacing from `constants/` or a
detected theme system (Step 6), and font values from a detected typography system,
instead of hardcoding — falling back to literals only when no such system exists.

```tsx
// components/ui/app-text-input/styles.tsx
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
```

If a theme/typography system was detected, prefer pulling values from it:

```tsx
// components/ui/app-text-input/styles.tsx — with theme + typography detected
import { StyleSheet } from "react-native";
import { Colors, Spacing } from "../../../theme/tokens";
import { Typography } from "../../../constants/typography";

export const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderColor: Colors.border,
    fontFamily: Typography.body.fontFamily,
    fontSize: Typography.body.fontSize,
  },
});
```

If components consume the theme via a hook (e.g. `useTheme()`) rather than a static
import, the styling instead lives inline in `index.tsx` using the hook's returned
values — match whichever pattern siblings already use.

---

## Step 8 — Write `index.tsx`

Rules:

- **No default export.** Only named exports.
- Import `styles` from `./styles`.
- Define (or import) a props interface.
- Keep the component minimal and functional but complete enough to actually render
  something sensible for its type (don't leave empty stub JSX).
- Any user-facing string uses the project's detected i18n pattern (Step 6) instead of
  a hardcoded literal, if one exists.

```tsx
// components/ui/app-text-input/index.tsx
import React from "react";
import { TextInput, View, TextInputProps } from "react-native";
import { styles } from "./styles";

export interface AppTextInputProps extends TextInputProps {
  label?: string;
}

export const AppTextInput = ({ label, ...rest }: AppTextInputProps) => {
  return (
    <View style={styles.container}>
      <TextInput style={styles.input} {...rest} />
    </View>
  );
};
```

If an i18n library was detected and sibling components use, for example, an
`react-i18next`-style `useTranslation()` hook:

```tsx
// components/ui/app-text-input/index.tsx — with i18n detected
import React from "react";
import { TextInput, View, TextInputProps } from "react-native";
import { useTranslation } from "react-i18next";
import { styles } from "./styles";

export interface AppTextInputProps extends TextInputProps {
  labelKey?: string;
}

export const AppTextInput = ({ labelKey, ...rest }: AppTextInputProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={labelKey ? t(labelKey) : undefined}
        {...rest}
      />
    </View>
  );
};
```

Match whatever the actual detected library/pattern is — this is illustrative, not
prescriptive. If a shared text component (e.g. `AppText`) was detected in Step 6,
use it for any rendered text instead of a raw `Text` element.

If an interface was placed in `interfaces/` per Step 5, import it instead of
declaring it inline:

```tsx
import { AppTextInputProps } from "../../../interfaces/AppTextInput";
```

---

## Step 9 — Register in the Barrel `index.ts`

Find `components/index.ts` (create it if it genuinely doesn't exist, but check first —
it's listed as a required convention, so it likely exists).

Add an export line for the new component, keeping existing formatting/order
(alphabetical if that's the existing pattern, otherwise appended at the end of its
category block):

```ts
export * from "./ui/app-text-input";
```

or, if the project re-exports the component name explicitly rather than using
wildcard exports, match that style:

```ts
export { AppTextInput } from "./ui/app-text-input";
```

Read the existing `index.ts` first to match whichever pattern (`export *` vs named
`export {}`) is already in use — don't introduce a second style.

---

## Step 10 — Summary

After creating the files, report back concisely:

- Final component name and prefix used (and how it was resolved: explicit / inferred / asked)
- Category chosen and why (keyword match)
- Files created
- Any reused utils/constants/interfaces
- Whether theme, font/typography, and i18n systems were detected and used (or noted
  as absent)
- Confirmation it was added to the barrel `index.ts`

---

## Quick Reference

| Input                             | Resolved Name  | Folder Name      | Category   |
| --------------------------------- | -------------- | ---------------- | ---------- |
| `TextInput` (siblings use `App-`) | `AppTextInput` | `app-text-input` | `ui`       |
| `BaseLayout` (explicit)           | `BaseLayout`   | `base-layout`    | `sections` |
| `Header` (no siblings, asked)     | `AppHeader`    | `app-header`     | `sections` |
| `Button` (siblings use `App-`)    | `AppButton`    | `app-button`     | `ui`       |
