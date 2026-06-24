# Navigation Setup Boilerplate

Complete first-time setup files for each supported navigation library.

---

## React Navigation — Full First-Time Setup

### Install
```bash
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
# For tabs:
npm install @react-navigation/bottom-tabs
# For drawer:
npm install @react-navigation/drawer react-native-gesture-handler react-native-reanimated
```

### `interfaces/navigation.ts` (if interfaces/ folder exists)
```ts
export type RootStackParamList = {
  Home: undefined;
  // Add new screens here
};

// Extend per navigator type:
export type TabParamList = {
  HomeTab: undefined;
  ProfileTab: undefined;
};
```

### `src/navigation/RootNavigator.tsx`
```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { HomeScreen } from '../screens/home';
import { RootStackParamList } from '../interfaces/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
};
```

### `src/navigation/hooks.ts`
```ts
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../interfaces/navigation';

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const useAppNavigation = () => useNavigation<RootNavigationProp>();
```

### `src/navigation/index.ts`
```ts
export * from './RootNavigator';
export * from './hooks';
```

### `App.tsx` — wrap with NavigationContainer
```tsx
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { RootNavigator } from './src/navigation';

export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
```

---

## React Navigation — Tab Navigator Setup

### Install
```bash
npm install @react-navigation/bottom-tabs
```

### `src/navigation/TabNavigator.tsx`
```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { HomeScreen } from '../screens/home';
import { ProfileScreen } from '../screens/profile';
import { TabParamList } from '../interfaces/navigation';

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
```

### Nested in RootNavigator
```tsx
// Register TabNavigator as a screen inside RootNavigator
<Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
```

---

## React Navigation — Drawer Navigator Setup

### Install
```bash
npm install @react-navigation/drawer react-native-gesture-handler react-native-reanimated
```

Add to `babel.config.js`:
```js
plugins: ['react-native-reanimated/plugin']
```

### `src/navigation/DrawerNavigator.tsx`
```tsx
import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import { HomeScreen } from '../screens/home';

const Drawer = createDrawerNavigator();

export const DrawerNavigator = () => {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name="Home" component={HomeScreen} />
    </Drawer.Navigator>
  );
};
```

---

## Expo Router — Full First-Time Setup

### Install
```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar
```

### `package.json` — update main field
```json
{
  "main": "expo-router/entry"
}
```

### `app/_layout.tsx`
```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
    </Stack>
  );
}
```

### `app/index.tsx` — root screen
```tsx
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  return (
    <View>
      <Text>Home</Text>
    </View>
  );
}
```

### Tab layout (`app/(tabs)/_layout.tsx`)
```tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
```

### Navigation in Expo Router
```tsx
// Push a screen
router.push('/product-detail?id=123');

// Replace current screen
router.replace('/home');

// Go back
router.back();

// Typed params in destination screen
import { useLocalSearchParams } from 'expo-router';
const { id } = useLocalSearchParams<{ id: string }>();
```

---

## React Native Navigation (Wix) — Full First-Time Setup

### Install
```bash
npm install react-native-navigation
npx rnn-link
```

### `index.js` (bootstrap)
```js
import { Navigation } from 'react-native-navigation';
import { HomeScreen } from './src/screens/home';

Navigation.registerComponent('Home', () => HomeScreen);

Navigation.events().registerAppLaunchedListener(() => {
  Navigation.setRoot({
    root: {
      stack: {
        children: [
          {
            component: {
              name: 'Home',
            },
          },
        ],
      },
    },
  });
});
```

### `src/navigation/Navigation.ts`
```ts
import { Navigation, OptionsModalPresentationStyle } from 'react-native-navigation';

const push = (componentId: string, screenName: string, passProps?: object) => {
  Navigation.push(componentId, {
    component: {
      name: screenName,
      passProps,
    },
  });
};

const pop = (componentId: string) => {
  Navigation.pop(componentId);
};

const showModal = (screenName: string, passProps?: object) => {
  Navigation.showModal({
    stack: {
      children: [{
        component: {
          name: screenName,
          passProps,
          options: {
            modalPresentationStyle: OptionsModalPresentationStyle.pageSheet,
          },
        },
      }],
    },
  });
};

const dismissModal = (componentId: string) => {
  Navigation.dismissModal(componentId);
};

export const AppNavigation = { push, pop, showModal, dismissModal };
```

### Screen props interface (RNN screens receive `componentId`)
```tsx
import { NavigationFunctionComponent } from 'react-native-navigation';

interface Props {
  componentId: string;
  id?: string; // passProps
}

export const ProductDetailScreen: NavigationFunctionComponent<Props> = ({
  componentId,
  id,
}) => {
  return (...);
};

ProductDetailScreen.options = {
  topBar: {
    title: { text: 'Product Detail' },
  },
};
```

---

## Route param inference rules (reference)

| Pattern | Params |
|---|---|
| `*DetailScreen` | `{ id: string }` |
| `*EditScreen` | `{ id: string }` |
| `*ProfileScreen` | `{ userId: string }` |
| `*SearchScreen` | `{ query?: string }` |
| `*HomeScreen` | `undefined` |
| `*ListScreen` | `undefined` |
| `*LoginScreen` | `undefined` |
| `*RegisterScreen` | `undefined` |
| `*SettingsScreen` | `undefined` |
| `*OnboardingScreen` | `undefined` |
| `*SplashScreen` | `undefined` |
| `*ModalScreen` | ask — depends heavily on context |
| anything else | `undefined` (default), ask if name implies data |

---

## Screen styles template

```tsx
// styles.tsx (co-located with screen index.tsx)
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
```

If theme system is detected (setup-theme skill), pull from theme tokens:
```tsx
// In index.tsx when theme detected
const { theme } = useTheme();
// Use inline styles with theme tokens or pass theme to StyleSheet factory
const themedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
});
```