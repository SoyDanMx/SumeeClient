import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme } from '@/contexts/ThemeContext';
import { TULBOX_COLORS } from '@/constants/Colors';

interface PopularProjectCardProps {
    id: string | number;
    title: string;
    details?: string; // Ej: "Hasta 65 pulgadas"
    price: string; // Ej: "$800 MXN"
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    backgroundColor?: string;
    completedCount?: number;
    discipline?: string; // Disciplina del servicio para obtener imagen
    onPress?: () => void;
}

// Cargar todas las imágenes en el nivel superior del módulo (requerido por React Native)
// Esto asegura que las imágenes estén disponibles cuando se necesiten
const SERVICE_IMAGES: Record<string, any> = {
    plomeria: require('@/assets/images/services/plomeria.jpg'),
    electricidad: require('@/assets/images/services/electricidad.jpg'),
    'aire-acondicionado': require('@/assets/images/services/aire-acondicionado.jpg'),
    cctv: require('@/assets/images/services/cctv.jpg'),
    wifi: require('@/assets/images/services/wifi.jpg'),
    carpinteria: require('@/assets/images/services/carpinteria.jpg'),
    pintura: require('@/assets/images/services/pintura.jpg'),
    limpieza: require('@/assets/images/services/limpieza.jpg'),
    jardineria: require('@/assets/images/services/jardineria.jpg'),
    tablaroca: require('@/assets/images/services/tablaroca.jpg'),
    fumigacion: require('@/assets/images/services/fumigacion.jpg'),
    arquitectos: require('@/assets/images/services/arquitectos.jpg'),
    construccion: require('@/assets/images/services/construccion.jpg'),
    'paneles-solares': require('@/assets/images/services/paneles-solares.jpg'),
    'cargadores-electricos': require('@/assets/images/services/cargadores-electricos.jpg'),
    'montaje-armado': require('@/assets/images/services/montaje-armado.jpg'),
};

function getServiceImageSource(discipline?: string): any {
    if (!discipline) {
        return null;
    }
    
    const d = discipline.toLowerCase().trim();
    
    // Mapeo resiliente usando palabras clave
    if (d.includes('plomeria')) return SERVICE_IMAGES['plomeria'];
    if (d.includes('electrica') || d.includes('electricidad')) return SERVICE_IMAGES['electricidad'];
    if (d.includes('aire') || d.includes('clima') || d.includes('ac')) return SERVICE_IMAGES['aire-acondicionado'];
    if (d.includes('cctv')) return SERVICE_IMAGES['cctv'];
    if (d.includes('wifi')) return SERVICE_IMAGES['wifi'];
    if (d.includes('carpinte')) return SERVICE_IMAGES['carpinteria'];
    if (d.includes('pintura')) return SERVICE_IMAGES['pintura'];
    if (d.includes('limpieza')) return SERVICE_IMAGES['limpieza'];
    if (d.includes('jardi')) return SERVICE_IMAGES['jardineria'];
    if (d.includes('tablaroca')) return SERVICE_IMAGES['tablaroca'];
    if (d.includes('fumiga')) return SERVICE_IMAGES['fumigacion'];
    if (d.includes('arquitect') || d.includes('ingeni')) return SERVICE_IMAGES['arquitectos'];
    if (d.includes('construc')) return SERVICE_IMAGES['construccion'];
    if (d.includes('solar') || d.includes('panel')) return SERVICE_IMAGES['paneles-solares'];
    if (d.includes('cargador') || d.includes('ev')) return SERVICE_IMAGES['cargadores-electricos'];
    if (d.includes('montaje') || d.includes('armado') || d.includes('mueble') || d.includes('soporte')) return SERVICE_IMAGES['montaje-armado'];
    
    return null;
}

