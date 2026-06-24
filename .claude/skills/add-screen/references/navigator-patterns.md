# Navigator Patterns Reference

Complete navigator setup templates and typed hook patterns for each library.

---

## React Navigation

### Package install matrix

| Navigator type | Extra package |
|---|---|
| Native Stack (recommended) | `@react-navigation/native-stack` |
| JS Stack | `@react-navigation/stack` + `react-native-gesture-handler` |
| Bottom Tabs | `@react-navigation/bottom-tabs` |
| Drawer | `@react-navigation/drawer` + `react-native-gesture-handler` + `react-native-reanimated` |

### Nested navigator pattern (Stack + Tabs)

```tsx
// src/interfaces/navigation.ts
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  ProductDetail: { id: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};
```

```tsx
// src/navigation/AuthNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../interfaces/navigation';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);
```

```tsx
// src/navigation/MainTabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../interfaces/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator = () => (
  <Tab.Navigator>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);
```

```tsx
// src/navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../interfaces/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Auth">
      <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);
```

### Typed hooks for nested navigators

```ts
// src/navigation/hooks.ts
import { useNavigation, useRoute, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, MainTabParamList } from '../interfaces/navigation';

// Root-level navigation (can navigate anywhere)
export const useAppNavigation = () =>
  useNavigation<NativeStackNavigationProp<RootStackParamList>>();

// Tab navigation (from within tab screens)
export const useTabNavigation = () =>
  useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<MainTabParamList>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();

// Typed route for any screen
export const useAppRoute = <T extends keyof RootStackParamList>() =>
  useRoute<RouteProp<RootStackParamList, T>>();
```

---

## Expo Router

### Folder structure mapping

| File path | Route URL | Notes |
|---|---|---|
| `app/index.tsx` | `/` | Root route |
| `app/home.tsx` | `/home` | Simple route |
| `app/product/[id].tsx` | `/product/:id` | Dynamic route |
| `app/product/[...slug].tsx` | `/product/**` | Catch-all |
| `app/(tabs)/home.tsx` | `/home` (tabbed) | Tab group |
| `app/(auth)/login.tsx` | `/login` (auth group) | Route group |
| `app/_layout.tsx` | Layout wrapper | Applies to siblings |
| `app/+not-found.tsx` | 404 handler | |

### Layout file (required for nested routes)

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="product/[id]" options={{ title: 'Product Detail' }} />
    </Stack>
  );
}
```

### Tab layout

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
```

### Typed params hook

```tsx
// app/product/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (/* ... */);
}
```

### Navigation in Expo Router

```ts
import { router } from 'expo-router';

// Push
router.push('/product/123');
router.push({ pathname: '/product/[id]', params: { id: '123' } });

// Replace (no back)
router.replace('/home');

// Go back
router.back();
```

---

## React Native Navigation (Wix)

### Full screen registration pattern

```ts
// src/navigation/index.ts
import { Navigation } from 'react-native-navigation';
import { HomeScreen } from '../screens/home';
import { ProductDetailScreen } from '../screens/product-detail';

export const registerScreens = () => {
  Navigation.registerComponent('Home', () => HomeScreen);
  Navigation.registerComponent('ProductDetail', () => ProductDetailScreen);
};

export const startApp = () => {
  Navigation.setRoot({
    root: {
      stack: {
        children: [{
          component: {
            name: 'Home',
          },
        }],
      },
    },
  });
};
```

```ts
// index.js
import { Navigation } from 'react-native-navigation';
import { registerScreens, startApp } from './src/navigation';

registerScreens();
Navigation.events().registerAppLaunchedListener(startApp);
```

### Navigation calls (Wix)

```ts
// Push a screen
Navigation.push(componentId, {
  component: {
    name: 'ProductDetail',
    passProps: { id: '123' },
    options: { topBar: { title: { text: 'Product Detail' } } },
  },
});

// Show modal
Navigation.showModal({
  stack: {
    children: [{ component: { name: 'ConfirmModal' } }],
  },
});

// Pop
Navigation.pop(componentId);
```

---

## Type guard: screen name inference table

