import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { QuoteService, ServiceQuote } from '@/services/quotes';
import { supabase } from '@/lib/supabase';
import { SmartLocationService } from '@/services/SmartLocationService';
import { SmartServiceRequestButton } from '@/components/SmartServiceRequestButton';
import { useServiceRequestValidation } from '@/hooks/useServiceRequestValidation';

export default function ServiceConfirmationScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const params = useLocalSearchParams<{
        serviceId: string;
        quoteData: string;
        formData: string;
        selectedDate?: string;
    }>();

    const [loading, setLoading] = useState(false);
    const [quote, setQuote] = useState<ServiceQuote | null>(null);
    const [service, setService] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'pending'>('pending');
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [locationInfo, setLocationInfo] = useState<{ address: string; source: string } | null>(null);

    // Validación
    const validation = useServiceRequestValidation({
        formData: quote?.form_data || {},
        quote,
        service,
        selectedDate: params.selectedDate,
    });

    useEffect(() => {
        if (params.quoteData) {
            try {
                const parsedQuote = JSON.parse(params.quoteData);
                setQuote(parsedQuote);
            } catch (error) {
                console.error('[Confirm] Error parsing quote:', error);
            }
        }

        loadService();
    }, [params]);

    const loadService = async () => {
        if (!params.serviceId) return;

        try {
            const { data, error } = await supabase
                .from('service_catalog')
                .select('*')
                .eq('id', params.serviceId)
                .single();

            if (error) throw error;
            setService(data);
        } catch (error) {
            console.error('[Confirm] Error loading service:', error);
        }
    };

    const handleConfirm = async () => {
        if (!user || !quote || !service || !validation.canSubmit) {
            console.warn('[Confirm] No se puede confirmar:', {
                hasUser: !!user,
                hasQuote: !!quote,
                hasService: !!service,
                canSubmit: validation.canSubmit,
            });
            return;
        }

        setLoading(true);
        setLocationLoading(true);
        setLocationError(null);

        try {
            // Obtener ubicación real con fallbacks inteligentes
            console.log('[Confirm] Obteniendo ubicación real...');
            const locationResult = await SmartLocationService.getAndSaveLocation(user.id);

            if (!locationResult || !locationResult.location) {
                throw new Error('No se pudo obtener la ubicación');
            }

            // Validar cobertura
            const isInCoverage = SmartLocationService.validateCoverage(locationResult.location);
            if (!isInCoverage) {
                console.warn('[Confirm] ⚠️ Ubicación fuera de zona de cobertura');
            }

            // Obtener dirección completa si no está disponible
            let address = locationResult.address;
            if (!address) {
                address = await SmartLocationService.reverseGeocode(
                    locationResult.location.latitude,
                    locationResult.location.longitude
                ) || SmartLocationService.formatLocation(locationResult.location);
            }

            setLocationInfo({
                address,
                source: locationResult.source === 'gps' ? 'GPS' : 
                        locationResult.source === 'saved' ? 'Guardada' : 'Por defecto',
            });

            const location = {
                lat: locationResult.location.latitude,
                lng: locationResult.location.longitude,
                address: address,
            };

            console.log('[Confirm] ✅ Ubicación obtenida:', {
                source: locationResult.source,
                accuracy: locationResult.accuracy,
                address: address,
            });

            // Crear lead con cotización
            const result = await QuoteService.createQuoteAndLead(
                user.id,
                service.id,
                quote,
                params.selectedDate ? new Date(params.selectedDate) : undefined,
                location
            );

            console.log('[Confirm] ✅ Solicitud creada exitosamente:', result.lead.id);

            Alert.alert(
                '¡Solicitud Creada!',
                `Tu solicitud ha sido enviada desde ${address}. Los profesionales recibirán una notificación.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            router.replace('/(tabs)/projects');
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.error('[Confirm] Error confirming service:', error);
            const errorMessage = error.message || 'No se pudo crear la solicitud';
            setLocationError(errorMessage);
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
            setLocationLoading(false);
        }
    };

    if (!quote || !service) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <Text variant="body">Cargando...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="dark" />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.card }]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text variant="h2" weight="bold">
                        Confirmación
                    </Text>
                </View>

                {/* Resumen del Servicio */}
                <View style={styles.section}>
                    <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                        Resumen del servicio
                    </Text>
                    <Card variant="elevated" style={styles.summaryCard}>
                        <Text variant="body" weight="bold" style={styles.serviceName}>
                            {service.service_name}
                        </Text>
                        {quote.form_data.service_type && (
                            <Text variant="caption" color={theme.textSecondary}>
                                Tipo: {quote.form_data.service_type}
                            </Text>
                        )}
                    </Card>
                </View>

                {/* Detalle de Pago */}
                <View style={styles.section}>
                    <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                        Detalle de pago
                    </Text>
                    <Card variant="elevated" style={styles.paymentCard}>
                        {/* Servicio */}
                        <View style={styles.paymentRow}>
                            <Text variant="label" color={theme.textSecondary}>
                                SERVICIO
                            </Text>
                        </View>
                        <View style={styles.paymentRow}>
                            <Text variant="body">Precio Base</Text>
                            <Text variant="body" weight="bold">
                                ${quote.base_price.toFixed(2)}
                            </Text>
                        </View>
                        {quote.immediate_service_fee > 0 && (
                            <View style={styles.paymentRow}>
                                <Text variant="body">Servicio Inmediato</Text>
                                <Text variant="body" weight="bold">
                                    ${quote.immediate_service_fee.toFixed(2)}
                                </Text>
                            </View>
                        )}

                        {/* Adicionales */}
                        {quote.additional_services.filter(s => s.selected).length > 0 && (
                            <>
                                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                                <View style={styles.paymentRow}>
                                    <Text variant="label" color={theme.textSecondary}>
                                        ADICIONAL
                                    </Text>
                                </View>
                                {quote.additional_services
                                    .filter(s => s.selected)
                                    .map((service) => (
                                        <View key={service.id} style={styles.paymentRow}>
                                            <Text variant="body">{service.name}</Text>
                                            <Text variant="body" weight="bold">
                                                ${service.price.toFixed(2)}
                                            </Text>
                                        </View>
                                    ))}
                            </>
                        )}

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        {/* Total */}
                        <View style={styles.paymentRow}>
                            <Text variant="body" weight="bold">
                                Total
                            </Text>
                            <Text variant="body" weight="bold">
                                ${quote.total.toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.paymentRow}>
                            <Text variant="body" color={theme.textSecondary}>
                                Descuentos
                            </Text>
                            <Text variant="body" weight="bold" color={theme.success}>
                                -${quote.discounts.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                            </Text>
                        </View>
                        <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
                            <Text variant="h3" weight="bold">
                                Total más IVA
                            </Text>
                            <Text variant="h2" weight="bold" color={theme.primary}>
                                ${quote.total_with_tax.toFixed(2)}
                            </Text>
                        </View>
                    </Card>
                </View>

                {/* Método de Pago */}
                <View style={styles.section}>
                    <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                        Método de pago
                    </Text>
                    <Card variant="elevated" style={styles.paymentMethodCard}>
                        <TouchableOpacity
                            style={[
                                styles.paymentMethodOption,
                                paymentMethod === 'cash' && { backgroundColor: theme.primary + '20' },
                            ]}
                            onPress={() => setPaymentMethod('cash')}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="cash"
                                size={24}
                                color={paymentMethod === 'cash' ? theme.primary : theme.textSecondary}
                            />
                            <Text variant="body" weight={paymentMethod === 'cash' ? 'bold' : 'normal'}>
                                Efectivo
                            </Text>
                            {paymentMethod === 'cash' && (
                                <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                            )}
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        <TouchableOpacity
                            style={[
                                styles.paymentMethodOption,
                                paymentMethod === 'card' && { backgroundColor: theme.primary + '20' },
                            ]}
                            onPress={() => setPaymentMethod('card')}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="card"
                                size={24}
                                color={paymentMethod === 'card' ? theme.primary : theme.textSecondary}
                            />
                            <Text variant="body" weight={paymentMethod === 'card' ? 'bold' : 'normal'}>
                                Tarjeta de crédito
                            </Text>
                            {paymentMethod === 'card' && (
                                <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                            )}
                        </TouchableOpacity>
                    </Card>
                </View>

                {/* Información de Ubicación */}
                {locationInfo && (
                    <View style={styles.section}>
                        <Card variant="elevated" style={styles.locationCard}>
                            <View style={styles.locationHeader}>
                                <Ionicons name="location" size={20} color={theme.primary} />
                                <Text variant="body" weight="medium">
                                    Ubicación del servicio
                                </Text>
                            </View>
                            <Text variant="body" style={styles.locationAddress}>
                                {locationInfo.address}
                            </Text>
                            <Text variant="caption" color={theme.textSecondary} style={styles.locationSource}>
                                Fuente: {locationInfo.source}
                            </Text>
                        </Card>
                    </View>
                )}

                {/* Botón Confirmar */}
                <View style={styles.confirmSection}>
                    <SmartServiceRequestButton
                        validation={validation}
                        loading={loading || locationLoading}
                        error={locationError}
                        onPress={handleConfirm}
                        variant="A"
                        style={styles.confirmButton}
                    />
                </View>
            </ScrollView>
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
    header: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        marginRight: 16,
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        marginBottom: 16,
    },
    summaryCard: {
        marginBottom: 8,
    },
    serviceName: {
        marginBottom: 4,
    },
    paymentCard: {
        marginBottom: 8,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 2,
        marginTop: 8,
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
    },
    confirmSection: {
        padding: 20,
        paddingBottom: 40,
    },
    confirmButton: {
        marginTop: 8,
    },
    locationCard: {
        marginBottom: 8,
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    locationAddress: {
        marginTop: 4,
        marginBottom: 4,
    },
    locationSource: {
        fontSize: 12,
    },
});