export function PopularProjectCard({
    title,
    details,
    price,
    icon = 'construct',
    iconColor = '#2563EB',
    backgroundColor = '#DBEAFE',
    completedCount = 0,
    discipline,
    onPress,
}: PopularProjectCardProps) {
    const { theme } = useTheme();
    const [imageError, setImageError] = useState(false);
    const imageSource = getServiceImageSource(discipline);

    const formatCompletedCount = (count: number): string => {
        if (count >= 1000) {
            const thousands = (count / 1000).toFixed(1);
            // Remover .0 si es un número entero
            const formatted = thousands.endsWith('.0') ? thousands.slice(0, -2) : thousands;
            return `${formatted}K+`;
        }
        return `${count}+`;
    };

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {/* Badge "Precio Fijo" con alto contraste */}
            <View style={[styles.badge, { backgroundColor: '#FFFFFF' }]}>
                <View style={styles.badgeInner}>
                    <Text variant="caption" weight="bold" style={[styles.badgeText, { color: TULBOX_COLORS.GREEN }]}>
                        Precio Fijo
                    </Text>
                </View>
            </View>

            {/* Imagen del servicio o fallback a icono */}
            <View style={[styles.imageContainer, { backgroundColor }]}>
                {imageSource && !imageError ? (
                    <>
                        <Image
                            source={imageSource}
                            style={styles.serviceImage}
                            resizeMode="cover"
                            onLoad={() => {
                                console.log('[PopularProjectCard] ✅ Image loaded:', discipline);
                            }}
                            onError={(error) => {
                                // Solo loggear una vez por imagen para evitar spam
                                if (!imageError) {
                                    console.warn('[PopularProjectCard] ⚠️ Image failed, using fallback:', {
                                        discipline,
                                    });
                                }
                                setImageError(true);
                            }}
                        />
                        {/* Overlay con gradiente para mejor legibilidad */}
                        <View style={styles.imageOverlay}>
                            <View style={styles.gradientOverlay} />
                        </View>
                    </>
                ) : (
                    <View style={styles.iconFallback}>
                        <Ionicons name={icon} size={32} color={iconColor} />
                    </View>
                )}
            </View>

            {/* Contenido */}
            <View style={styles.content}>
                <Text variant="body" weight="bold" numberOfLines={2} style={styles.title}>
                    {title}
                </Text>

                {details && (
                    <Text variant="caption" color={theme.textSecondary} style={styles.details}>
                        {details}
                    </Text>
                )}

                <Text variant="h3" weight="bold" style={[styles.price, { color: theme.primary }]}>
                    {price}
                </Text>

                <Text variant="caption" color={theme.textSecondary} style={styles.guarantee}>
                    Precio fijo garantizado
                </Text>

                {/* Completados */}
                {completedCount > 0 && (
                    <View style={styles.completedRow}>
                        <Ionicons name="checkmark-circle" size={14} color={TULBOX_COLORS.GREEN} />
                        <Text variant="caption" color={theme.textSecondary} style={styles.completedText}>
                            {formatCompletedCount(completedCount)} completados
                        </Text>
                    </View>
                )}

                {/* Botón Solicitar Ahora */}
                <TouchableOpacity
                    style={[styles.requestButton, { backgroundColor: theme.primary }]}
                    onPress={onPress}
                    activeOpacity={0.8}
                >
                    <Text variant="body" weight="bold" color={theme.white} style={styles.buttonText}>
                        Solicitar Ahora
                    </Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: 280,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        marginRight: 16,
        position: 'relative',
        backgroundColor: '#FFFFFF',
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 12,
        borderRadius: 16,
        zIndex: 10,
        // Sombra para destacar sobre cualquier imagen
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5, // Para Android
        // Borde para contraste adicional
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    badgeInner: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        // Fondo con opacidad para mejor contraste
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: TULBOX_COLORS.GREEN,
        // Sombra de texto para mejor legibilidad
        textShadowColor: 'rgba(255, 255, 255, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    imageContainer: {
        width: '100%',
        height: 140, // Altura aumentada para mejor proporción (aspect ratio ~2:1)
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#DBEAFE',
    },
    serviceImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    iconFallback: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 50,
        overflow: 'hidden',
        zIndex: 1,
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 16,
        marginBottom: 4,
        minHeight: 40,
    },
    details: {
        fontSize: 12,
        marginBottom: 8,
    },
    price: {
        fontSize: 24,
        marginBottom: 4,
    },
    guarantee: {
        fontSize: 11,
        marginBottom: 12,
    },
    completedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    completedText: {
        fontSize: 12,
        marginLeft: 4,
    },
    requestButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '700',
    },
});

