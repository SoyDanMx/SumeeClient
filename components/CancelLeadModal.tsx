import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
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
            <SafeAreaView style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        {/* Header con advertencia */}
                        <View style={[styles.header, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="warning" size={32} color="#DC2626" />
                            <Text variant="h2" weight="bold" style={{ color: '#DC2626', marginTop: 12 }}>
                                Cancelar Servicio
                            </Text>
                        </View>

                        <ScrollView style={styles.scrollView} bounces={false} showsVerticalScrollIndicator={false}>
                            <View style={styles.content}>
                                {/* Información del servicio */}
                                <View style={styles.serviceInfo}>
                                    <Text variant="caption" weight="bold" color={theme.textSecondary} style={styles.label}>
                                        SERVICIO:
                                    </Text>
                                    <Text variant="body" weight="medium" style={styles.serviceName}>
                                        {lead.servicio_solicitado || 'Servicio'}
                                    </Text>
                                </View>

                                {/* Advertencia si hay profesional asignado */}
                                {!!hasProfessional && (
                                    <View style={[styles.warningBox, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]}>
                                        <Ionicons name="information-circle" size={20} color="#D97706" />
                                        <Text variant="body" style={{ color: '#92400E', marginLeft: 8, flex: 1 }}>
                                            Este servicio tiene un profesional asignado. Al cancelar, el profesional será notificado.
                                        </Text>
                                    </View>
                                )}

                                {/* Mensaje principal */}
                                <Text variant="body" style={styles.message}>
                                    {!!hasProfessional
                                        ? '¿Estás seguro de que deseas cancelar este servicio? El profesional asignado será notificado y el servicio se marcará como cancelado.'
                                        : '¿Estás seguro de que deseas cancelar este servicio? Esta acción no se puede deshacer.'}
                                </Text>

                                {/* Campo opcional de razón */}
                                <View style={styles.reasonField}>
                                    <Text variant="body" weight="medium" style={styles.reasonLabel}>
                                        Razón de cancelación (opcional):
                                    </Text>
                                    <View style={[styles.reasonInputContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                        <Ionicons name="chatbubble-outline" size={20} color={theme.textSecondary} style={styles.reasonIcon} />
                                        <TextInput
                                            style={[styles.reasonInput, { color: theme.text }]}
                                            placeholder="Ej: Ya no necesito el servicio..."
                                            placeholderTextColor={theme.textSecondary}
                                            value={reason}
                                            onChangeText={setReason}
                                            multiline
                                            maxLength={200}
                                        />
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

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
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    keyboardView: {
        width: '100%',
        maxWidth: 500,
    },
    modalContent: {
        borderRadius: 24,
        width: '100%',
        maxHeight: '85%',
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    header: {
        alignItems: 'center',
        padding: 24,
    },
    scrollView: {
        maxHeight: 400,
    },
    content: {
        padding: 24,
    },
    serviceInfo: {
        marginBottom: 20,
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
    },
    label: {
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    serviceName: {
        fontSize: 16,
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
        fontSize: 15,
    },
    reasonField: {
        marginTop: 4,
    },
    reasonLabel: {
        marginBottom: 8,
    },
    reasonInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderRadius: 16,
        padding: 12,
        minHeight: 80,
    },
    reasonIcon: {
        marginRight: 8,
        marginTop: 2,
    },
    reasonInput: {
        flex: 1,
        fontSize: 15,
        textAlignVertical: 'top',
        paddingTop: 0,
        minHeight: 60,
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

