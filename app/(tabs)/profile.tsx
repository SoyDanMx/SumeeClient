import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { SUMEE_COLORS } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { openWhatsApp } from '@/utils/whatsapp';
import { SupportModal } from '@/components/SupportModal';
import { GuaranteeModal } from '@/components/GuaranteeModal';
import { NotificationsModal } from '@/components/NotificationsModal';
import { Linking } from 'react-native';

const { width } = Dimensions.get('window');

interface ClientStats {
    total_services: number;
    completed_services: number;
    pending_services: number;
    average_rating_given: number;
    total_spent: number;
}

interface ClientBadge {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    unlockedAt?: Date;
}

export default function ProfileScreen() {
    const { theme } = useTheme();
    const { user, profile, signOut } = useAuth();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [showGuaranteeModal, setShowGuaranteeModal] = useState(false);
    const [showNotificationsModal, setShowNotificationsModal] = useState(false);
    const [stats, setStats] = useState<ClientStats>({
        total_services: 0,
        completed_services: 0,
        pending_services: 0,
        average_rating_given: 0,
        total_spent: 0,
    });
    const [badges, setBadges] = useState<ClientBadge[]>([]);

    useEffect(() => {
        loadProfileData();
    }, [user]);

    const loadProfileData = async () => {
        if (!user) return;

        try {
            // Cargar estadísticas
            const { data: leadsData } = await supabase
                .from('leads')
                .select('id, status, agreed_price')
                .eq('cliente_id', user.id);

            const total = leadsData?.length || 0;
            const completed = leadsData?.filter(l => l.status === 'completed').length || 0;
            const pending = leadsData?.filter(l => l.status === 'pending' || l.status === 'accepted').length || 0;
            const totalSpent = leadsData
                ?.filter(l => l.status === 'completed' && l.agreed_price)
                .reduce((sum, l) => sum + (parseFloat(String(l.agreed_price)) || 0), 0) || 0;

            // Cargar calificaciones dadas
            const { data: reviewsData } = await supabase
                .from('reviews')
                .select('rating')
                .eq('client_id', user.id);

            const avgRating = reviewsData && reviewsData.length > 0
                ? reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsData.length
                : 0;

            setStats({
                total_services: total,
                completed_services: completed,
                pending_services: pending,
                average_rating_given: avgRating,
                total_spent: totalSpent,
            });

            // Calcular badges basados en estadísticas
            calculateBadges({
                total_services: total,
                completed_services: completed,
                average_rating_given: avgRating,
            });
        } catch (error) {
            console.error('[Profile] Error loading data:', error);
        }
    };

    const calculateBadges = (stats: Partial<ClientStats>) => {
        const clientBadges: ClientBadge[] = [
            {
                id: 'first_service',
                name: 'Primer Servicio',
                description: 'Solicitaste tu primer servicio',
                icon: '🎯',
                unlocked: (stats.total_services || 0) >= 1,
            },
            {
                id: 'services_5',
                name: 'Cliente Activo',
                description: 'Has solicitado 5 servicios',
                icon: '⭐',
                unlocked: (stats.total_services || 0) >= 5,
            },
            {
                id: 'services_10',
                name: 'Cliente Frecuente',
                description: 'Has solicitado 10 servicios',
                icon: '🔥',
                unlocked: (stats.total_services || 0) >= 10,
            },
            {
                id: 'services_25',
                name: 'Cliente VIP',
                description: 'Has solicitado 25 servicios',
                icon: '👑',
                unlocked: (stats.total_services || 0) >= 25,
            },
            {
                id: 'completed_10',
                name: 'Proyectos Completados',
                description: 'Has completado 10 servicios',
                icon: '✅',
                unlocked: (stats.completed_services || 0) >= 10,
            },
            {
                id: 'reviewer',
                name: 'Opinión Valiosa',
                description: 'Has calificado a profesionales',
                icon: '💬',
                unlocked: (stats.average_rating_given || 0) > 0,
            },
        ];

        setBadges(clientBadges);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProfileData();
        setRefreshing(false);
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace('/auth/login');
    };

    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Usuario';
    const displayEmail = user?.email || '';
    const avatarUrl = profile?.avatar_url || null;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="dark" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header con foto y nombre */}
                <View style={[styles.header, { backgroundColor: theme.card }]}>
                    <View style={styles.avatarContainer}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                                <Ionicons name="person" size={40} color="#FFFFFF" />
                            </View>
                        )}
                        <TouchableOpacity
                            style={[styles.editAvatarButton, { backgroundColor: theme.primary }]}
                            activeOpacity={0.7}
                            onPress={() => router.push('/profile/edit')}
                        >
                            <Ionicons name="camera" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                    <Text variant="h2" weight="bold" style={styles.name}>
                        {displayName}
                    </Text>
                    <Text variant="body" color={theme.textSecondary} style={styles.email}>
                        {displayEmail}
                    </Text>
                    <View style={styles.badgesRow}>
                        <Badge variant="verified">Cliente Verificado</Badge>
                        {stats.completed_services > 0 && (
                            <Badge variant="guarantee">Cliente Activo</Badge>
                        )}
                    </View>
                </View>

                {/* Estadísticas */}
                <View style={styles.statsSection}>
                    <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                        Estadísticas
                    </Text>
                    <View style={styles.statsGrid}>
                        <Card variant="elevated" style={styles.statCard}>
                            <View style={[styles.statIconContainer, { backgroundColor: theme.primary + '20' }]}>
                                <Ionicons name="briefcase" size={24} color={theme.primary} />
                            </View>
                            <Text variant="h2" weight="bold" style={styles.statValue}>
                                {stats.total_services}
                            </Text>
                            <Text variant="caption" color={theme.textSecondary}>
                                Servicios
                            </Text>
                        </Card>

                        <Card variant="elevated" style={styles.statCard}>
                            <View style={[styles.statIconContainer, { backgroundColor: theme.success + '20' }]}>
                                <Ionicons name="checkmark-circle" size={24} color={theme.success} />
                            </View>
                            <Text variant="h2" weight="bold" style={styles.statValue}>
                                {stats.completed_services}
                            </Text>
                            <Text variant="caption" color={theme.textSecondary}>
                                Completados
                            </Text>
                        </Card>

                        <Card variant="elevated" style={styles.statCard}>
                            <View style={[styles.statIconContainer, { backgroundColor: theme.warning + '20' }]}>
                                <Ionicons name="time" size={24} color={theme.warning} />
                            </View>
                            <Text variant="h2" weight="bold" style={styles.statValue}>
                                {stats.pending_services}
                            </Text>
                            <Text variant="caption" color={theme.textSecondary}>
                                Pendientes
                            </Text>
                        </Card>

                        <Card variant="elevated" style={styles.statCard}>
                            <View style={[styles.statIconContainer, { backgroundColor: SUMEE_COLORS.PURPLE + '20' }]}>
                                <Ionicons name="star" size={24} color={SUMEE_COLORS.PURPLE} />
                            </View>
                            <Text variant="h2" weight="bold" style={styles.statValue}>
                                {stats.average_rating_given > 0 ? stats.average_rating_given.toFixed(1) : '—'}
                            </Text>
                            <Text variant="caption" color={theme.textSecondary}>
                                Calificación Promedio
                            </Text>
                        </Card>
                    </View>
                </View>

                {/* Badges/Logros */}
                <View style={styles.badgesSection}>
                    <View style={styles.sectionHeader}>
                        <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                            Logros
                        </Text>
                        <Text variant="caption" color={theme.textSecondary}>
                            {badges.filter(b => b.unlocked).length} de {badges.length} desbloqueados
                        </Text>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.badgesScroll}
                    >
                        {badges.map((badge) => (
                            <Card
                                key={badge.id}
                                variant="elevated"
                                style={[
                                    styles.badgeCard,
                                    !badge.unlocked && { opacity: 0.5 },
                                ]}
                            >
                                <View style={[styles.badgeIconContainer, { backgroundColor: theme.surface }]}>
                                    <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                                </View>
                                <Text variant="label" weight="bold" style={styles.badgeName} numberOfLines={1}>
                                    {badge.name}
                                </Text>
                                <Text variant="caption" color={theme.textSecondary} style={styles.badgeDescription} numberOfLines={2}>
                                    {badge.description}
                                </Text>
                                {badge.unlocked && (
                                    <View style={styles.unlockedBadge}>
                                        <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                                    </View>
                                )}
                            </Card>
                        ))}
                    </ScrollView>
                </View>

                {/* Información Personal */}
                <View style={styles.infoSection}>
                    <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                        Información Personal
                    </Text>
                    <Card variant="elevated" style={styles.infoCard}>
                        <TouchableOpacity 
                            style={styles.infoRow} 
                            activeOpacity={0.7}
                            onPress={() => router.push('/profile/edit')}
                        >
                            <View style={styles.infoIconContainer}>
                                <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text variant="caption" color={theme.textSecondary}>
                                    Email
                                </Text>
                                <Text variant="body" weight="medium">
                                    {displayEmail}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        <TouchableOpacity 
                            style={styles.infoRow} 
                            activeOpacity={0.7}
                            onPress={() => router.push('/profile/edit')}
                        >
                            <View style={styles.infoIconContainer}>
                                <Ionicons name="call-outline" size={20} color={theme.textSecondary} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text variant="caption" color={theme.textSecondary}>
                                    Teléfono
                                </Text>
                                <Text variant="body" weight="medium">
                                    {profile?.phone || profile?.whatsapp || 'No agregado'}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        <TouchableOpacity 
                            style={styles.infoRow} 
                            activeOpacity={0.7}
                            onPress={() => router.push('/profile/edit')}
                        >
                            <View style={styles.infoIconContainer}>
                                <Ionicons name="location-outline" size={20} color={theme.textSecondary} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text variant="caption" color={theme.textSecondary}>
                                    Ubicación
                                </Text>
                                <Text variant="body" weight="medium">
                                    {profile?.city || 'No especificada'}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </Card>
                </View>

                {/* Direcciones Guardadas */}
                <View style={styles.addressesSection}>
                    <View style={styles.sectionHeader}>
                        <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                            Direcciones Guardadas
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/profile/addresses')}
                            activeOpacity={0.7}
                        >
                            <Text variant="body" color={theme.primary} weight="medium">
                                Ver todas
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Card variant="elevated" style={styles.addressesCard}>
                        <TouchableOpacity
                            style={styles.addressesRow}
                            onPress={() => router.push('/profile/addresses')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="location" size={24} color={theme.primary} />
                            <View style={styles.addressesContent}>
                                <Text variant="body" weight="medium">
                                    Gestionar direcciones
                                </Text>
                                <Text variant="caption" color={theme.textSecondary}>
                                    Agrega y edita tus direcciones guardadas
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </Card>
                </View>

                {/* Configuraciones */}
                <View style={styles.settingsSection}>
                    <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                        Configuración
                    </Text>
                    <Card variant="elevated" style={styles.settingsCard}>
                        <TouchableOpacity 
                            style={styles.settingsRow} 
                            activeOpacity={0.7}
                            onPress={() => setShowNotificationsModal(true)}
                        >
                            <Ionicons name="notifications-outline" size={20} color={theme.text} />
                            <Text variant="body" style={styles.settingsText}>
                                Notificaciones
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        <TouchableOpacity 
                            style={styles.settingsRow} 
                            activeOpacity={0.7}
                            onPress={() => {
                                // TODO: Navegar a pantalla de privacidad cuando esté implementada
                                // router.push('/profile/privacy');
                                console.log('[Profile] Privacidad - Pendiente implementar');
                            }}
                        >
                            <Ionicons name="shield-checkmark-outline" size={20} color={theme.text} />
                            <Text variant="body" style={styles.settingsText}>
                                Privacidad y Seguridad
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        <TouchableOpacity 
                            style={styles.settingsRow} 
                            activeOpacity={0.7}
                            onPress={() => setShowGuaranteeModal(true)}
                        >
                            <Ionicons name="shield-checkmark" size={20} color={theme.text} />
                            <Text variant="body" style={styles.settingsText}>
                                Seguridad y Garantías
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        <TouchableOpacity 
                            style={styles.settingsRow} 
                            activeOpacity={0.7}
                            onPress={() => setShowSupportModal(true)}
                        >
                            <Ionicons name="help-circle-outline" size={20} color={theme.text} />
                            <Text variant="body" style={styles.settingsText}>
                                Ayuda y Soporte
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        <TouchableOpacity 
                            style={styles.settingsRow} 
                            activeOpacity={0.7}
                            onPress={() => {
                                // Abrir términos y condiciones en el navegador
                                Linking.openURL('https://sumeeapp.com/terminos-y-condiciones').catch((err) => {
                                    console.error('[Profile] Error opening terms:', err);
                                });
                            }}
                        >
                            <Ionicons name="document-text-outline" size={20} color={theme.text} />
                            <Text variant="body" style={styles.settingsText}>
                                Términos y Condiciones
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </Card>
                </View>

                {/* Botón de Cerrar Sesión */}
                <View style={styles.logoutSection}>
                    <Button
                        title="Cerrar Sesión"
                        variant="outline"
                        onPress={handleSignOut}
                        style={styles.logoutButton}
                    />
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Modal de Ayuda y Soporte */}
            <SupportModal
                visible={showSupportModal}
                onClose={() => setShowSupportModal(false)}
            />

            {/* Modal de Garantía Sumee */}
            <GuaranteeModal
                visible={showGuaranteeModal}
                onClose={() => setShowGuaranteeModal(false)}
                onOpenSupport={() => setShowSupportModal(true)}
            />

            {/* Modal de Notificaciones */}
            <NotificationsModal
                visible={showNotificationsModal}
                onClose={() => setShowNotificationsModal(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 20,
        paddingBottom: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    name: {
        marginTop: 8,
        marginBottom: 4,
    },
    email: {
        marginBottom: 12,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 8,
    },
    statsSection: {
        padding: 20,
    },
    sectionTitle: {
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        width: (width - 52) / 2,
        padding: 16,
        alignItems: 'center',
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValue: {
        marginBottom: 4,
    },
    badgesSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    badgesScroll: {
        paddingRight: 20,
    },
    badgeCard: {
        width: 140,
        padding: 16,
        marginRight: 12,
        alignItems: 'center',
        position: 'relative',
    },
    badgeIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    badgeEmoji: {
        fontSize: 32,
    },
    badgeName: {
        marginBottom: 4,
        textAlign: 'center',
    },
    badgeDescription: {
        textAlign: 'center',
        fontSize: 10,
    },
    unlockedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    infoSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    infoCard: {
        padding: 0,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    divider: {
        height: 1,
        marginLeft: 68,
    },
    settingsSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    settingsCard: {
        padding: 0,
    },
    settingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    settingsText: {
        flex: 1,
    },
    logoutSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    logoutButton: {
        borderColor: '#EF4444',
    },
    addressesSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    addressesCard: {
        padding: 0,
    },
    addressesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    addressesContent: {
        flex: 1,
    },
});
