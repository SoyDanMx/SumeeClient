import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { PaymentPreferenceService, PaymentMethod } from '@/services/paymentPreferences';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentMethodSelectorProps {
    servicePrice: number;
    isUrgent?: boolean;
    onMethodChange: (method: PaymentMethod) => void;
    initialMethod?: PaymentMethod | 'pending';
    showSuggestions?: boolean;
}

/**
 * Componente reutilizable para selección de método de pago
 * Con lógica inteligente de preferencias y sugerencias contextuales
 */
export function PaymentMethodSelector({
    servicePrice,
    isUrgent = false,
    onMethodChange,
    initialMethod = 'pending',
    showSuggestions = true,
}: PaymentMethodSelectorProps) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'pending'>(initialMethod);
    const [suggestedMethod, setSuggestedMethod] = useState<PaymentMethod | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPaymentPreference();
    }, [user, servicePrice, isUrgent]);

    const loadPaymentPreference = async () => {
        if (!user) {
            // Sin usuario, solo sugerir contextualmente
            const suggested = PaymentPreferenceService.suggestPaymentMethod(
                servicePrice,
                isUrgent,
                null
            );
            setSuggestedMethod(suggested);
            if (paymentMethod === 'pending') {
                setPaymentMethod(suggested);
                onMethodChange(suggested);
            }
            setLoading(false);
            return;
        }

        try {
            // Obtener método preferido del usuario
            const preferredMethod = await PaymentPreferenceService.getPreferredPaymentMethod(user.id);
            
            // Sugerir método contextual
            const suggested = PaymentPreferenceService.suggestPaymentMethod(
                servicePrice,
                isUrgent,
                preferredMethod
            );

            setSuggestedMethod(suggested);
            
            // Auto-seleccionar método sugerido si no hay uno seleccionado
            if (paymentMethod === 'pending') {
                setPaymentMethod(suggested);
                onMethodChange(suggested);
            }

            console.log('[PaymentMethodSelector] 💳 Payment method suggested:', {
                preferred: preferredMethod,
                suggested,
                isUrgent,
                total: servicePrice,
            });
        } catch (error) {
            console.error('[PaymentMethodSelector] Error loading payment preference:', error);
            // Fallback a efectivo si hay error
            const fallback = 'cash';
            if (paymentMethod === 'pending') {
                setPaymentMethod(fallback);
                onMethodChange(fallback);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleMethodChange = async (method: PaymentMethod) => {
        setPaymentMethod(method);
        onMethodChange(method);
        
        // Guardar preferencia del usuario
        if (user) {
            await PaymentPreferenceService.savePreferredPaymentMethod(user.id, method);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text variant="body" color={theme.textSecondary}>
                    Cargando métodos de pago...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                    Método de pago
                </Text>
                {showSuggestions && suggestedMethod && suggestedMethod === paymentMethod && (
                    <View style={[styles.suggestionBadge, { backgroundColor: theme.primary + '15' }]}>
                        <Ionicons name="sparkles" size={14} color={theme.primary} />
                        <Text variant="caption" color={theme.primary} style={{ marginLeft: 4 }}>
                            Recomendado
                        </Text>
                    </View>
                )}
            </View>
            {showSuggestions && (
                <Text variant="caption" color={theme.textSecondary} style={styles.sectionSubtitle}>
                    {suggestedMethod 
                        ? `Sugerimos ${suggestedMethod === 'cash' ? 'efectivo' : suggestedMethod === 'debit' ? 'tarjeta de débito' : 'tarjeta de crédito'} para este servicio.`
                        : 'Elige cómo prefieres pagar. Puedes cambiarlo después.'}
                </Text>
            )}
            <Card variant="elevated" style={styles.paymentMethodCard}>
                {/* Efectivo */}
                <TouchableOpacity
                    style={[
                        styles.paymentMethodOption,
                        paymentMethod === 'cash' && { 
                            backgroundColor: theme.primary + '20',
                            borderWidth: 2,
                            borderColor: theme.primary,
                        },
                        showSuggestions && suggestedMethod === 'cash' && paymentMethod !== 'cash' && {
                            borderWidth: 1,
                            borderColor: theme.primary + '40',
                        },
                    ]}
                    onPress={() => handleMethodChange('cash')}
                    activeOpacity={0.7}
                >
                    <View style={[
                        styles.paymentIconContainer,
                        paymentMethod === 'cash' && { backgroundColor: theme.primary + '15' },
                    ]}>
                        <Ionicons
                            name="cash-outline"
                            size={24}
                            color={paymentMethod === 'cash' ? theme.primary : theme.textSecondary}
                        />
                    </View>
                    <View style={styles.paymentTextContainer}>
                        <View style={styles.paymentTitleRow}>
                            <Text variant="body" weight={paymentMethod === 'cash' ? 'bold' : 'medium'}>
                                Efectivo
                            </Text>
                            {showSuggestions && suggestedMethod === 'cash' && paymentMethod !== 'cash' && (
                                <Ionicons name="sparkles" size={14} color={theme.primary} style={{ marginLeft: 6 }} />
                            )}
                        </View>
                        <Text variant="caption" color={theme.textSecondary}>
                            Pago al momento del servicio
                        </Text>
                    </View>
                    {paymentMethod === 'cash' && (
                        <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                    )}
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                {/* Tarjeta de Débito */}
                <TouchableOpacity
                    style={[
                        styles.paymentMethodOption,
                        paymentMethod === 'debit' && { 
                            backgroundColor: theme.primary + '20',
                            borderWidth: 2,
                            borderColor: theme.primary,
                        },
                        showSuggestions && suggestedMethod === 'debit' && paymentMethod !== 'debit' && {
                            borderWidth: 1,
                            borderColor: theme.primary + '40',
                        },
                    ]}
                    onPress={() => handleMethodChange('debit')}
                    activeOpacity={0.7}
                >
                    <View style={[
                        styles.paymentIconContainer,
                        paymentMethod === 'debit' && { backgroundColor: theme.primary + '15' },
                    ]}>
                        <Ionicons
                            name="card-outline"
                            size={24}
                            color={paymentMethod === 'debit' ? theme.primary : theme.textSecondary}
                        />
                    </View>
                    <View style={styles.paymentTextContainer}>
                        <View style={styles.paymentTitleRow}>
                            <Text variant="body" weight={paymentMethod === 'debit' ? 'bold' : 'medium'}>
                                Tarjeta de débito
                            </Text>
                            {showSuggestions && suggestedMethod === 'debit' && paymentMethod !== 'debit' && (
                                <Ionicons name="sparkles" size={14} color={theme.primary} style={{ marginLeft: 6 }} />
                            )}
                        </View>
                        <Text variant="caption" color={theme.textSecondary}>
                            Pago seguro con tarjeta de débito
                        </Text>
                    </View>
                    {paymentMethod === 'debit' && (
                        <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                    )}
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                {/* Tarjeta de Crédito */}
                <TouchableOpacity
                    style={[
                        styles.paymentMethodOption,
                        paymentMethod === 'credit' && { 
                            backgroundColor: theme.primary + '20',
                            borderWidth: 2,
                            borderColor: theme.primary,
                        },
                        showSuggestions && suggestedMethod === 'credit' && paymentMethod !== 'credit' && {
                            borderWidth: 1,
                            borderColor: theme.primary + '40',
                        },
                    ]}
                    onPress={() => handleMethodChange('credit')}
                    activeOpacity={0.7}
                >
                    <View style={[
                        styles.paymentIconContainer,
                        paymentMethod === 'credit' && { backgroundColor: theme.primary + '15' },
                    ]}>
                        <Ionicons
                            name="card"
                            size={24}
                            color={paymentMethod === 'credit' ? theme.primary : theme.textSecondary}
                        />
                    </View>
                    <View style={styles.paymentTextContainer}>
                        <View style={styles.paymentTitleRow}>
                            <Text variant="body" weight={paymentMethod === 'credit' ? 'bold' : 'medium'}>
                                Tarjeta de crédito
                            </Text>
                            {showSuggestions && suggestedMethod === 'credit' && paymentMethod !== 'credit' && (
                                <Ionicons name="sparkles" size={14} color={theme.primary} style={{ marginLeft: 6 }} />
                            )}
                        </View>
                        <Text variant="caption" color={theme.textSecondary}>
                            Pago seguro con tarjeta de crédito
                        </Text>
                    </View>
                    {paymentMethod === 'credit' && (
                        <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                    )}
                </TouchableOpacity>
            </Card>
            
            {/* Info adicional para métodos de tarjeta */}
            {(paymentMethod === 'debit' || paymentMethod === 'credit') && (
                <View style={[styles.paymentInfoCard, { backgroundColor: theme.surface }]}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
                    <Text variant="caption" color={theme.textSecondary} style={styles.paymentInfoText}>
                        Tu pago está protegido. Solo se cobrará cuando el servicio se complete.
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sectionTitle: {
        flex: 1,
    },
    suggestionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    sectionSubtitle: {
        marginBottom: 12,
        fontSize: 13,
    },
    paymentMethodCard: {
        marginBottom: 8,
        padding: 0,
    },
    paymentMethodOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        borderRadius: 12,
        marginHorizontal: 4,
        marginVertical: 2,
    },
    paymentIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
    },
    paymentTextContainer: {
        flex: 1,
        marginLeft: 4,
    },
    paymentTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
    },
    paymentInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        gap: 8,
    },
    paymentInfoText: {
        flex: 1,
        marginLeft: 4,
    },
});