```ts
// Used by the skill to infer params from screen name
const PARAM_PATTERNS: Array<{ keywords: string[]; params: string }> = [
  { keywords: ['Detail', 'Info', 'View', 'Show', 'Profile', 'Edit', 'Update'], params: '{ id: string }' },
  { keywords: ['Search', 'Filter', 'Results'], params: '{ query?: string }' },
  { keywords: ['List', 'Home', 'Dashboard', 'Feed', 'Overview', 'Index',
               'Settings', 'About', 'Help', 'Contact', 'Faq',
               'Auth', 'Login', 'Register', 'SignIn', 'SignUp', 'Forgot', 'Verify',
               'Onboarding', 'Welcome', 'Intro', 'Splash'], params: 'undefined' },
  // Modal, Confirm, Alert, Prompt -> ask user
];
```

---

## Next.js App Router

### Folder structure rules

| File | Purpose |
|---|---|
| `app/page.tsx` | Route UI (`/`) |
| `app/layout.tsx` | Shared layout for segment + children |
| `app/loading.tsx` | Suspense loading UI |
| `app/error.tsx` | Error boundary (must be Client Component) |
| `app/not-found.tsx` | 404 UI |
| `app/[id]/page.tsx` | Dynamic segment (`/123`) |
| `app/[...slug]/page.tsx` | Catch-all (`/a/b/c`) |
| `app/(group)/page.tsx` | Route group — groups routes without affecting URL |
| `app/@modal/page.tsx` | Parallel route — renders alongside main route |

### Server vs Client Component decision

Default to **Server Component** (no directive). Add `'use client'` only when the
page uses: hooks (`useState`, `useEffect`, etc.), browser APIs, event handlers, or
React context consumers.

```tsx
// Server Component (default) — can be async, can fetch directly
export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id); // direct async call
  return <div>{product.name}</div>;
}

// Client Component — needed for interactivity
'use client';
import { useState } from 'react';
export default function InteractivePage() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Root layout (required, create if absent)

```tsx
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My App',
  description: 'My App description',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Route group for auth/main split

```
app/
  (auth)/
    login/page.tsx      → /login
    register/page.tsx   → /register
    layout.tsx          → auth-specific layout (no nav bar)
  (main)/
    dashboard/page.tsx  → /dashboard
    profile/page.tsx    → /profile
    layout.tsx          → main layout (with nav bar)
  layout.tsx            → root layout
```

### Navigation in App Router

```tsx
// Link component (preferred)
import Link from 'next/link';
<Link href="/product/123">View Product</Link>
<Link href={{ pathname: '/product/[id]', query: { id: '123' } }}>View Product</Link>

// Programmatic (Client Component only)
'use client';
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/product/123');
router.replace('/login');
router.back();
router.prefetch('/product/123');

// Server Action redirect
import { redirect } from 'next/navigation';
redirect('/login');
```

---

## Next.js Pages Router

### File structure rules

| File | Route |
|---|---|
| `pages/index.tsx` | `/` |
| `pages/about.tsx` | `/about` |
| `pages/product/[id].tsx` | `/product/:id` |
| `pages/product/[...slug].tsx` | `/product/**` |
| `pages/_app.tsx` | Custom App wrapper (global layout/state) |
| `pages/_document.tsx` | Custom HTML document |
| `pages/api/route.ts` | API route at `/api/route` |

### Data fetching patterns

```tsx
// SSR — runs on every request
export const getServerSideProps: GetServerSideProps = async ({ params, req, res }) => {
  const data = await fetchData(params?.id as string);
  return { props: { data } };
};

// SSG — runs at build time
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const data = await fetchData(params?.id as string);
  return { props: { data }, revalidate: 60 }; // ISR: revalidate every 60s
};

export const getStaticPaths: GetStaticPaths = async () => {
  const ids = await fetchAllIds();
  return {
    paths: ids.map(id => ({ params: { id } })),
    fallback: 'blocking', // or true / false
  };
};

// CSR — no server function, fetch in useEffect or SWR
```

### Custom _app.tsx (global layout/providers)

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    // wrap with providers here (Redux, ThemeProvider, etc.)
    <Component {...pageProps} />
  );
}
```

### Navigation in Pages Router

```tsx
import Link from 'next/link';
import { useRouter } from 'next/router';

// Link
<Link href="/product/[id]" as="/product/123">View Product</Link>

// Programmatic
const router = useRouter();
router.push('/product/123');
router.push({ pathname: '/product/[id]', query: { id: '123' } });
router.replace('/login');
router.back();
const { id } = router.query; // route params
```