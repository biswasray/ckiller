---
name: add-screen
description: >
  Add a new screen or page to a React Native or Next.js project with full navigation
  wiring, type support, and proper folder placement. Use this skill whenever the user
  asks to "add a screen", "create a screen", "add a page", "create a HomeScreen",
  "add a detail screen", "add a Next.js page", or any request naming a screen or page.
  Detects the navigation library from package.json (React Navigation, Expo Router,
  React Native Navigation / Wix, Next.js App Router or Pages Router), configures it
  from scratch if not set up, creates the file following project folder conventions,
  infers route params from the screen name, registers the screen in the correct
  navigator, sets up typed navigation hooks, and invokes the create-component,
  create-type, and create-util-and-constant skills where needed. Export defaults to
  named export unless the navigator requires default export (Expo Router, Next.js).
  Always use this skill instead of creating screen files ad hoc.
---

# Add Screen

Add a fully wired screen or page to a React Native or Next.js project — file,
types, navigator registration, and typed hooks — in one pass.

---

## Step 1 — Get the Screen Name

The user provides a screen or page name (e.g. `Home`, `HomeScreen`, `ProductDetail`,
`about`, `product/[id]`).

**React Native** — normalise to PascalCase ending in `Screen`:
- `Home` → `HomeScreen`
- `product-detail` → `ProductDetailScreen`

**Next.js** — normalise to kebab-case page name:
- `About` → `about`
- `ProductDetail` → `product-detail`
- `product/[id]` → kept as-is (dynamic route)

If no name is given, ask:
> "What should the screen/page be called?"

---

## Step 2 — Detect the Navigation Library

Read `package.json` dependencies. Identify the installed library:

| Package detected | Library |
|---|---|
| `@react-navigation/native` | **React Navigation** |
| `@react-navigation/stack` or `@react-navigation/native-stack` | React Navigation — Stack |
| `@react-navigation/bottom-tabs` | React Navigation — Tab |
| `@react-navigation/drawer` | React Navigation — Drawer |
| `expo-router` | **Expo Router** |
| `react-native-navigation` | **React Native Navigation (Wix)** |
| `next` | **Next.js** |

**Distinguishing Next.js router type** — when `next` is found, check the project
folder structure:
- `app/` folder exists at root (with `page.tsx` files inside) → **App Router** (Next 13+)
- `pages/` folder exists at root → **Pages Router**
- Both exist → prefer App Router (Next.js convention), note the mix to the user
- Neither exists → fresh Next.js project; default to App Router (current standard)

If **multiple React Navigation navigators** are installed (e.g. both stack and tabs),
note all of them — navigator selection is handled in Step 7.

If **no navigation library is found**, ask the user:
> "No navigation library detected. Which would you like to use?"
> 1. React Navigation (most common, Stack/Tab/Drawer — React Native)
> 2. Expo Router (file-based, Expo projects)
> 3. React Native Navigation by Wix (native performance)
> 4. Next.js App Router (file-based, web)
> 5. Next.js Pages Router (classic, web)

Then install and configure the chosen library before proceeding (see Step 3).

---

## Step 3 — Configure Navigation if Not Yet Set Up

Only run this step if the navigation library was just chosen in Step 2 (not yet
installed or configured). If navigation is already configured, skip to Step 4.

### React Navigation — fresh setup

Install:
```bash
npm install @react-navigation/native react-native-screens react-native-safe-area-context
npm install @react-navigation/native-stack
```

Create the root navigator:

**`src/navigation/RootNavigator.tsx`**
```tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { RootStackParamList } from '../interfaces/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Home">
      {/* screens registered here */}
    </Stack.Navigator>
  </NavigationContainer>
);
```

Create `src/interfaces/navigation.ts` (via create-type convention):
```ts
export type RootStackParamList = {
  Home: undefined;
};
```

Wrap `App.tsx` with `<RootNavigator />`.

### Expo Router — fresh setup

Install:
```bash
npx expo install expo-router react-native-safe-area-context react-native-screens
```

Ensure `package.json` has:
```json
"main": "expo-router/entry"
```

Create `app/` folder at root if it doesn't exist. Each file in `app/` is a route
automatically.

### React Native Navigation (Wix) — fresh setup

Install:
```bash
npm install react-native-navigation
npx rnn-link
```

Create `src/navigation/index.ts`:
```ts
import { Navigation } from 'react-native-navigation';

export const registerScreens = () => {
  // screens registered here
};
```

Call `registerScreens()` in `index.js` before `Navigation.events().registerAppLaunchedListener`.

### Next.js — fresh setup

Install:
```bash
npx create-next-app@latest my-app --typescript --app   # App Router
# or
npx create-next-app@latest my-app --typescript         # Pages Router
```

