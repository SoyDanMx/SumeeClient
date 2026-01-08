import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { SUMEE_COLORS } from '@/constants/Colors';

const ThemeContext = createContext<any>(null);

export const theme = {
    light: {
        primary: SUMEE_COLORS.PURPLE,
        primaryDark: SUMEE_COLORS.PURPLE_DARK,
        primaryLight: SUMEE_COLORS.PURPLE_LIGHT,
        secondary: SUMEE_COLORS.GREEN,
        background: SUMEE_COLORS.BACKGROUND,
        card: SUMEE_COLORS.CARD,
        surface: SUMEE_COLORS.SURFACE,
        text: SUMEE_COLORS.TEXT,
        textSecondary: SUMEE_COLORS.TEXT_SECONDARY,
        border: SUMEE_COLORS.BORDER,
        error: SUMEE_COLORS.ERROR,
        success: SUMEE_COLORS.SUCCESS,
        warning: SUMEE_COLORS.WARNING,
        info: SUMEE_COLORS.INFO,
        white: '#FFFFFF',
    },
    dark: {
        primary: SUMEE_COLORS.PURPLE_LIGHT,
        primaryDark: SUMEE_COLORS.PURPLE,
        primaryLight: '#A78BFA',
        secondary: SUMEE_COLORS.GREEN_LIGHT,
        background: '#0F172A',
        card: '#1E293B',
        surface: '#1E293B',
        text: '#F8FAFC',
        textSecondary: '#94A3B8',
        border: '#334155',
        error: SUMEE_COLORS.ERROR,
        success: SUMEE_COLORS.SUCCESS,
        warning: SUMEE_COLORS.WARNING,
        info: SUMEE_COLORS.INFO,
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

