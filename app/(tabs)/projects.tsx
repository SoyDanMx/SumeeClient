import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Skeleton } from '@/components/Skeleton';
import { hapticFeedback } from '@/utils/haptics';
import { LeadsService, ClientLead } from '@/services/leads';
import { CategoryService, CATEGORY_ORDER } from '@/services/categories';
import { TULBOX_COLORS } from '@/constants/Colors';
import { getLeadPriceFormatted } from '@/services/priceFormatter';

export default function ProjectsScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const [leads, setLeads] = useState<ClientLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');

    useEffect(() => {
        if (user) {
            console.log('[Projects] Current User ID:', user.id);
            loadLeads();
        }
    }, [user, filter]);

    // Suscripción a cambios en tiempo real
    useEffect(() => {
        if (!user?.id) return;

        console.log('[Projects] Setting up real-time subscription for client:', user.id);
        const unsubscribe = LeadsService.subscribeToClientLeads(user.id, (updatedLeads) => {
            console.log('[Projects] Real-time update received, leads count:', updatedLeads.length);
            setLeads(updatedLeads);
        });

        return () => {
            unsubscribe();
        };
    }, [user?.id]);

    const loadLeads = async (force: boolean = false) => {
        if (!user) return;

        try {
            console.log('[Projects] Loading leads for client:', user.id);
            console.log('[Projects] Current filter:', filter);

            const data = await LeadsService.getClientLeads(user.id, filter, force);

            console.log('[Projects] Leads loaded:', data.length);
            setLeads(data);
        } catch (error: any) {
            console.error('[Projects] Error loading leads:', error);
            console.error('[Projects] Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLeads(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="fast-response" label="Pendiente" />;
            case 'accepted':
                return <Badge variant="verified" label="Aceptado" />;
            case 'completed':
                return <Badge variant="guarantee" label="Completado" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return theme.warning;
            case 'accepted':
                return theme.info;
            case 'completed':
                return theme.success;
            default:
                return theme.textSecondary;
        }
    };

    const handleLeadPress = (leadId: string) => {
        hapticFeedback.selection();
        router.push(`/lead/${leadId}`);
    };

    /** Catálogo de servicios: 1 tap → elegir servicio → solicitar (sin rutas de grupo inválidas). */
    const goToNewRequest = () => {
        hapticFeedback.light();
        router.push('/services');
    };

    // Los leads ya vienen filtrados desde LeadsService según el filter
    // Pero mantenemos el filtrado local por si acaso
    const filteredLeads = leads.filter(lead => {
        if (filter === 'all') return true;
        return lead.status === filter;
    });

    const stats = {
        all: leads.length,
        pending: leads.filter(l => l.status === 'pending').length,
        accepted: leads.filter(l => l.status === 'accepted').length,
        completed: leads.filter(l => l.status === 'completed').length,
    };

    const leadGroupsByDiscipline = useMemo(() => {
        const byKey = new Map<string, ClientLead[]>();
        for (const lead of filteredLeads) {
            const raw = lead.disciplina_ia?.toLowerCase().trim();
            const key = raw && raw.length > 0 ? raw : 'otros';
            if (!byKey.has(key)) byKey.set(key, []);
            byKey.get(key)!.push(lead);
        }
        const priority = new Map(CATEGORY_ORDER.map((id, i) => [id, i]));
        const sortKeys = (a: string, b: string) => {
            const pa = priority.has(a) ? priority.get(a)! : 1000;
            const pb = priority.has(b) ? priority.get(b)! : 1000;
            if (pa !== pb) return pa - pb;
            const na = CategoryService.getDisciplineConfig(a)?.name || a;
            const nb = CategoryService.getDisciplineConfig(b)?.name || b;
            return na.localeCompare(nb, 'es', { sensitivity: 'base' });
        };
        return Array.from(byKey.keys())
            .sort(sortKeys)
            .map((discipline) => {
                const config = CategoryService.getDisciplineConfig(discipline);
                const title =
                    discipline === 'otros'
                        ? 'General'
                        : config?.name ||
                          discipline
                              .split('-')
                              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(' ');
                return { discipline, title, icon: config?.icon || 'layers-outline', leads: byKey.get(discipline)! };
            });
    }, [filteredLeads]);

    const renderLeadCard = (lead: ClientLead) => (
        <Card key={lead.id} variant="elevated" style={styles.leadCard}>
            <TouchableOpacity onPress={() => handleLeadPress(lead.id)} activeOpacity={0.7}>
                <View style={styles.leadHeader}>
                    <View style={styles.leadTitleContainer}>
                        <Text variant="h3" weight="bold" style={styles.leadTitle} numberOfLines={1}>
                            {lead.servicio_solicitado || lead.servicio || 'Servicio'}
                        </Text>
                        {getStatusBadge(lead.status)}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </View>

                {lead.descripcion_proyecto && (
                    <Text variant="body" color={theme.textSecondary} style={styles.leadDescription} numberOfLines={2}>
                        {lead.descripcion_proyecto}
                    </Text>
                )}

                <View style={styles.leadFooter}>
                    <View style={styles.leadInfo}>
                        <Ionicons name="location" size={16} color={theme.textSecondary} />
                        <Text variant="caption" color={theme.textSecondary} numberOfLines={1}>
                            {lead.ubicacion_direccion || 'Ubicación no especificada'}
                        </Text>
                    </View>
                    <View style={styles.leadPrice}>
                        <Text variant="h3" weight="bold" color={theme.primary}>
                            {getLeadPriceFormatted(lead)}
                        </Text>
                    </View>
                </View>

                <View style={styles.leadDate}>
                    <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                    <Text variant="caption" color={theme.textSecondary}>
                        {new Date(lead.created_at).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </Text>
                </View>
            </TouchableOpacity>
        </Card>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="dark" />

            {/* Header + acceso rápido a nueva solicitud (siempre visible si hay sesión) */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <View style={styles.headerRow}>
                    <View style={styles.headerTitles}>
                        <Text variant="h2" weight="bold" style={styles.title}>
                            Mis Solicitudes
                        </Text>
                        <Text variant="caption" color={theme.textSecondary}>
                            {stats.all} solicitudes en total
                        </Text>
                    </View>
                    {user ? (
                        <TouchableOpacity
                            onPress={goToNewRequest}
                            activeOpacity={0.75}
                            accessibilityRole="button"
                            accessibilityLabel="Nueva solicitud de servicio"
                            style={[styles.headerCta, { backgroundColor: theme.primary }]}
                        >
                            <Ionicons name="add" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {/* Filtros */}
            <View style={styles.filtersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                    {(['all', 'pending', 'accepted', 'completed'] as const).map((filterOption) => (
                        <TouchableOpacity
                            key={filterOption}
                            style={[
                                styles.filterButton,
                                filter === filterOption && {
                                    backgroundColor: theme.primary,
                                },
                                { borderColor: theme.border },
                            ]}
                            onPress={() => {
                                hapticFeedback.light();
                                setFilter(filterOption);
                            }}
                            activeOpacity={0.7}
                        >
                            <Text
                                variant="caption"
                                weight="bold"
                                style={[
                                    filter === filterOption && { color: '#FFFFFF' },
                                ]}
                            >
                                {filterOption === 'all' ? 'Todos' :
                                    filterOption === 'pending' ? 'Pendientes' :
                                        filterOption === 'accepted' ? 'Aceptados' :
                                            'Completados'} ({stats[filterOption]})
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Lista de Solicitudes */}
            {loading ? (
                <View style={styles.loadingList}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={[styles.skeletonCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={styles.skeletonHeader}>
                                <Skeleton width="60%" height={20} />
                                <Skeleton width={80} height={24} borderRadius={12} />
                            </View>
                            <Skeleton width="100%" height={14} style={{ marginTop: 12 }} />
                            <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
                            <View style={styles.skeletonFooter}>
                                <Skeleton width={100} height={16} />
                                <Skeleton width={60} height={20} />
                            </View>
                        </View>
                    ))}
                </View>
            ) : filteredLeads.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={64} color={theme.textSecondary} />
                    <Text variant="h3" weight="bold" style={styles.emptyTitle}>
                        No hay solicitudes
                    </Text>
                    <Text variant="body" color={theme.textSecondary} style={styles.emptyText}>
                        {filter === 'all'
                            ? 'Aún no has solicitado ningún servicio'
                            : `No hay solicitudes ${filter === 'pending' ? 'pendientes' : filter === 'accepted' ? 'aceptadas' : 'completadas'}`}
                    </Text>
                    {filter === 'all' && (
                        <TouchableOpacity
                            style={[styles.newRequestButton, { backgroundColor: theme.primary }]}
                            onPress={goToNewRequest}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel="Ir al catálogo para solicitar un servicio"
                        >
                            <Ionicons name="rocket-outline" size={22} color="#FFFFFF" />
                            <Text variant="body" weight="bold" color="#FFFFFF">
                                Elegir servicio
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    contentContainerStyle={styles.leadsScrollContent}
                >
                    <View style={styles.leadsList}>
                        {leadGroupsByDiscipline.map((group) => (
                            <View key={group.discipline} style={styles.disciplineSection}>
                                <View style={styles.disciplineSectionHeader}>
                                    <Ionicons
                                        name={group.icon as keyof typeof Ionicons.glyphMap}
                                        size={20}
                                        color={theme.primary}
                                    />
                                    <Text variant="body" weight="bold" color={theme.text} style={styles.disciplineSectionTitle}>
                                        {group.title}
                                    </Text>
                                    <Text variant="caption" color={theme.textSecondary}>
                                        ({group.leads.length})
                                    </Text>
                                </View>
                                {group.leads.map((lead) => renderLeadCard(lead))}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    headerTitles: {
        flex: 1,
        minWidth: 0,
    },
    headerCta: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        marginBottom: 4,
    },
    leadsScrollContent: {
        flexGrow: 1,
    },
    filtersContainer: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    filters: {
        paddingHorizontal: 20,
        gap: 12,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingList: {
        padding: 20,
        gap: 16,
    },
    skeletonCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    skeletonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skeletonFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        textAlign: 'center',
        marginBottom: 24,
    },
    newRequestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    leadsList: {
        padding: 20,
        paddingBottom: 100,
    },
    disciplineSection: {
        marginBottom: 8,
    },
    disciplineSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingTop: 4,
    },
    disciplineSectionTitle: {
        flex: 1,
    },
    leadCard: {
        marginBottom: 16,
    },
    leadHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    leadTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginRight: 8,
    },
    leadTitle: {
        flex: 1,
    },
    leadDescription: {
        marginBottom: 12,
    },
    leadFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    leadInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginRight: 12,
    },
    leadPrice: {
        alignItems: 'flex-end',
    },
    leadDate: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
});
