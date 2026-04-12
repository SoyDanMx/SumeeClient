import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { TULBOX_COLORS } from '@/constants/Colors';

const ThemeContext = createContext<any>(null);

export const theme = {
    light: {
        primary: TULBOX_COLORS.PURPLE,
        primaryDark: TULBOX_COLORS.PURPLE_DARK,
        primaryLight: TULBOX_COLORS.PURPLE_LIGHT,
        secondary: TULBOX_COLORS.GREEN,
        background: TULBOX_COLORS.BACKGROUND,
        card: TULBOX_COLORS.CARD,
        surface: TULBOX_COLORS.SURFACE,
        text: TULBOX_COLORS.TEXT,
        textSecondary: TULBOX_COLORS.TEXT_SECONDARY,
        border: TULBOX_COLORS.BORDER,
        error: TULBOX_COLORS.ERROR,
        success: TULBOX_COLORS.SUCCESS,
        warning: TULBOX_COLORS.WARNING,
        info: TULBOX_COLORS.INFO,
        white: '#FFFFFF',
    },
    dark: {
        primary: TULBOX_COLORS.PURPLE_LIGHT,
        primaryDark: TULBOX_COLORS.PURPLE,
        primaryLight: '#A78BFA',
        secondary: TULBOX_COLORS.GREEN_LIGHT,
        background: '#0F172A',
        card: '#1E293B',
        surface: '#1E293B',
        text: '#F8FAFC',
        textSecondary: '#94A3B8',
        border: '#334155',
        error: TULBOX_COLORS.ERROR,
        success: TULBOX_COLORS.SUCCESS,
        warning: TULBOX_COLORS.WARNING,
        info: TULBOX_COLORS.INFO,
        white: '#FFFFFF',
    }
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const currentTheme = theme[isDarkMode ? 'dark' : 'light'];

    return (
        <ThemeContext.Provider value={{ 
            theme: currentTheme, 
            isDark: Boolean(isDarkMode) 
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

