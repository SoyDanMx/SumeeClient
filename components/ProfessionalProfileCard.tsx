/**
 * ProfessionalProfileCard - Componente de Vanguardia
 * Muestra el perfil completo del profesional con foto, badges, estrellas y todas las características
 * Diseñado para generar confianza en el cliente
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Card } from './Card';
import { Badge } from './Badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { SUMEE_COLORS } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { resolveAvatarUrl } from '@/utils/avatar';
import { openWhatsApp } from '@/utils/whatsapp';

interface ProfessionalProfileCardProps {
    professionalId: string;
    leadId?: string;
    onPress?: () => void;
}

interface ProfessionalData {
    // Profile data
    full_name: string;
    profession?: string;
    avatar_url?: string;
    whatsapp?: string;
    phone?: string;
    calificacion_promedio?: number;
    review_count?: number;
    areas_servicio?: string[];
    verified?: boolean;
    
    // Stats data
    jobs_completed_count?: number;
    total_points?: number;
    current_level_id?: number;
    expediente_status?: string;
    
    // Badges (simplified)
    top_badges?: Array<{
        id: string;
        name: string;
        icon: string;
        level: 'bronze' | 'silver' | 'gold' | 'diamond';
    }>;
}

export function ProfessionalProfileCard({ 
    professionalId, 
    leadId,
    onPress 
}: ProfessionalProfileCardProps) {
    const { theme } = useTheme();
    const router = useRouter();
    const [professional, setProfessional] = useState<ProfessionalData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfessionalData();
    }, [professionalId]);

    const loadProfessionalData = async () => {
        try {
            setLoading(true);
            console.log('[ProfessionalProfileCard] ========================================');
            console.log('[ProfessionalProfileCard] Loading professional:', professionalId);
            console.log('[ProfessionalProfileCard] Professional ID type:', typeof professionalId);
            console.log('[ProfessionalProfileCard] Professional ID length:', professionalId?.length);

            if (!professionalId) {
                console.error('[ProfessionalProfileCard] ❌ No professional ID provided!');
                setLoading(false);
                setProfessional({
                    full_name: 'ID de profesional no válido',
                    profession: 'No disponible',
                    calificacion_promedio: 0,
                    review_count: 0,
                    jobs_completed_count: 0,
                });
                return;
            }

            // Obtener datos del perfil
            let profileData: any = null;
            const { data, error: profileError } = await supabase
                .from('profiles')
                .select(`
                    full_name,
                    profession,
                    avatar_url,
                    whatsapp,
                    phone,
                    calificacion_promedio,
                    areas_servicio,
                    user_id
                `)
                .eq('user_id', professionalId)
                .single();
            
            profileData = data;

            if (profileError) {
                console.error('[ProfessionalProfileCard] ❌ Error loading profile:', profileError);
                console.error('[ProfessionalProfileCard] Error code:', profileError.code);
                console.error('[ProfessionalProfileCard] Error message:', profileError.message);
                console.error('[ProfessionalProfileCard] Professional ID:', professionalId);
                console.error('[ProfessionalProfileCard] Error details:', profileError.details);
                console.error('[ProfessionalProfileCard] Error hint:', profileError.hint);
                
                // Si es un error de "no encontrado", intentar sin .single() para ver si hay datos
                if (profileError.code === 'PGRST116') {
                    console.log('[ProfessionalProfileCard] Trying without .single()...');
                    const { data: altData, error: altError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('user_id', professionalId)
                        .limit(1);
                    
                    if (!altError && altData && altData.length > 0) {
                        console.log('[ProfessionalProfileCard] ✅ Found profile with alternative query:', altData[0].full_name);
                        // Usar los datos encontrados
                        profileData = altData[0];
                    } else {
                        console.error('[ProfessionalProfileCard] ❌ Alternative query also failed:', altError);
                        setLoading(false);
                        setProfessional({
                            full_name: 'Profesional no disponible',
                            profession: 'No disponible',
                            calificacion_promedio: 0,
                            review_count: 0,
                            jobs_completed_count: 0,
                        });
                        return;
                    }
                } else {
                    setLoading(false);
                    setProfessional({
                        full_name: 'Profesional no disponible',
                        profession: 'No disponible',
                        calificacion_promedio: 0,
                        review_count: 0,
                        jobs_completed_count: 0,
                    });
                    return;
                }
            }

            if (!profileData) {
                console.warn('[ProfessionalProfileCard] ⚠️ No profile data returned');
                console.warn('[ProfessionalProfileCard] Professional ID searched:', professionalId);
                
                // Intentar buscar por user_type también
                console.log('[ProfessionalProfileCard] Trying alternative search...');
                const { data: altData, error: altError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', professionalId)
                    .maybeSingle();
                
                if (!altError && altData) {
                    console.log('[ProfessionalProfileCard] ✅ Found with maybeSingle():', altData.full_name);
                    profileData = altData;
                } else {
                    console.error('[ProfessionalProfileCard] ❌ Alternative search also failed:', altError);
                    setLoading(false);
                    setProfessional({
                        full_name: 'Profesional no encontrado',
                        profession: 'No disponible',
                        calificacion_promedio: 0,
                        review_count: 0,
                        jobs_completed_count: 0,
                    });
                    return;
                }
            }

            console.log('[ProfessionalProfileCard] ✅ Profile loaded:', profileData.full_name);
            console.log('[ProfessionalProfileCard] Profile data:', {
                full_name: profileData.full_name,
                profession: profileData.profession,
                user_id: profileData.user_id,
                has_avatar: !!profileData.avatar_url,
            });

            // Obtener estadísticas del profesional
            const { data: statsData, error: statsError } = await supabase
                .from('professional_stats')
                .select(`
                    jobs_completed_count,
                    total_points,
                    current_level_id,
                    expediente_status,
                    review_count
                `)
                .eq('user_id', professionalId)
                .single();

            // Obtener badges destacados (top 3)
            // Nota: Si la tabla user_badges no existe o no tiene relación, usar datos mock
            let badgesData = null;
            try {
                const { data, error } = await supabase
                    .from('user_badges')
                    .select('badge_id, unlocked_at')
                    .eq('user_id', professionalId)
                    .order('unlocked_at', { ascending: false })
                    .limit(3);
                
                if (!error && data) {
                    badgesData = data;
                }
            } catch (error) {
                console.warn('[ProfessionalProfileCard] Could not load badges, using defaults');
                // Usar badges mock basados en estadísticas
                badgesData = [];
                if (statsData?.jobs_completed_count && statsData.jobs_completed_count >= 1) {
                    badgesData.push({ badge_id: 'first_job', unlocked_at: new Date().toISOString() });
                }
                if (statsData?.jobs_completed_count && statsData.jobs_completed_count >= 10) {
                    badgesData.push({ badge_id: 'jobs_10', unlocked_at: new Date().toISOString() });
                }
                if (statsData?.average_rating && statsData.average_rating >= 4.5) {
                    badgesData.push({ badge_id: 'rating_45', unlocked_at: new Date().toISOString() });
                }
            }

            const professionalData: ProfessionalData = {
                full_name: profileData?.full_name || 'Profesional Sumee',
                profession: profileData?.profession,
                avatar_url: profileData?.avatar_url,
                whatsapp: profileData?.whatsapp || profileData?.phone,
                phone: profileData?.phone,
                calificacion_promedio: profileData?.calificacion_promedio || 0,
                review_count: statsData?.review_count || 0,
                areas_servicio: Array.isArray(profileData?.areas_servicio) 
                    ? profileData.areas_servicio 
                    : [],
                verified: false, // Campo no existe en la BD, usar false por defecto
                jobs_completed_count: statsData?.jobs_completed_count || 0,
                total_points: statsData?.total_points || 0,
                current_level_id: statsData?.current_level_id || 1,
                expediente_status: statsData?.expediente_status,
                top_badges: (badgesData || []).map((b: any) => {
                    // Mapear badge_id a información conocida
                    const badgeMap: Record<string, { name: string; icon: string; level: string }> = {
                        'first_job': { name: 'Primera Chamba', icon: '🎯', level: 'bronze' },
                        'jobs_10': { name: 'Manos a la Obra', icon: '🔧', level: 'bronze' },
                        'jobs_50': { name: 'Profesional Dedicado', icon: '⚡', level: 'silver' },
                        'jobs_100': { name: 'Centenario', icon: '💯', level: 'gold' },
                        'rating_4': { name: 'Buena Reputación', icon: '⭐', level: 'bronze' },
                        'rating_45': { name: 'Excelente', icon: '🌟', level: 'silver' },
                        'rating_5_perfect': { name: 'Perfecto', icon: '✨', level: 'gold' },
                        'identity_verified': { name: 'Identidad Verificada', icon: '🆔', level: 'silver' },
                        'profile_perfect': { name: 'Perfil de Hierro', icon: '👤', level: 'bronze' },
                        'super_pro': { name: 'Super PRO', icon: '🛡️', level: 'diamond' },
                    };
                    
                    const badgeInfo = badgeMap[b.badge_id] || { name: 'Logro', icon: '⭐', level: 'bronze' };
                    return {
                        id: b.badge_id,
                        name: badgeInfo.name,
                        icon: badgeInfo.icon,
                        level: badgeInfo.level as 'bronze' | 'silver' | 'gold' | 'diamond',
                    };
                }),
            };

            setProfessional(professionalData);
            console.log('[ProfessionalProfileCard] ✅ Professional data set:', professionalData.full_name);
            console.log('[ProfessionalProfileCard] ========================================');
        } catch (error: any) {
            console.error('[ProfessionalProfileCard] ❌ Unexpected error:', error);
            console.error('[ProfessionalProfileCard] Error stack:', error?.stack);
            console.error('[ProfessionalProfileCard] Professional ID:', professionalId);
            setLoading(false);
            setProfessional({
                full_name: 'Error al cargar profesional',
                profession: 'No disponible',
                calificacion_promedio: 0,
                review_count: 0,
                jobs_completed_count: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <Ionicons key={i} name="star" size={18} color="#FBBF24" />
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <Ionicons key={i} name="star-half" size={18} color="#FBBF24" />
                );
            } else {
                stars.push(
                    <Ionicons key={i} name="star-outline" size={18} color="#D1D5DB" />
                );
            }
        }
        return stars;
    };

    const getLevelName = (levelId: number) => {
        const levels: Record<number, string> = {
            1: 'Principiante',
            2: 'Avanzado',
            3: 'Experto',
            4: 'Maestro',
            5: 'Leyenda',
        };
        return levels[levelId] || 'Principiante';
    };

    const getLevelColor = (levelId: number) => {
        const colors: Record<number, string> = {
            1: '#6B7280', // Gray
            2: '#3B82F6', // Blue
            3: '#10B981', // Green
            4: '#F59E0B', // Gold
            5: '#8B5CF6', // Purple
        };
        return colors[levelId] || '#6B7280';
    };

    const getBadgeLevelColor = (level: string) => {
        const colors: Record<string, string> = {
            bronze: '#CD7F32',
            silver: '#C0C0C0',
            gold: '#FFD700',
            diamond: '#B9F2FF',
        };
        return colors[level] || '#6B7280';
    };

    const handleWhatsApp = () => {
        if (professional?.whatsapp) {
            const serviceName = leadId ? 'el servicio' : 'tu servicio';
            openWhatsApp(professional.whatsapp, `Hola ${professional.full_name}, tengo una consulta sobre ${serviceName}`);
        }
    };

    const handleViewProfile = () => {
        if (onPress) {
            onPress();
        } else {
            router.push(`/professional/${professionalId}`);
        }
    };

    if (loading) {
        return (
            <Card variant="elevated" style={styles.card}>
                <View style={styles.loadingContainer}>
                    <Ionicons name="hourglass-outline" size={32} color={theme.textSecondary} />
                    <Text variant="body" color={theme.textSecondary}>Cargando perfil...</Text>
                </View>
            </Card>
        );
    }

    if (!professional) {
        return null;
    }

    const rating = professional.calificacion_promedio || 0;
    const reviewCount = professional.review_count || 0;
    const completedJobs = professional.jobs_completed_count || 0;

    return (
        <Card variant="elevated" style={styles.card}>
            <View>
                {/* Header con Foto y Badge Verificado */}
                <View style={styles.header}>
                    <View style={styles.photoContainer}>
                        {professional.avatar_url ? (
                            <Image 
                                source={{ 
                                    uri: resolveAvatarUrl(professional.avatar_url),
                                    cache: 'reload'
                                }} 
                                style={styles.photo}
                                resizeMode="cover"
                                onError={() => {
                                    console.warn('[ProfessionalProfileCard] Error loading avatar');
                                }}
                            />
                        ) : (
                            <View style={[styles.photoPlaceholder, { backgroundColor: (theme.primary || '#820AD1') + '20' }]}>
                                <Ionicons name="person" size={48} color={theme.primary || '#820AD1'} />
                            </View>
                        )}
                        {professional.verified && (
                            <View style={[styles.verifiedBadge, { backgroundColor: '#3B82F6' }]}>
                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                            </View>
                        )}
                    </View>

                    <View style={styles.headerInfo}>
                        <View style={styles.nameRow}>
                            <Text variant="h2" weight="bold" style={styles.name}>
                                {professional.full_name}
                            </Text>
                            {professional.expediente_status === 'approved' && (
                                <View style={[styles.expedienteBadge, { backgroundColor: SUMEE_COLORS.GREEN }]}>
                                    <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
                                    <Text variant="caption" weight="bold" color="#FFFFFF" style={styles.badgeText}>
                                        Verificado
                                    </Text>
                                </View>
                            )}
                        </View>
                        
                        {professional.profession && (
                            <Text variant="body" color={theme.textSecondary} style={styles.profession}>
                                {professional.profession}
                            </Text>
                        )}

                        {/* Nivel del Profesional */}
                        {professional.current_level_id && professional.current_level_id > 1 && (
                            <View style={[styles.levelBadge, { backgroundColor: getLevelColor(professional.current_level_id) + '20' }]}>
                                <Ionicons name="trophy" size={14} color={getLevelColor(professional.current_level_id)} />
                                <Text variant="caption" weight="bold" style={{ color: getLevelColor(professional.current_level_id) }}>
                                    {getLevelName(professional.current_level_id)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Rating y Reviews */}
                <View style={styles.ratingSection}>
                    <View style={styles.starsContainer}>
                        {renderStars(rating)}
                    </View>
                    <View style={styles.ratingInfo}>
                        <Text variant="h3" weight="bold" style={styles.ratingNumber}>
                            {rating.toFixed(1)}
                        </Text>
                        {reviewCount > 0 && (
                            <Text variant="caption" color={theme.textSecondary}>
                                ({reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'})
                            </Text>
                        )}
                    </View>
                </View>

                {/* Estadísticas */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Ionicons name="checkmark-circle" size={20} color={theme.primary || '#820AD1'} />
                        <Text variant="body" weight="bold">
                            {completedJobs}
                        </Text>
                        <Text variant="caption" color={theme.textSecondary}>
                            {completedJobs === 1 ? 'trabajo' : 'trabajos'} completados
                        </Text>
                    </View>
                    {professional.total_points && professional.total_points > 0 && (
                        <View style={styles.statItem}>
                            <Ionicons name="star" size={20} color="#FBBF24" />
                            <Text variant="body" weight="bold">
                                {professional.total_points}
                            </Text>
                            <Text variant="caption" color={theme.textSecondary}>
                                puntos
                            </Text>
                        </View>
                    )}
                </View>

                {/* Badges Destacados */}
                {professional.top_badges && professional.top_badges.length > 0 && (
                    <View style={styles.badgesSection}>
                        <Text variant="caption" weight="bold" color={theme.textSecondary} style={styles.badgesTitle}>
                            Logros Destacados
                        </Text>
                        <View style={styles.badgesContainer}>
                            {professional.top_badges.map((badge) => (
                                <View 
                                    key={badge.id} 
                                    style={[
                                        styles.badgeItem, 
                                        { backgroundColor: getBadgeLevelColor(badge.level) + '20' }
                                    ]}
                                >
                                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                                    <Text variant="caption" weight="medium" style={{ color: getBadgeLevelColor(badge.level) }}>
                                        {badge.name}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Áreas de Servicio */}
                {professional.areas_servicio && professional.areas_servicio.length > 0 && (
                    <View style={styles.areasSection}>
                        <Text variant="caption" weight="bold" color={theme.textSecondary} style={styles.areasTitle}>
                            Especialidades
                        </Text>
                        <View style={styles.areasContainer}>
                            {professional.areas_servicio.slice(0, 5).map((area, index) => (
                                <View key={index} style={[styles.areaTag, { backgroundColor: (theme.primary || '#820AD1') + '15' }]}>
                                    <Text variant="caption" style={{ color: theme.primary || '#820AD1' }}>
                                        {area}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Botones de Acción */}
                {professional.whatsapp && (
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[styles.whatsappButton, { backgroundColor: SUMEE_COLORS.GREEN }]}
                            onPress={handleWhatsApp}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                            <Text variant="body" weight="bold" color="#FFFFFF">
                                Contactar
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 20,
        marginBottom: 0,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    header: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    photoContainer: {
        position: 'relative',
        marginRight: 16,
    },
    photo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#F3F4F6',
    },
    photoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#F3F4F6',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    headerInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 4,
    },
    name: {
        marginRight: 8,
    },
    expedienteBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    badgeText: {
        fontSize: 10,
    },
    profession: {
        marginBottom: 8,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    ratingSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    starsContainer: {
        flexDirection: 'row',
        marginRight: 12,
    },
    ratingInfo: {
        flex: 1,
    },
    ratingNumber: {
        marginBottom: 2,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    badgesSection: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    badgesTitle: {
        marginBottom: 12,
    },
    badgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    badgeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
    },
    badgeIcon: {
        fontSize: 16,
    },
    areasSection: {
        marginBottom: 16,
    },
    areasTitle: {
        marginBottom: 12,
    },
    areasContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    areaTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    actionsContainer: {
        gap: 12,
        marginTop: 8,
    },
    whatsappButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
    },
});

