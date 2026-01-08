/**
 * Icono de Gemini AI
 * Replica exacta del icono usado en la interfaz de Gemini
 * Símbolo ">" minimalista: dos líneas rectas que convergen a la izquierda
 * Diseño basado en el icono oficial de la app Gemini
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface GeminiIconProps {
    size?: number;
    color?: string;
}

export function GeminiIcon({ size = 24, color }: GeminiIconProps) {
    const { theme } = useTheme();
    const iconColor = color || theme.primary;
    
    // Dimensiones precisas basadas en el diseño de Gemini
    const lineWidth = Math.max(2.5, size * 0.13); // Grosor uniforme (13% del tamaño)
    const lineLength = size * 0.85; // Longitud de línea (85% del tamaño)
    const centerX = size / 2;
    const centerY = size / 2;
    const angle = 42; // Ángulo preciso para formar ">"
    const convergencePoint = size * 0.2; // Punto de convergencia a la izquierda

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Línea superior del símbolo ">" - rotada hacia arriba */}
            <View
                style={[
                    styles.line,
                    {
                        width: lineLength,
                        height: lineWidth,
                        backgroundColor: iconColor,
                        // Posicionar desde el centro y rotar
                        left: centerX - lineLength / 2,
                        top: centerY - lineWidth / 2,
                        transform: [
                            { rotate: `${angle}deg` },
                            { translateX: -convergencePoint },
                            { translateY: -size * 0.13 },
                        ],
                    },
                ]}
            />
            {/* Línea inferior del símbolo ">" - rotada hacia abajo */}
            <View
                style={[
                    styles.line,
                    {
                        width: lineLength,
                        height: lineWidth,
                        backgroundColor: iconColor,
                        // Posicionar desde el centro y rotar
                        left: centerX - lineLength / 2,
                        top: centerY - lineWidth / 2,
                        transform: [
                            { rotate: `-${angle}deg` },
                            { translateX: -convergencePoint },
                            { translateY: size * 0.13 },
                        ],
                    },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'visible',
    },
    line: {
        position: 'absolute',
        borderRadius: 0.5,
    },
});
