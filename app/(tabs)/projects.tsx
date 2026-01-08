import React, { useState, useEffect } from 'react';
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
import { LeadsService, ClientLead } from '@/services/leads';
import { SUMEE_COLORS } from '@/constants/Colors';

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

    const loadLeads = async () => {
        if (!user) return;

        try {
            console.log('[Projects] Loading leads for client:', user.id);
            console.log('[Projects] Current filter:', filter);
            
            const data = await LeadsService.getClientLeads(user.id, filter);
            
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
        await loadLeads();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="fast-response">Pendiente</Badge>;
            case 'accepted':
                return <Badge variant="verified">Aceptado</Badge>;
            case 'completed':
                return <Badge variant="guarantee">Completado</Badge>;
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
        router.push(`/lead/${leadId}`);
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="dark" />
            
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card }]}>
                <Text variant="h2" weight="bold" style={styles.title}>
                    Mis Solicitudes
                </Text>
                <Text variant="caption" color={theme.textSecondary}>
                    {stats.all} solicitudes en total
                </Text>
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
                            onPress={() => setFilter(filterOption)}
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
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
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
                            onPress={() => router.push('/(tabs)')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="add" size={24} color="#FFFFFF" />
                            <Text variant="body" weight="bold" color="#FFFFFF">
                                Solicitar Servicio
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
                >
                    <View style={styles.leadsList}>
                        {filteredLeads.map((lead) => (
                            <Card
                                key={lead.id}
                                variant="elevated"
                                style={styles.leadCard}
                            >
                                <TouchableOpacity
                                    onPress={() => handleLeadPress(lead.id)}
                                    activeOpacity={0.7}
                                >
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
                                                ${(lead.agreed_price || lead.price || 0).toFixed(2)}
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
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    title: {
        marginBottom: 4,
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
