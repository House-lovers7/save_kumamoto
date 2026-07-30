import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { paletteFor } from '@/theme';

export default function RootLayout() {
  const palette = paletteFor(useColorScheme());

  return (
    <>
      {/* ヘッダーと緊急バーはライト・ダークとも濃色なので、文字は常に明色。 */}
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.navyDeep },
          headerTintColor: palette.onNavy,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: palette.paper },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="offline-guides" options={{ title: 'オフライン行動カード' }} />
        <Stack.Screen name="about" options={{ title: '安全と出典について' }} />
      </Stack>
    </>
  );
}
