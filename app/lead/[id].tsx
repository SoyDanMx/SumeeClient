import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ProfessionalProfileCard } from '@/components/ProfessionalProfileCard';
import { EditLeadModal } from '@/components/EditLeadModal';
import { CancelLeadModal } from '@/components/CancelLeadModal';
import { supabase } from '@/lib/supabase';
import { SUMEE_COLORS } from '@/constants/Colors';
import { openWhatsApp, generateClientToProfessionalMessage } from '@/utils/whatsapp';
import { LeadsService } from '@/services/leads';

interface Lead {
    id: string;
    servicio_solicitado: string;
    servicio: string;
    descripcion_proyecto: string;
    status: string;
    estado: string;
    price: number;
    agreed_price: number;
    ubicacion_direccion?: string | null;
    ubicacion_lat?: number | null;
    ubicacion_lng?: number | null;
    whatsapp?: string;
    professional_id?: string;
    profesional_asignado_id?: string; // Campo legacy
    created_at: string;
    updated_at: string;
    profiles?: {
        full_name: string;
        whatsapp?: string;
        phone?: string;
        profession?: string;
        calificacion_promedio?: number;
    };
}

export default function LeadDetailScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);

    useEffect(() => {
        if (id) {
            loadLead();
        }
    }, [id]);

    const loadLead = async () => {
        if (!id) return;

        try {
            setLoading(true);
            console.log('[LeadDetail] Loading lead:', id);
            
            // Obtener el lead usando LeadsService
            const leadData = await LeadsService.getLeadById(id);
            
            if (!leadData) {
                console.error('[LeadDetail] Lead not found:', id);
                setLead(null);
                return;
            }

            console.log('[LeadDetail] Lead loaded:', leadData.id);
            
            // Obtener professional_id (prioridad: professional_id > profesional_asignado_id)
            const professionalId = leadData.professional_id || (leadData as any).profesional_asignado_id;
            
            console.log('[LeadDetail] Lead data:', {
                professional_id: leadData.professional_id,
                profesional_asignado_id: (leadData as any).profesional_asignado_id,
                resolved_professional_id: professionalId,
                status: leadData.status,
                estado: leadData.estado,
            });

            // Si hay profesional asignado, obtener su perfil
            let professionalProfile = null;
            if (professionalId) {
                console.log('[LeadDetail] ✅ Professional ID found:', professionalId);
                console.log('[LeadDetail] Loading professional profile...');
                const { data: profData, error: profError } = await supabase
                    .from('profiles')
                    .select('full_name, whatsapp, phone, profession, calificacion_promedio, avatar_url')
                    .eq('user_id', professionalId)
                    .single();

                if (!profError && profData) {
                    professionalProfile = profData;
                    console.log('[LeadDetail] ✅ Professional profile loaded:', professionalProfile.full_name);
                } else {
                    console.warn('[LeadDetail] ⚠️ Could not load professional profile:', profError);
                }
            } else {
                console.log('[LeadDetail] ⚠️ No professional_id or profesional_asignado_id in lead');
            }

            // Construir objeto Lead completo
            // Asegurar que professional_id esté presente (usar profesional_asignado_id si no existe)
            const resolvedProfessionalId = leadData.professional_id || (leadData as any).profesional_asignado_id;
            
            const completeLead: Lead = {
                ...leadData,
                professional_id: resolvedProfessionalId || leadData.professional_id,
                profesional_asignado_id: (leadData as any).profesional_asignado_id,
                profiles: professionalProfile || undefined,
            };

            console.log('[LeadDetail] Complete lead:', {
                id: completeLead.id,
                professional_id: completeLead.professional_id,
                profesional_asignado_id: completeLead.profesional_asignado_id,
                has_profiles: !!completeLead.profiles,
            });

            setLead(completeLead);
        } catch (error: any) {
            console.error('[LeadDetail] Error loading lead:', error);
            console.error('[LeadDetail] Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
            });
            setLead(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLead();
    };

    const handleWhatsAppPress = async () => {
        if (!lead) return;

        // Usar WhatsApp del profesional si está asignado, sino del lead
        const whatsappNumber = lead.professional_id && lead.profiles?.whatsapp
            ? lead.profiles.whatsapp
            : lead.whatsapp;

        if (!whatsappNumber) {
            return;
        }

        const serviceName = lead.servicio_solicitado || lead.servicio || 'servicio';
        const message = generateClientToProfessionalMessage(serviceName, user?.email?.split('@')[0]);
        
        await openWhatsApp(whatsappNumber, message);
    };

    /**
     * Formatear dirección para mostrar
     * Alineado con la app de profesionales
     */
    const formatAddress = (address: string | null | undefined): string => {
        if (!address) return 'Ubicación no especificada';
        
        // Si la dirección ya está bien formateada, retornarla
        if (address.includes(',') || address.includes('CDMX') || address.includes('Ciudad de México')) {
            return address;
        }
        
        // Si solo tiene calle, agregar ciudad por defecto
        // Ejemplo: "Calle Atenas" → "Calle Atenas, Ciudad de México"
        if (address.trim() && !address.includes('Ciudad de México') && !address.includes('CDMX')) {
            return `${address}, Ciudad de México`;
        }
        
        return address;
    };


    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="fast-response">Pendiente</Badge>;
            case 'accepted':
                return <Badge variant="verified">Aceptado</Badge>;
            case 'completed':
                return <Badge variant="guarantee">Completado</Badge>;
            case 'cancelled':
                return <Badge variant="danger">Cancelado</Badge>;
            default:
                return null;
        }
    };

    const handleEditLead = async (data: {
        service: string;
        description: string;
        whatsapp: string;
        address?: string;
        photos: string[];
    }) => {
        if (!lead || !user) return;

        try {
            const updatedLead = await LeadsService.updateLead(lead.id, data);
            if (updatedLead) {
                // Recargar el lead actualizado
                await loadLead();
                Alert.alert('Éxito', 'Los cambios se guardaron correctamente.');
            }
        } catch (error: any) {
            console.error('[LeadDetail] Error updating lead:', error);
            throw error;
        }
    };

    const handleCancelLead = async (reason?: string) => {
        if (!lead || !user) return;

        try {
            await LeadsService.cancelLead(lead.id, user.id, reason);
            Alert.alert(
                'Servicio cancelado',
                'El servicio ha sido cancelado correctamente.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error: any) {
            console.error('[LeadDetail] Error cancelling lead:', error);
            throw error;
        }
    };

    // Verificar si el lead puede ser editado o cancelado
    const canEdit = lead && lead.status !== 'completed' && lead.status !== 'cancelled';
    const canCancel = lead && lead.status !== 'completed' && lead.status !== 'cancelled';

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!lead) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={64} color={theme.textSecondary} />
                    <Text variant="h3" weight="bold" style={styles.emptyTitle}>
                        Solicitud no encontrada
                    </Text>
                    <Button
                        title="Volver"
                        onPress={() => router.back()}
                        style={styles.backButton}
                    />
                </View>
            </SafeAreaView>
        );
    }

    // Verificar si hay profesional asignado
    // Prioridad: professional_id > profesional_asignado_id
    const resolvedProfessionalId = lead.professional_id || lead.profesional_asignado_id;
    const hasProfessional = !!resolvedProfessionalId;
    const whatsappNumber = lead.profiles?.whatsapp || lead.profiles?.phone || lead.whatsapp;

    // Debug logging
    console.log('[LeadDetail] Render check:', {
        hasProfessional,
        professional_id: lead.professional_id,
        profesional_asignado_id: lead.profesional_asignado_id,
        resolved_professional_id: resolvedProfessionalId,
        willShow: hasProfessional,
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="dark" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.card }]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text variant="h2" weight="bold" style={styles.headerTitle}>
                        Detalle de Solicitud
                    </Text>
                </View>

                {/* Información del Servicio */}
                <View style={styles.section}>
                    <Card variant="elevated" style={styles.card}>
                        <View style={styles.serviceHeader}>
                            <Text variant="h2" weight="bold" style={styles.serviceTitle}>
                                {lead.servicio_solicitado || lead.servicio || 'Servicio'}
                            </Text>
                            {getStatusBadge(lead.status)}
                        </View>

                        {lead.descripcion_proyecto && (
                            <View style={styles.descriptionContainer}>
                                <Text variant="body" color={theme.textSecondary}>
                                    {typeof lead.descripcion_proyecto === 'string' 
                                        ? lead.descripcion_proyecto 
                                        : JSON.stringify(lead.descripcion_proyecto)}
                                </Text>
                            </View>
                        )}

                        <View style={styles.priceContainer}>
                            <Text variant="caption" color={theme.textSecondary}>
                                Precio acordado
                            </Text>
                            <Text variant="h1" weight="bold" color={theme.primary}>
                                ${(lead.agreed_price || lead.price || 0).toFixed(2)}
                            </Text>
                        </View>
                    </Card>
                </View>

                {/* Información del Profesional - Componente de Vanguardia */}
                {hasProfessional && resolvedProfessionalId ? (
                    <View style={styles.section}>
                        <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                            Profesional Asignado
                        </Text>
                        {(() => {
                            console.log('[LeadDetail] Rendering ProfessionalProfileCard with ID:', resolvedProfessionalId);
                            return (
                                <ProfessionalProfileCard 
                                    professionalId={resolvedProfessionalId}
                                    leadId={lead.id}
                                    onPress={() => router.push(`/professional/${resolvedProfessionalId}`)}
                                />
                            );
                        })()}
                    </View>
                ) : (
                    <View style={styles.section}>
                        <Card variant="elevated" style={styles.card}>
                            <View style={{ alignItems: 'center', padding: 20 }}>
                                <Ionicons name="person-outline" size={48} color={theme.textSecondary} />
                                <Text variant="body" color={theme.textSecondary} style={{ marginTop: 12, textAlign: 'center' }}>
                                    Aún no hay profesional asignado
                                </Text>
                                <Text variant="caption" color={theme.textSecondary} style={{ marginTop: 4, textAlign: 'center' }}>
                                    Tu solicitud está siendo revisada
                                </Text>
                            </View>
                        </Card>
                    </View>
                )}

                {/* Información de Ubicación */}
                <View style={styles.section}>
                    <Card variant="elevated" style={styles.card}>
                        <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                            Ubicación del Servicio
                        </Text>
                        
                        <View style={styles.locationContainer}>
                            <View style={[styles.locationIconContainer, { backgroundColor: theme.primary + '15' }]}>
                                <Ionicons name="location" size={24} color={theme.primary} />
                            </View>
                            <View style={styles.locationTextContainer}>
                                <Text variant="body" weight="medium" style={styles.locationText}>
                                    {formatAddress(lead.ubicacion_direccion)}
                                </Text>
                                {lead.ubicacion_lat && lead.ubicacion_lng && (
                                    <Text variant="caption" color={theme.textSecondary} style={styles.coordinatesText}>
                                        {typeof lead.ubicacion_lat === 'string' 
                                            ? parseFloat(lead.ubicacion_lat).toFixed(6) 
                                            : lead.ubicacion_lat.toFixed(6)}, {typeof lead.ubicacion_lng === 'string' 
                                            ? parseFloat(lead.ubicacion_lng).toFixed(6) 
                                            : lead.ubicacion_lng.toFixed(6)}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </Card>
                </View>

                {/* Información de Fechas */}
                <View style={styles.section}>
                    <Card variant="elevated" style={styles.card}>
                        <View style={styles.dateRow}>
                            <View style={styles.dateItem}>
                                <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                                <View style={styles.dateInfo}>
                                    <Text variant="caption" color={theme.textSecondary}>
                                        Creado
                                    </Text>
                                    <Text variant="body" weight="medium">
                                        {new Date(lead.created_at).toLocaleDateString('es-MX', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.dateItem}>
                                <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
                                <View style={styles.dateInfo}>
                                    <Text variant="caption" color={theme.textSecondary}>
                                        Última actualización
                                    </Text>
                                    <Text variant="body" weight="medium">
                                        {new Date(lead.updated_at).toLocaleDateString('es-MX', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </Card>
                </View>

                {/* Botones de Acción */}
                {(canEdit || canCancel) && (
                    <View style={styles.section}>
                        <View style={styles.actionButtons}>
                            {canEdit && (
                                <Button
                                    title="Editar Servicio"
                                    onPress={() => setIsEditModalVisible(true)}
                                    variant="primary"
                                    style={styles.actionButton}
                                />
                            )}
                            {canCancel && (
                                <Button
                                    title="Cancelar Servicio"
                                    onPress={() => setIsCancelModalVisible(true)}
                                    variant="danger"
                                    style={styles.actionButton}
                                />
                            )}
                        </View>
                    </View>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Modales */}
            {lead && (
                <>
                    <EditLeadModal
                        visible={isEditModalVisible}
                        lead={lead}
                        onClose={() => setIsEditModalVisible(false)}
                        onSave={handleEditLead}
                    />
                    <CancelLeadModal
                        visible={isCancelModalVisible}
                        lead={lead}
                        onClose={() => setIsCancelModalVisible(false)}
                        onConfirm={handleCancelLead}
                    />
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        flex: 1,
    },
    section: {
        padding: 20,
    },
    card: {
        padding: 16,
    },
    serviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    serviceTitle: {
        flex: 1,
        marginRight: 12,
    },
    descriptionContainer: {
        marginBottom: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    priceContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        alignItems: 'flex-end',
    },
    sectionTitle: {
        marginBottom: 16,
    },
    professionalInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    professionalDetails: {
        flex: 1,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    whatsappButton: {
        marginTop: 8,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    locationIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    locationTextContainer: {
        flex: 1,
    },
    locationText: {
        marginBottom: 4,
        lineHeight: 22,
    },
    coordinatesText: {
        fontSize: 11,
        fontFamily: 'monospace',
    },
    dateRow: {
        gap: 16,
    },
    dateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateInfo: {
        flex: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
    },
});

