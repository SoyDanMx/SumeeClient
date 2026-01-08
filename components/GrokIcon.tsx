/**
 * Icono de Grok AI
 * Basado en el diseño de Grok (xAI) para búsqueda de IA
 * Icono de rayo (lightning bolt) estilo Grok
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface GrokIconProps {
    size?: number;
    color?: string;
}

export function GrokIcon({ size = 24, color }: GrokIconProps) {
    const { theme } = useTheme();
    const iconColor = color || theme.primary;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Ionicons 
                name="flash" 
                size={size} 
                color={iconColor} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