If Next.js is already installed but the router folder is absent, create the
appropriate structure (see Step 4). No additional config is needed — Next.js
routing is entirely file-based.

---

## Step 4 — Detect Screen Folder Structure

Look for where existing screens live, checking in this order:

1. `src/screens/` — folder-per-screen pattern (each screen is a folder with `index.tsx`)
2. `screens/` at project root
3. `src/pages/` or `pages/` — flat file pattern
4. `app/` — Expo Router file-based routing (auto-selected for Expo Router projects)

**Folder-per-screen pattern:**
```
src/screens/
  home/
    index.tsx
    styles.tsx
  product-detail/
    index.tsx
    styles.tsx
```

**Flat file pattern:**
```
src/screens/
  HomeScreen.tsx
  ProductDetailScreen.tsx
```

**Expo Router:**
```
app/
  index.tsx
  home.tsx
  product/
    [id].tsx
```

**Next.js App Router:**
```
app/
  page.tsx                  ← /
  about/
    page.tsx                ← /about
  product/
    [id]/
      page.tsx              ← /product/:id
  layout.tsx                ← root layout
```

**Next.js Pages Router:**
```
pages/
  index.tsx                 ← /
  about.tsx                 ← /about
  product/
    [id].tsx                ← /product/:id
  _app.tsx                  ← custom App wrapper
  _document.tsx             ← custom Document
```

If **no screen folder exists** and this is not Expo Router or Next.js, ask:
> "Where should screens live?"
> 1. `src/screens/` — folder per screen (like components)
> 2. `src/screens/` — flat file per screen
> 3. `src/pages/` — flat file per screen

---

## Step 5 — Infer Route Params from Screen Name

Parse the screen name to infer whether it needs route params:

| Screen name contains | Inferred params | Rationale |
|---|---|---|
| `Detail`, `Info`, `View`, `Show`, `Profile`, `Edit`, `Update` | `{ id: string }` | References a specific item |
| `List`, `Home`, `Dashboard`, `Feed`, `Overview`, `Index` | `undefined` | Landing/list screen |
| `Settings`, `About`, `Help`, `Contact`, `Faq` | `undefined` | Static screens |
| `Auth`, `Login`, `Register`, `SignIn`, `SignUp`, `Forgot`, `Verify` | `undefined` | Auth flow screens |
| `Onboarding`, `Welcome`, `Intro`, `Splash` | `undefined` | Onboarding flow |
| `Search`, `Filter`, `Results` | `{ query?: string }` | Search screens |
| `Modal`, `Confirm`, `Alert`, `Prompt` | ask user | Modals vary widely |
| Ambiguous or unrecognised | ask user | Cannot safely infer |

For Expo Router with params, infer the file name:
- Has `id` param → `[id].tsx` inside a folder named after the entity
- No params → flat `screen-name.tsx`

For **Next.js App Router** with params, use folder-based dynamic segments:
- Has `id` param → `product/[id]/page.tsx`
- No params → `about/page.tsx`

For **Next.js Pages Router** with params:
- Has `id` param → `product/[id].tsx`
- No params → `about.tsx`

Confirm with the user if the inference feels non-obvious:
> "I'm assuming `ProductDetailScreen` takes an `id: string` param — correct, or
> does it need different params?"

---

## Step 6 — Create the Type Definitions

Use the **create-type skill** to add the screen's types to `interfaces/navigation.ts`.

### React Navigation

Extend `RootStackParamList` with the new screen entry:
```ts
export type RootStackParamList = {
  Home: undefined;
  ProductDetail: { id: string };  // new
};
```

Add typed screen props:
```ts
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type ProductDetailScreenProps =
  NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;
```

If the project uses Tab or Drawer navigators, add the appropriate param list type
alongside `RootStackParamList` (e.g. `TabParamList`, `DrawerParamList`).

### Expo Router

Expo Router infers types from file structure. Document param shapes in
`interfaces/navigation.ts` for reference:
```ts
export interface ProductDetailParams {
  id: string;
}
```

### React Native Navigation (Wix)

```ts
export interface ProductDetailProps {
  componentId: string;
  id: string;
}
```

### Next.js App Router

Next.js App Router infers param types from folder names. Add typed param interfaces
to `interfaces/navigation.ts` for use inside page components:

```ts
// interfaces/navigation.ts
export interface ProductDetailPageParams {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}
```

### Next.js Pages Router

Use `GetServerSideProps`, `GetStaticProps`, or `InferGetServerSidePropsType` depending
on the page's data-fetching strategy:

```ts
// interfaces/navigation.ts
export interface ProductDetailPageProps {
  id: string;
  // add any server-fetched props here
}
```

