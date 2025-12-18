import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PlayerProvider } from '@/contexts/PlayerContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

function RootLayoutContent() {
  const { mode, colors } = useTheme();

  const navigationTheme = mode === 'dark' ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Library', headerShown: false }} />
      </Stack>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <PlayerProvider>
          <RootLayoutContent />
        </PlayerProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
