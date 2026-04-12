import React, { memo, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Card } from './Card';
import { useTheme } from '@/contexts/ThemeContext';
import { TULBOX_COLORS } from '@/constants/Colors';
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
    isOnline?: boolean;
    distance?: number;
    areasServicio?: string[];
    whatsapp?: string;
    onPress?: () => void;
}

function ProfessionalCardInner({
    name,
    specialty,
    rating,
    completedJobs,
    photo,
    verified = true,
    isOnline = false,
    distance,
    areasServicio = [],
    whatsapp,
    onPress,
}: ProfessionalCardProps) {
    const { theme } = useTheme();

    const stars = useMemo(() => {
        const validRating = rating && rating > 0 ? rating : 0;
        const fullStars = Math.floor(validRating);
        const hasHalfStar = validRating % 1 >= 0.5;
        const out: React.ReactNode[] = [];
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                out.push(<Ionicons key={i} name="star" size={14} color="#FBBF24" accessibilityElementsHidden />);
            } else if (i === fullStars && hasHalfStar) {
                out.push(<Ionicons key={i} name="star-half" size={14} color="#FBBF24" accessibilityElementsHidden />);
            } else {
                out.push(<Ionicons key={i} name="star-outline" size={14} color="#D1D5DB" accessibilityElementsHidden />);
            }
        }
        return out;
    }, [rating]);

    const handleWhatsApp = useCallback(() => {
        if (whatsapp) {
            openWhatsApp(whatsapp, `Hola ${name}, me interesa tu servicio de ${specialty}`);
        }
    }, [whatsapp, name, specialty]);

    const ratingValue = rating && rating > 0 ? rating : 0;
    const profileAccessibilityLabel = `${name}, ${specialty}. Calificación ${ratingValue.toFixed(1)} de 5.`;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.container}
            accessibilityRole="button"
            accessibilityLabel={profileAccessibilityLabel}
            accessibilityHint="Abre el perfil del profesional"
        >
            <Card variant="elevated" style={styles.card}>
                <View style={styles.content}>
                    <View style={styles.photoContainer}>
                        {photo ? (
                            <Image
                                source={{
                                    uri: resolveAvatarUrl(photo),
                                    cache: 'reload',
                                }}
                                style={styles.photo}
                                resizeMode="cover"
                                accessible
                                accessibilityLabel={`Foto de perfil de ${name}`}
                                onError={() => {
                                    console.warn('[ProfessionalCard] Error loading avatar:', photo);
                                }}
                            />
                        ) : (
                            <View
                                style={[styles.photoPlaceholder, { backgroundColor: theme.primary + '20' }]}
                                accessible
                                accessibilityLabel={`Sin foto de perfil, ${name}`}
                            >
                                <Ionicons name="person" size={40} color={theme.primary} importantForAccessibility="no" />
                            </View>
                        )}

                        {isOnline && (
                            <View
                                style={[styles.onlineBadge, { backgroundColor: '#10B981', borderColor: '#FFFFFF' }]}
                                accessibilityLabel="En línea"
                            />
                        )}

                        {verified && (
                            <View
                                style={[styles.verifiedBadge, { backgroundColor: '#3B82F6' }]}
                                accessibilityLabel="Profesional verificado"
                            >
                                <Ionicons name="checkmark" size={14} color="#FFFFFF" importantForAccessibility="no" />
                            </View>
                        )}
                    </View>

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
                                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Contactar por WhatsApp a ${name}`}
                                >
                                    <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" importantForAccessibility="no" />
                                </TouchableOpacity>
                            )}
                        </View>

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

                        <View style={styles.ratingRow}>
                            <View style={styles.stars} importantForAccessibility="no">
                                {stars}
                            </View>
                            <Text variant="caption" weight="medium" style={[styles.rating, { marginLeft: 4 }]}>
                                {ratingValue.toFixed(1)}
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

                        {distance !== undefined && (
                            <View style={styles.distanceRow}>
                                <Ionicons name="location" size={14} color={theme.primary} style={{ marginRight: 4 }} accessibilityElementsHidden />
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

export const ProfessionalCard = memo(ProfessionalCardInner);

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 0,
    },
    card: {
        width: '100%',
        padding: 0,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
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
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        left: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        backgroundColor: '#10B981',
        zIndex: 10,
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
        width: 44,
        height: 44,
        borderRadius: 22,
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
