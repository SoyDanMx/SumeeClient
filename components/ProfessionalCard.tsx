import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Card } from './Card';
import { useTheme } from '@/contexts/ThemeContext';
import { SUMEE_COLORS } from '@/constants/Colors';
import { formatDistance } from '@/services/professionals';
import { openWhatsApp } from '@/utils/whatsapp';
import { resolveAvatarUrl, DEFAULT_AVATAR } from '@/utils/avatar';

interface ProfessionalCardProps {
    id: string | number;
    name: string;
    specialty: string;
    rating: number;
    completedJobs: number;
    photo?: string;
    verified?: boolean;
    distance?: number; // km desde usuario
    areasServicio?: string[]; // Tags/skills como en la web
    whatsapp?: string; // Para botón de contacto
    onPress?: () => void;
}

export function ProfessionalCard({ 
    name, 
    specialty, 
    rating, 
    completedJobs, 
    photo, 
    verified = true,
    distance,
    areasServicio = [],
    whatsapp,
    onPress 
}: ProfessionalCardProps) {
    const { theme } = useTheme();

    // Renderizar estrellas
    const renderStars = () => {
        // Asegurar que rating siempre sea un número válido
        const validRating = rating && rating > 0 ? rating : 0;
        const stars = [];
        const fullStars = Math.floor(validRating);
        const hasHalfStar = validRating % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <Ionicons key={i} name="star" size={14} color="#FBBF24" />
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <Ionicons key={i} name="star-half" size={14} color="#FBBF24" />
                );
            } else {
                stars.push(
                    <Ionicons key={i} name="star-outline" size={14} color="#D1D5DB" />
                );
            }
        }
        return stars;
    };

    const handleWhatsApp = () => {
        if (whatsapp) {
            openWhatsApp(whatsapp, `Hola ${name}, me interesa tu servicio de ${specialty}`);
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.container}
        >
            <Card variant="elevated" style={styles.card}>
                <View style={styles.content}>
                    {/* Foto del profesional */}
                    <View style={styles.photoContainer}>
                        {photo ? (
                            <Image 
                                source={{ 
                                    uri: resolveAvatarUrl(photo),
                                    cache: 'reload' // Forzar recarga para detectar fotos actualizadas
                                }} 
                                style={styles.photo}
                                resizeMode="cover"
                                onError={() => {
                                    // Si falla la carga, usar placeholder
                                    console.warn('[ProfessionalCard] Error loading avatar:', photo);
                                }}
                            />
                        ) : (
                            <View style={[styles.photoPlaceholder, { backgroundColor: theme.primary + '20' }]}>
                                <Ionicons name="person" size={40} color={theme.primary} />
                            </View>
                        )}
                        {verified && (
                            <View style={[styles.verifiedBadge, { backgroundColor: '#3B82F6' }]}>
                                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                            </View>
                        )}
                    </View>

                    {/* Información Principal */}
                    <View style={styles.info}>
                        <View style={styles.headerRow}>
                            <View style={styles.nameContainer}>
                                <Text variant="body" weight="bold" numberOfLines={1} style={styles.name}>
                                    {name}
                                </Text>
                                <Text variant="caption" color={theme.textSecondary} numberOfLines={1} style={styles.specialty}>
                                    {specialty}
                                </Text>
                            </View>
                            {whatsapp && (
                                <TouchableOpacity
                                    style={[styles.whatsappButton, { backgroundColor: '#25D366' }]}
                                    onPress={handleWhatsApp}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Tags/Skills (areas_servicio) */}
                        {areasServicio && areasServicio.length > 0 && (
                            <View style={styles.tagsContainer}>
                                {areasServicio.slice(0, 3).map((area, index) => (
                                    <View key={index} style={[styles.tag, { backgroundColor: '#DBEAFE', marginRight: 6, marginBottom: 4 }]}>
                                        <Text variant="caption" style={[styles.tagText, { color: '#1E40AF' }]}>
                                            {area}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Rating y Reviews */}
                        <View style={styles.ratingRow}>
                            <View style={styles.stars}>
                                {renderStars()}
                            </View>
                            <Text variant="caption" weight="medium" style={[styles.rating, { marginLeft: 4 }]}>
                                {(rating && rating > 0 ? rating : 0).toFixed(1)}
                            </Text>
                            {completedJobs > 0 && (
                                <Text variant="caption" color={theme.textSecondary} style={[styles.reviews, { marginLeft: 4 }]}>
                                    ({completedJobs} {completedJobs === 1 ? 'reseña' : 'reseñas'})
                                </Text>
                            )}
                            {completedJobs === 0 && (
                                <Text variant="caption" color={theme.textSecondary} style={[styles.reviews, { marginLeft: 4 }]}>
                                    (Sin reseñas)
                                </Text>
                            )}
                        </View>

                        {/* Distancia */}
                        {distance !== undefined && (
                            <View style={styles.distanceRow}>
                                <Ionicons name="location" size={14} color={theme.primary} style={{ marginRight: 4 }} />
                                <Text variant="caption" color={theme.primary} weight="medium" style={styles.distance}>
                                    {formatDistance(distance)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 0,
    },
    card: {
        width: '100%',
        padding: 0,
        borderRadius: 12, // Cambiado de 0 a 12 para cards en carrusel
        borderWidth: 1, // Agregado borde para cards en carrusel
        borderColor: '#E5E7EB', // Color de borde
        borderBottomWidth: 1, // Mantener borde inferior
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FFFFFF', // Fondo blanco para cards
    },
    content: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'flex-start',
    },
    photoContainer: {
        position: 'relative',
        marginRight: 16,
    },
    photo: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 3,
        borderColor: '#F3F4F6',
    },
    photoPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#F3F4F6',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    info: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    nameContainer: {
        flex: 1,
    },
    name: {
        marginBottom: 2,
        fontSize: 16,
    },
    specialty: {
        fontSize: 13,
    },
    whatsappButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '600',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    stars: {
        flexDirection: 'row',
        marginRight: 6,
    },
    rating: {
        fontSize: 13,
        color: '#1F2937',
    },
    reviews: {
        fontSize: 12,
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    distance: {
        fontSize: 12,
    },
});

