import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme } from '@/contexts/ThemeContext';
import { SUMEE_COLORS } from '@/constants/Colors';

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

/**
 * Mapear disciplina a URL de imagen desde Sumeeapp-B/public/images/services
 * Las imágenes están en: Sumeeapp-B/public/images/services/{discipline}.jpg
 * Se sirven desde: https://sumeeapp.com/images/services/{discipline}.jpg
 */
function getServiceImageUrl(discipline?: string): string | null {
    if (!discipline) return null;
    
    // Mapeo de disciplinas a nombres de archivo de imágenes
    // Basado en las imágenes disponibles en Sumeeapp-B/public/images/services/
    const disciplineImageMap: Record<string, string> = {
        'plomeria': 'plomeria',
        'electricidad': 'electricidad',
        'aire-acondicionado': 'aire-acondicionado',
        'cctv': 'cctv',
        'wifi': 'wifi',
        'carpinteria': 'carpinteria',
        'pintura': 'pintura',
        'limpieza': 'limpieza',
        'jardineria': 'jardineria',
        'tablaroca': 'tablaroca',
        'fumigacion': 'fumigacion',
        'arquitectos-ingenieros': 'arquitectos',
        'arquitectos': 'arquitectos',
        'construccion': 'construccion',
        // Fallbacks para disciplinas sin imagen específica
        'armado': 'carpinteria',
        'montaje': 'construccion',
        'cargadores-electricos': 'electricidad',
        'paneles-solares': 'electricidad',
    };
    
    const imageName = disciplineImageMap[discipline.toLowerCase()];
    if (!imageName) return null;
    
    // URL base: Next.js sirve archivos de /public en la raíz
    // Sumeeapp-B/public/images/services/ → https://sumeeapp.com/images/services/
    return `https://sumeeapp.com/images/services/${imageName}.jpg`;
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
    const imageUrl = getServiceImageUrl(discipline);

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
                    <Text variant="caption" weight="bold" style={[styles.badgeText, { color: SUMEE_COLORS.GREEN }]}>
                        Precio Fijo
                    </Text>
                </View>
            </View>

            {/* Imagen del servicio o fallback a icono */}
            <View style={[styles.imageContainer, { backgroundColor }]}>
                {imageUrl && !imageError ? (
                    <>
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.serviceImage}
                            resizeMode="cover"
                            onError={() => {
                                console.log('[PopularProjectCard] Error loading image:', imageUrl);
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
                        <Ionicons name="checkmark-circle" size={14} color={SUMEE_COLORS.GREEN} />
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
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        // Fondo con opacidad para mejor contraste
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: SUMEE_COLORS.GREEN,
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

