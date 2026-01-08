/**
 * Botón Estilizado para Onboarding
 * Versiones: Primary (azul), Secondary (borde), Text (solo texto)
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface OnboardingButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'text';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export function OnboardingButton({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
}: OnboardingButtonProps) {
    const { theme } = useTheme();

    const buttonStyles = [
        styles.button,
        variant === 'primary' && [
            styles.buttonPrimary,
            { backgroundColor: theme.primary },
        ],
        variant === 'secondary' && [
            styles.buttonSecondary,
            { borderColor: theme.primary },
        ],
        variant === 'text' && styles.buttonText,
        (disabled || loading) && styles.buttonDisabled,
        style,
    ];

    const textStyles = [
        styles.text,
        variant === 'primary' && styles.textPrimary,
        variant === 'secondary' && [
            styles.textSecondary,
            { color: theme.primary },
        ],
        variant === 'text' && [
            styles.textText,
            { color: theme.primary },
        ],
        (disabled || loading) && styles.textDisabled,
        textStyle,
    ];

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? '#FFFFFF' : theme.primary}
                />
            ) : (
                <Text style={textStyles}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
    },
    buttonPrimary: {
        // backgroundColor se aplica dinámicamente
    },
    buttonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        // borderColor se aplica dinámicamente
    },
    buttonText: {
        backgroundColor: 'transparent',
        paddingVertical: 12,
        minHeight: 44,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    textPrimary: {
        color: '#FFFFFF',
    },
    textSecondary: {
        // color se aplica dinámicamente
    },
    textText: {
        // color se aplica dinámicamente
    },
    textDisabled: {
        opacity: 0.7,
    },
});