---

## Step 7 — Register in the Correct Navigator

### React Navigation

**One navigator file exists** → add the screen there directly.

**Multiple navigators exist** (e.g. `AuthNavigator.tsx`, `MainNavigator.tsx`,
`TabNavigator.tsx`) → ask the user:
> "Which navigator should `ProductDetailScreen` belong to?"
> (list the found navigator files)

Add the `<Stack.Screen>` (or `<Tab.Screen>` / `<Drawer.Screen>`) entry:

```tsx
// Before
<Stack.Navigator>
  <Stack.Screen name="Home" component={HomeScreen} />
</Stack.Navigator>

// After
<Stack.Navigator>
  <Stack.Screen name="Home" component={HomeScreen} />
  <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
</Stack.Navigator>
```

Import the new screen at the top of the navigator file, matching the project's
existing import style (named import from folder vs. named import from flat file).

### Expo Router

No manual registration needed — file placement is the registration.

### Next.js (App Router and Pages Router)

No manual registration needed — file placement is the registration, same as
Expo Router. Just create the correct file in `app/` or `pages/` and Next.js
picks it up automatically.

### React Native Navigation (Wix)

Add to `src/navigation/index.ts` inside `registerScreens`:
```ts
Navigation.registerComponent('ProductDetail', () => ProductDetailScreen);
```

---

## Step 8 — Set Up Typed Navigation Hooks

### React Navigation

Create `src/navigation/hooks.ts` if it doesn't exist:

```ts
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../interfaces/navigation';

export const useAppNavigation = () =>
  useNavigation<NativeStackNavigationProp<RootStackParamList>>();

export const useAppRoute = <T extends keyof RootStackParamList>() =>
  useRoute<RouteProp<RootStackParamList, T>>();
```

If the file already exists, do not overwrite — new screens are covered automatically
because `RootStackParamList` is extended in Step 6.

### Expo Router

No custom hooks needed. Expo Router's `useLocalSearchParams` and `useRouter` are
already typed from the file structure. Document usage in the summary.

### React Native Navigation (Wix)

Add a typed push helper to `src/navigation/hooks.ts`:
```ts
import { Navigation } from 'react-native-navigation';

export const navigateTo = (
  componentId: string,
  screen: string,
  passProps?: object
) => {
  Navigation.push(componentId, {
    component: { name: screen, passProps },
  });
};
```

### Next.js

Next.js provides built-in typed hooks — no custom hook file needed. Document
usage in the summary:

**App Router:**
```ts
// Inside a Server Component — params come as props (no hook needed)
// Inside a Client Component:
import { useRouter, useParams, useSearchParams, usePathname } from 'next/navigation';

const router = useRouter();       // programmatic navigation
const params = useParams();       // { id: '123' }
const search = useSearchParams(); // URLSearchParams
const path = usePathname();       // '/product/123'
```

**Pages Router:**
```ts
import { useRouter } from 'next/router';

const router = useRouter();
const { id } = router.query;     // { id: '123' }
router.push('/product/456');
router.back();
```

Create `src/utils/navigation.ts` (via create-util-and-constant skill) if the project
needs programmatic navigation outside components — e.g. after a form submission in
a Server Action.

---

## Step 9 — Create the Screen File

Use the **create-component skill** conventions. A screen is a component — same
rules apply: `index.tsx` + `styles.tsx` in a kebab-case folder (folder-per-screen),
or a single `ScreenName.tsx` file (flat), React Native StyleSheet, and theme/font/i18n
wiring if detected by the project.

### React Navigation — named export

```tsx
// src/screens/product-detail/index.tsx
import React from 'react';
import { Text, View } from 'react-native';
import { ProductDetailScreenProps } from '../../interfaces/navigation';
import { styles } from './styles';

export const ProductDetailScreen = ({ route, navigation }: ProductDetailScreenProps) => {
  const { id } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product {id}</Text>
    </View>
  );
};
```

```tsx
// src/screens/product-detail/styles.tsx
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
});
```

If theme tokens are detected (setup-theme skill), pull from `useTheme()` instead
of hardcoding values — match whatever pattern sibling screens use.

### Expo Router — default export (automatic, no ask needed)

```tsx
// app/product/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './styles';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product {id}</Text>
    </View>
  );
}
```

### React Native Navigation (Wix) — named export

```tsx
// src/screens/product-detail/index.tsx
import React from 'react';
import { Text, View } from 'react-native';
import { ProductDetailProps } from '../../interfaces/navigation';
import { styles } from './styles';

export const ProductDetailScreen = ({ componentId, id }: ProductDetailProps) => (
  <View style={styles.container}>
    <Text style={styles.title}>Product {id}</Text>
  </View>
);
```

