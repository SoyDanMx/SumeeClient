/**
 * TulboxIcon - Icono oficial de TulBox (S blanca sobre cuadrado púrpura redondeado)
 * Usa assets/icon.png para consistencia con el icono de la app.
 * Responsive para móviles.
 */
import React from 'react';
import { View, Image, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';

type TulboxIconSize = 'small' | 'medium' | 'large';

interface TulboxIconProps {
    size?: TulboxIconSize;
    /** Fondo blanco detrás del icono (evita trama de transparencia) */
    withWhiteBackground?: boolean;
    style?: ViewStyle;
}

const SIZE_MAP: Record<TulboxIconSize, number> = {
    small: 48,
    medium: 96,
    large: 120,
};

export function TulboxIcon({ size = 'medium', withWhiteBackground = true, style }: TulboxIconProps) {
    const { width } = useWindowDimensions();
    
    // Responsive: en móviles pequeños reducir proporcionalmente
    const scaleFactor = width < 360 ? 0.8 : width < 414 ? 0.95 : 1;
    const iconSize = Math.round(SIZE_MAP[size] * scaleFactor);
    const borderRadius = Math.round(iconSize * 0.2); // Esquinas redondeadas proporcionales

    return (
        <View
            style={[
                styles.wrapper,
                {
                    width: iconSize,
                    height: iconSize,
                    borderRadius,
                    backgroundColor: withWhiteBackground ? '#FFFFFF' : 'transparent',
                },
                style,
            ]}
        >
            <Image
                source={require('@/assets/icon.png')}
                style={[styles.icon, { width: iconSize, height: iconSize }]}
                resizeMode="contain"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        backgroundColor: '#FFFFFF',
    },
});
