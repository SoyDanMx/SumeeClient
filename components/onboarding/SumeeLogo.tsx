/**
 * Componente del Logo de Sumee
 * 
 * El logo de Sumee consiste en:
 * - Icono: Apretón de manos dentro de un corazón (púrpura/morado)
 * - Texto: "SuMee" (S y M mayúsculas, resto minúsculas)
 * 
 * Versiones disponibles:
 * - Fondo claro: Icono púrpura + texto gris oscuro
 * - Fondo oscuro: Icono púrpura claro + texto gris claro
 * - Fondo oscuro alternativo: Icono blanco + texto blanco
 * 
 * Integración según principios UX/UI:
 * - Jerarquía visual prominente
 * - Espaciado generoso (breathing room)
 * - Animación de entrada suave
 * - Contraste alto para accesibilidad
 * - Responsive sizing
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, Image, Animated, Dimensions } from 'react-native';

interface SumeeLogoProps {
    size?: 'small' | 'medium' | 'large';
    variant?: 'light' | 'dark' | 'white';
    showText?: boolean;
    style?: ViewStyle;
}

// Tamaños responsive basados en ancho de pantalla
const getResponsiveSize = (baseSize: 'small' | 'medium' | 'large') => {
    const { width } = Dimensions.get('window');
    const scaleFactor = width < 375 ? 0.85 : width > 414 ? 1.15 : 1.0;
    
    const sizes = {
        small: { icon: 40, text: 16, spacing: 8 },
        medium: { icon: 80, text: 24, spacing: 12 },
        large: { icon: 120, text: 32, spacing: 16 },
    };
    
    const base = sizes[baseSize];
    return {
        icon: Math.round(base.icon * scaleFactor),
        text: Math.round(base.text * scaleFactor),
        spacing: Math.round(base.spacing * scaleFactor),
    };
};

const LOGO_COLORS = {
    light: {
        icon: '#820AD1', // Púrpura Sumee oficial (RGB: 130, 10, 209)
        text: '#1F2937', // Gris oscuro
    },
    dark: {
        icon: '#A855F7', // Púrpura claro Sumee
        text: '#E5E7EB', // Gris claro
    },
    white: {
        icon: '#FFFFFF', // Blanco
        text: '#FFFFFF', // Blanco
    },
};

export function SumeeLogo({
    size = 'medium',
    variant = 'light',
    showText = true,
    style,
}: SumeeLogoProps) {
    const dimensions = getResponsiveSize(size);
    const colors = LOGO_COLORS[variant];
    
    // Animaciones de entrada
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    
    useEffect(() => {
        // Animación de entrada: fade-in + scale
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 400,
                delay: 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Determinar qué imagen usar según la variante
    // Nota: En React Native, require() debe ser estático
    // Si las imágenes no existen, el require() fallará en tiempo de compilación
    // Por ahora, usamos un flag para indicar si queremos usar imágenes
    // Cuando agregues las imágenes, descomenta las líneas correspondientes
    
    const USE_LOGO_IMAGES = false; // Cambiar a true cuando agregues las imágenes
    
    let logoSource: any = null;
    let useImage = false;
    
    if (USE_LOGO_IMAGES) {
        // Cuando agregues las imágenes, descomenta estas líneas:
        // if (variant === 'light') {
        //     logoSource = require('@/assets/images/logo-light.png');
        //     useImage = true;
        // } else if (variant === 'dark') {
        //     logoSource = require('@/assets/images/logo-dark.png');
        //     useImage = true;
        // } else if (variant === 'white') {
        //     logoSource = require('@/assets/images/logo-white.png');
        //     useImage = true;
        // }
    }

    return (
        <Animated.View 
            style={[
                styles.container, 
                style,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            <View style={[styles.iconContainer, { width: dimensions.icon, height: dimensions.icon }]}>
                {useImage ? (
                    // Usar imagen real del logo
                    <Image
                        source={logoSource}
                        style={[
                            styles.logoImage,
                            { width: dimensions.icon, height: dimensions.icon },
                        ]}
                        resizeMode="contain"
                    />
                ) : (
                    // Fallback: renderizar con iconos (placeholder)
                    <View style={[styles.logoWrapper, { width: dimensions.icon, height: dimensions.icon }]}>
                        <View style={[styles.logoPlaceholder, { backgroundColor: colors.icon + '20' }]}>
                            <Text style={[styles.logoPlaceholderText, { color: colors.icon, fontSize: dimensions.icon * 0.4 }]}>
                                SuMee
                            </Text>
                        </View>
                    </View>
                )}
            </View>
            {showText && !useImage && (
                <Text
                    style={[
                        styles.text,
                        {
                            fontSize: dimensions.text,
                            marginTop: dimensions.spacing,
                            color: colors.text,
                        },
                    ]}
                >
                    SuMee
                </Text>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        // Sombra sutil para profundidad (según UX/UI)
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // Android
    },
    logoImage: {
        // Imagen real del logo
    },
    logoWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    logoPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        // Sombra sutil
        shadowColor: '#820AD1',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    logoPlaceholderText: {
        fontWeight: '700',
        letterSpacing: 1,
    },
    text: {
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