### Next.js App Router — default export (Server Component by default)

```tsx
// app/product/[id]/page.tsx
import { ProductDetailPageParams } from '../../../interfaces/navigation';

export default async function ProductDetailPage({ params }: ProductDetailPageParams) {
  const { id } = params;

  return (
    <main>
      <h1>Product {id}</h1>
    </main>
  );
}

// Optional — static metadata
export async function generateMetadata({ params }: ProductDetailPageParams) {
  return { title: `Product ${params.id}` };
}
```

For Client Components (when hooks/state/browser APIs are needed):
```tsx
// app/product/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  return (
    <main>
      <h1>Product {id}</h1>
      <button onClick={() => router.back()}>Back</button>
    </main>
  );
}
```

Also create a layout file if the folder doesn't have one:
```tsx
// app/product/[id]/layout.tsx
export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <section>{children}</section>;
}
```

### Next.js Pages Router — default export

```tsx
// pages/product/[id].tsx
import { GetServerSideProps } from 'next';
import { ProductDetailPageProps } from '../../interfaces/navigation';

export default function ProductDetailPage({ id }: ProductDetailPageProps) {
  return (
    <main>
      <h1>Product {id}</h1>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<ProductDetailPageProps> = async ({ params }) => {
  return {
    props: { id: params?.id as string },
  };
};
```

For static generation:
```tsx
export const getStaticProps: GetStaticProps<ProductDetailPageProps> = async ({ params }) => ({
  props: { id: params?.id as string },
});

export const getStaticPaths = async () => ({
  paths: [], // populate with known IDs
  fallback: 'blocking',
});
```

---

## Step 10 — Export Style Rules

| Navigator | Export | Reason |
|---|---|---|
| React Navigation | Named (`export const`) | Consistent with create-component convention |
| Expo Router | Default (`export default function`) | Required by file-based routing — automatic |
| React Native Navigation (Wix) | Named (`export const`) | Consistent with create-component convention |
| Next.js App Router | Default (`export default function`) | Required by Next.js file-based routing — automatic |
| Next.js Pages Router | Default (`export default function`) | Required by Next.js file-based routing — automatic |

Next.js pages always use default export — this is enforced by the framework and
applied automatically without asking the user. Named exports in Next.js page files
are reserved for `generateMetadata`, `getServerSideProps`, `getStaticProps`, and
`getStaticPaths`.

If the user explicitly requests a different export style, honour it and note
the deviation in the summary.

---

## Step 11 — Add Navigation Utility (optional)

Check `utils/` for an existing navigation utility (file named `navigation.ts` or
containing `navigationRef`). If none exists and the project uses React Navigation,
offer to create one using the **create-util-and-constant skill**:

```ts
// utils/navigation.ts
import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../interfaces/navigation';

const ref = createNavigationContainerRef<RootStackParamList>();

const navigate = <T extends keyof RootStackParamList>(
  screen: T,
  params?: RootStackParamList[T]
) => {
  if (ref.isReady()) ref.navigate(screen, params as any);
};

const goBack = () => {
  if (ref.isReady() && ref.canGoBack()) ref.goBack();
};

const reset = (routeName: keyof RootStackParamList) => {
  if (ref.isReady()) ref.reset({ index: 0, routes: [{ name: routeName }] });
};

export const navigation = { ref, navigate, goBack, reset };
```

Attach `ref` to `NavigationContainer` in `RootNavigator.tsx`:
```tsx
<NavigationContainer ref={navigation.ref}>
```

Only create this if the user accepts the offer — don't add it silently.

---

## Step 12 — Summary

After scaffolding, report:

- Screen name used and any normalisation applied
- Navigation library detected or chosen
- Whether navigation was freshly configured or already existed
- Screen folder location and structure (folder-per-screen / flat / file-based)
- Route params inferred (pattern matched) or provided by user
- Types created/extended in `interfaces/navigation.ts`
- Navigator file updated with the new screen entry
- Navigation hooks file status (created / already existed / not needed)
- Export style used and why
- Any sibling skills invoked (create-component, create-type, create-util-and-constant)

Usage example:

```tsx
// Navigate to the new screen from anywhere
import { useAppNavigation } from '../navigation/hooks';

const MyComponent = () => {
  const navigation = useAppNavigation();
  return (
    <Button
      title="Go to Product"
      onPress={() => navigation.navigate('ProductDetail', { id: '123' })}
    />
  );
};

// Inside the screen itself
import { useAppRoute } from '../navigation/hooks';

export const ProductDetailScreen = () => {
  const route = useAppRoute<'ProductDetail'>();
  const { id } = route.params;
  // ...
};
```