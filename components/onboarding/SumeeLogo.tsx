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
import { Ionicons } from '@expo/vector-icons';

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
        small: { icon: 60, text: 18, spacing: 10 },
        medium: { icon: 120, text: 28, spacing: 14 },
        large: { icon: 180, text: 40, spacing: 20 }, // Aumentado de 120 a 180 para welcome screen
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
    // Nota: En React Native, require() debe ser estático y fallará si el archivo no existe
    // Por seguridad, mantenemos USE_LOGO_IMAGES = false hasta que el archivo exista
    // Cuando agregues la imagen, cambia USE_LOGO_IMAGES = true
    
    const USE_LOGO_IMAGES = true; // ✅ Logo integrado - activado
    
    let logoSource: any = null;
    let useImage = false;
    
    // Cargar imágenes según la variante
    if (USE_LOGO_IMAGES) {
        if (variant === 'white') {
            // Para fondo oscuro (welcome screen con gradiente púrpura)
            logoSource = require('@/assets/images/logo-white.png');
            useImage = true;
        } else if (variant === 'light') {
            // Para fondo claro - usar logo-white como fallback si no existe logo-light
            logoSource = require('@/assets/images/logo-white.png');
            useImage = true;
        } else if (variant === 'dark') {
            // Para fondo oscuro alternativo - usar logo-white como fallback si no existe logo-dark
            logoSource = require('@/assets/images/logo-white.png');
            useImage = true;
        }
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
                    // Fallback: renderizar logo directamente sin contenedor extra
                    // Logo simplificado: corazón grande con apretón de manos
                    <View style={styles.iconHeartContainer}>
                        {/* Corazón principal - más grande y visible */}
                        <Ionicons 
                            name="heart" 
                            size={dimensions.icon * 0.8} 
                            color={colors.icon}
                            style={styles.heartIcon}
                        />
                        {/* Apretón de manos superpuesto en el centro */}
                        <View style={styles.handshakeContainer}>
                            <Ionicons 
                                name="hand-left" 
                                size={dimensions.icon * 0.35} 
                                color={colors.icon}
                                style={[
                                    styles.handIcon, 
                                    {
                                        transform: [
                                            { rotate: '-25deg' }, 
                                            { translateX: -dimensions.icon * 0.18 }
                                        ]
                                    }
                                ]}
                            />
                            <Ionicons 
                                name="hand-right" 
                                size={dimensions.icon * 0.35} 
                                color={colors.icon}
                                style={[
                                    styles.handIcon,
                                    {
                                        transform: [
                                            { rotate: '25deg' }, 
                                            { translateX: dimensions.icon * 0.18 }
                                        ]
                                    }
                                ]}
                            />
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
        // Ya no se usa, el logo se renderiza directamente
    },
    iconHeartContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        // Sombra sutil para profundidad
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    heartIcon: {
        position: 'absolute',
        zIndex: 1,
    },
    handshakeContainer: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '70%',
        height: '70%',
        zIndex: 2,
    },
    handIcon: {
        position: 'absolute',
    },
    handLeft: {
        // Transform se aplica dinámicamente en el componente
    },
    handRight: {
        // Transform se aplica dinámicamente en el componente
    },
    text: {
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

