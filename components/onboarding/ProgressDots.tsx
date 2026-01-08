/**
 * Indicador de Progreso con Dots
 * Muestra el progreso del onboarding con puntos animados
 */

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ProgressDotsProps {
    currentStep: number;
    totalSteps: number;
}

export function ProgressDots({ currentStep, totalSteps }: ProgressDotsProps) {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            {Array.from({ length: totalSteps }).map((_, index) => {
                const isActive = index < currentStep;
                const isCurrent = index === currentStep - 1;

                return (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            isActive && styles.dotActive,
                            isCurrent && styles.dotCurrent,
                            {
                                backgroundColor: isActive
                                    ? theme.primary
                                    : theme.border,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotActive: {
        width: 24,
    },
    dotCurrent: {
        width: 32,
    },
});

