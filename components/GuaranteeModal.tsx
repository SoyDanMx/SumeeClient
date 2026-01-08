/**
 * Modal de Garantía Sumee
 * Muestra información detallada sobre la garantía y protección del cliente
 */

import React from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { SUMEE_COLORS } from '@/constants/Colors';

interface GuaranteeModalProps {
    visible: boolean;
    onClose: () => void;
    onOpenSupport?: () => void;
}

const GUARANTEE_FEATURES = [
    {
        icon: 'shield-checkmark' as const,
        title: 'Protección Total',
        description: 'Tu dinero está protegido hasta que el trabajo esté completamente terminado y verificado.',
    },
    {
        icon: 'time-outline' as const,
        title: 'Garantía de 30-90 días',
        description: 'Cobertura extendida según el tipo de servicio. Reparación o reembolso garantizado.',
    },
    {
        icon: 'checkmark-circle-outline' as const,
        title: 'Profesionales Verificados',
        description: 'Todos nuestros técnicos están certificados y verificados para tu tranquilidad.',
    },
    {
        icon: 'cash-outline' as const,
        title: 'Reembolso Garantizado',
        description: 'Si no quedas satisfecho, te devolvemos tu dinero sin complicaciones.',
    },
];

export function GuaranteeModal({ visible, onClose, onOpenSupport }: GuaranteeModalProps) {
    const { theme } = useTheme();

    const handleContactPress = () => {
        onClose();
        if (onOpenSupport) {
            // Pequeño delay para que el modal se cierre primero
            setTimeout(() => {
                onOpenSupport();
            }, 300);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerIconContainer}>
                            <View style={[styles.iconCircle, { backgroundColor: SUMEE_COLORS.PURPLE + '20' }]}>
                                <Ionicons name="shield-checkmark" size={32} color={SUMEE_COLORS.PURPLE} />
                            </View>
                        </View>
                        <Text variant="h2" weight="bold" style={styles.headerTitle}>
                            Garantía Sumee
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Mensaje Principal */}
                        <View style={styles.mainMessage}>
                            <Text variant="h3" weight="bold" style={styles.mainTitle}>
                                Tu tranquilidad es nuestra prioridad
                            </Text>
                            <Text variant="body" color={theme.textSecondary} style={styles.mainDescription}>
                                En SumeeApp, protegemos tu inversión y garantizamos la calidad de cada servicio. 
                                Trabajamos solo con profesionales verificados y ofrecemos protección completa 
                                desde el inicio hasta la finalización del proyecto.
                            </Text>
                        </View>

                        {/* Características */}
                        <View style={styles.featuresContainer}>
                            {GUARANTEE_FEATURES.map((feature, index) => (
                                <Card
                                    key={index}
                                    variant="elevated"
                                    style={[styles.featureCard, { backgroundColor: theme.surface }]}
                                >
                                    <View style={styles.featureContent}>
                                        <View
                                            style={[
                                                styles.featureIconContainer,
                                                { backgroundColor: SUMEE_COLORS.PURPLE + '15' },
                                            ]}
                                        >
                                            <Ionicons
                                                name={feature.icon}
                                                size={24}
                                                color={SUMEE_COLORS.PURPLE}
                                            />
                                        </View>
                                        <View style={styles.featureTextContainer}>
                                            <Text variant="body" weight="bold" style={styles.featureTitle}>
                                                {feature.title}
                                            </Text>
                                            <Text variant="caption" color={theme.textSecondary}>
                                                {feature.description}
                                            </Text>
                                        </View>
                                    </View>
                                </Card>
                            ))}
                        </View>

                        {/* Información Adicional */}
                        <View style={styles.additionalInfo}>
                            <Card
                                variant="elevated"
                                style={[styles.infoCard, { backgroundColor: SUMEE_COLORS.PURPLE + '10' }]}
                            >
                                <View style={styles.infoContent}>
                                    <Ionicons
                                        name="information-circle"
                                        size={20}
                                        color={SUMEE_COLORS.PURPLE}
                                    />
                                    <Text variant="caption" style={[styles.infoText, { color: SUMEE_COLORS.PURPLE }]}>
                                        La garantía aplica a todos los servicios contratados a través de SumeeApp. 
                                        Para más detalles, consulta nuestros Términos y Condiciones.
                                    </Text>
                                </View>
                            </Card>
                        </View>

                        {/* Botón de Contacto */}
                        <TouchableOpacity
                            style={[styles.contactButton, { backgroundColor: SUMEE_COLORS.PURPLE }]}
                            activeOpacity={0.8}
                            onPress={handleContactPress}
                        >
                            <Ionicons name="help-circle-outline" size={20} color="#FFFFFF" />
                            <Text variant="body" weight="bold" color="#FFFFFF">
                                ¿Tienes dudas? Contáctanos
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    keyboardView: {
        maxHeight: Dimensions.get('window').height * 0.6, // 60% de la altura de la pantalla - más compacto
        width: '100%',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        flex: 1, // Usa flex en lugar de height para mejor control
        paddingBottom: 0,
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        alignItems: 'center',
        position: 'relative',
    },
    headerIconContainer: {
        marginBottom: 12,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100, // Espacio generoso al final para que el botón sea visible al hacer scroll
    },
    mainMessage: {
        marginBottom: 24,
    },
    mainTitle: {
        marginBottom: 12,
        textAlign: 'center',
    },
    mainDescription: {
        textAlign: 'center',
        lineHeight: 22,
    },
    featuresContainer: {
        gap: 12,
        marginBottom: 24,
    },
    featureCard: {
        padding: 0,
    },
    featureContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        gap: 16,
    },
    featureIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        marginBottom: 4,
    },
    additionalInfo: {
        marginBottom: 24,
    },
    infoCard: {
        padding: 16,
    },
    infoContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    infoText: {
        flex: 1,
        lineHeight: 18,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginTop: 8,
        marginBottom: 32, // Espacio adicional al final para que sea visible
    },
});

