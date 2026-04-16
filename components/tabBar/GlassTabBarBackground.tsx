import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
    isDark: boolean;
    /** iOS: píldora flotante. Android: barra anclada con solo esquinas superiores redondeadas */
    variant: 'floating' | 'edge';
    /** A: ultra white, B: liquid glass profundo */
    mode: 'A' | 'B';
};

const R_FLOAT = 28;
const R_EDGE = 20;

/**
 * Fondo “liquid glass” para la tab bar (iOS-first).
 * — Blur nativo (Materials) + reflejo superior suave + borde tipo vidrio.
 * Android: blur de Expo con intensidad ajustada.
 */
export function GlassTabBarBackground({ isDark, variant, mode }: Props) {
    const tint = isDark ? 'dark' : 'light';
    const intensity =
        mode === 'A'
            ? Platform.OS === 'ios'
                ? isDark
                    ? 34
                    : 26
                : isDark
                  ? 30
                  : 22
            : Platform.OS === 'ios'
              ? isDark
                  ? 100 // Máximo blur para Liquid Glass
                  : 94
              : isDark
                ? 85
                : 75;

    const edgeTop =
        mode === 'A'
            ? isDark
                ? (['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.06)', 'transparent'] as const)
                : (['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.40)', 'transparent'] as const)
            : isDark
              ? (['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.04)', 'transparent'] as const)
              : (['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.12)', 'transparent'] as const);

    const radiusStyle =
        variant === 'floating'
            ? { borderRadius: R_FLOAT }
            : {
                  borderTopLeftRadius: R_EDGE,
                  borderTopRightRadius: R_EDGE,
                  borderRadius: 0,
              };

    const milkOverlay =
        mode === 'A'
            ? isDark
                ? 'rgba(15,23,42,0.56)'
                : 'rgba(255,255,255,0.90)'
            : isDark
              ? 'rgba(15,23,42,0.22)' // Más transparente en modo B
              : 'rgba(255,255,255,0.28)';

    return (
        <View style={[styles.wrap, radiusStyle]} pointerEvents="none">
            <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: milkOverlay }]} />
            {mode === 'B' && (
                <LinearGradient
                    colors={
                        isDark
                            ? (['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.00)', 'rgba(0,0,0,0.12)'] as const)
                            : (['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.00)', 'rgba(15,23,42,0.04)'] as const)
                    }
                    locations={[0, 0.40, 1]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
            )}
            <LinearGradient
                colors={edgeTop}
                locations={[0, 0.35, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.specular}
            />
            <View
                style={[
                    styles.rim,
                    radiusStyle,
                    {
                        borderColor:
                            mode === 'A'
                                ? isDark
                                    ? 'rgba(255,255,255,0.18)'
                                    : 'rgba(15,23,42,0.06)'
                                : isDark
                                  ? 'rgba(255,255,255,0.14)'
                                  : 'rgba(255,255,255,0.82)',
                    },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    specular: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 22,
    },
    rim: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: StyleSheet.hairlineWidth * 1.5,
    },
});
