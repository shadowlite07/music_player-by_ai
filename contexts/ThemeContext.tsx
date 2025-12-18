
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode, ThemeColors, getThemeColors, AccentColors } from '../constants/theme';

interface ThemeContextType {
    mode: ThemeMode;
    accentColor: string;
    colors: ThemeColors;
    setMode: (mode: ThemeMode) => void;
    setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'music_player_theme_settings';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const deviceColorScheme = useDeviceColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('system');
    const [accentColor, setAccentColorState] = useState(AccentColors[0].color);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedString = await AsyncStorage.getItem(STORAGE_KEY);
            if (savedString) {
                const { mode: savedMode, accentColor: savedAccent } = JSON.parse(savedString);
                if (savedMode) setModeState(savedMode);
                if (savedAccent) setAccentColorState(savedAccent);
            }
        } catch (e) {
            console.error('Failed to load theme settings', e);
        }
    };

    const saveSettings = async (newMode: ThemeMode, newAccent: string) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: newMode, accentColor: newAccent }));
        } catch (e) {
            console.error('Failed to save theme settings', e);
        }
    };

    const setMode = (newMode: ThemeMode) => {
        setModeState(newMode);
        saveSettings(newMode, accentColor);
    };

    const setAccentColor = (newAccent: string) => {
        setAccentColorState(newAccent);
        saveSettings(mode, newAccent);
    };

    const resolvedMode = useMemo(() => {
        if (mode === 'system') return deviceColorScheme || 'dark';
        return mode;
    }, [mode, deviceColorScheme]);

    const colors = useMemo(() => {
        return getThemeColors(resolvedMode as 'light' | 'dark', accentColor);
    }, [resolvedMode, accentColor]);

    const value = useMemo(() => ({
        mode,
        accentColor,
        colors,
        setMode,
        setAccentColor
    }), [mode, accentColor, colors]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
