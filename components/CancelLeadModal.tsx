import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';

interface CancelLeadModalProps {
    visible: boolean;
    lead: {
        id: string;
        servicio_solicitado?: string | null;
        professional_id?: string | null;
        profesional_asignado_id?: string | null;
    };
    onClose: () => void;
    onConfirm: (reason?: string) => Promise<void>;
}

export function CancelLeadModal({ visible, lead, onClose, onConfirm }: CancelLeadModalProps) {
    const { theme } = useTheme();
    const [isCancelling, setIsCancelling] = useState(false);
    const [reason, setReason] = useState('');

    const hasProfessional = !!(lead.professional_id || lead.profesional_asignado_id);

    const handleConfirm = async () => {
        try {
            setIsCancelling(true);
            await onConfirm(reason.trim() || undefined);
            onClose();
            setReason('');
        } catch (error: any) {
            console.error('[CancelLeadModal] Error cancelling:', error);
            Alert.alert(
                'Error',
                error.message || 'No se pudo cancelar el servicio. Intenta de nuevo.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsCancelling(false);
        }
    };

    const handleCancel = () => {
        setReason('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                    {/* Header con advertencia */}
                    <View style={[styles.header, { backgroundColor: '#FEE2E2' }]}>
                        <Ionicons name="warning" size={32} color="#DC2626" />
                        <Text variant="h2" weight="bold" style={{ color: '#DC2626', marginTop: 12 }}>
                            Cancelar Servicio
                        </Text>
                    </View>

                    <View style={styles.content}>
                        {/* Información del servicio */}
                        <View style={styles.serviceInfo}>
                            <Text variant="body" weight="medium" style={styles.serviceLabel}>
                                Servicio:
                            </Text>
                            <Text variant="body" style={styles.serviceName}>
                                {lead.servicio_solicitado || 'Servicio'}
                            </Text>
                        </View>

                        {/* Advertencia si hay profesional asignado */}
                        {hasProfessional && (
                            <View style={[styles.warningBox, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]}>
                                <Ionicons name="information-circle" size={20} color="#D97706" />
                                <Text variant="body" style={{ color: '#92400E', marginLeft: 8, flex: 1 }}>
                                    Este servicio tiene un profesional asignado. Al cancelar, el profesional será notificado.
                                </Text>
                            </View>
                        )}

                        {/* Mensaje principal */}
                        <Text variant="body" style={styles.message}>
                            {hasProfessional
                                ? '¿Estás seguro de que deseas cancelar este servicio? El profesional asignado será notificado y el servicio se marcará como cancelado.'
                                : '¿Estás seguro de que deseas cancelar este servicio? Esta acción no se puede deshacer.'}
                        </Text>

                        {/* Campo opcional de razón */}
                        <View style={styles.reasonField}>
                            <Text variant="body" weight="medium" style={styles.reasonLabel}>
                                Razón de cancelación (opcional):
                            </Text>
                            <View style={[styles.reasonInputContainer, { borderColor: theme.border }]}>
                                <Ionicons name="chatbubble-outline" size={20} color={theme.textSecondary} style={styles.reasonIcon} />
                                <Text variant="body" color={theme.textSecondary} style={styles.reasonPlaceholder}>
                                    Ej: Ya no necesito el servicio, encontré otra solución, etc.
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Footer con botones */}
                    <View style={[styles.footer, { borderTopColor: theme.border }]}>
                        <Button
                            title="No, mantener"
                            onPress={handleCancel}
                            variant="outline"
                            style={styles.footerButton}
                            disabled={isCancelling}
                        />
                        <Button
                            title={isCancelling ? 'Cancelando...' : 'Sí, cancelar'}
                            onPress={handleConfirm}
                            variant="danger"
                            style={styles.footerButton}
                            disabled={isCancelling}
                        />
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 20,
        width: '100%',
        maxWidth: 500,
        overflow: 'hidden',
    },
    header: {
        alignItems: 'center',
        padding: 24,
    },
    content: {
        padding: 20,
    },
    serviceInfo: {
        marginBottom: 20,
    },
    serviceLabel: {
        marginBottom: 4,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: '600',
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
    },
    message: {
        marginBottom: 20,
        lineHeight: 22,
    },
    reasonField: {
        marginTop: 12,
    },
    reasonLabel: {
        marginBottom: 8,
    },
    reasonInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        minHeight: 50,
    },
    reasonIcon: {
        marginRight: 8,
    },
    reasonPlaceholder: {
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderTopWidth: 1,
        gap: 12,
    },
    footerButton: {
        flex: 1,
    },
});

