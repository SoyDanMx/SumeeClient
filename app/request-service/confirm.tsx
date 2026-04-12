import React, { useState, useEffect, useRef } from 'react';
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
import { PaymentPreferenceService, PaymentMethod } from '@/services/paymentPreferences';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { UniversalMap } from '@/components/UniversalMap';

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
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'pending'>('pending');
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [locationInfo, setLocationInfo] = useState<{ address: string; source: string } | null>(null);

    // Refs para evitar loops infinitos
    const quoteDataParsed = useRef(false);
    const serviceLoaded = useRef<string | null>(null);

    // Validación
    const validation = useServiceRequestValidation({
        formData: quote?.form_data || {},
        quote,
        service,
        selectedDate: params.selectedDate,
    });

    // Cargar ubicación al inicio
    useEffect(() => {
        if (user) {
            initLocation();
        }
    }, [user]);

    const initLocation = async () => {
        if (!user) return;

        setLocationLoading(true);
        try {
            const locationResult = await SmartLocationService.getAndSaveLocation(user.id);
            if (locationResult && locationResult.location) {
                const address = locationResult.address ||
                    await SmartLocationService.reverseGeocode(
                        locationResult.location.latitude,
                        locationResult.location.longitude
                    ) ||
                    SmartLocationService.formatLocation(locationResult.location);

                setLocationInfo({
                    address,
                    source: locationResult.source === 'gps' ? 'GPS' :
                        locationResult.source === 'saved' ? 'Guardada' : 'Por defecto',
                });

                // Actualizar las coordenadas en el quote para el mapa
                setQuote(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        form_data: {
                            ...prev.form_data,
                            lat: locationResult.location.latitude.toString(),
                            lng: locationResult.location.longitude.toString(),
                        }
                    };
                });
            }
        } catch (error) {
            console.error('[Confirm] Error getting initial location:', error);
        } finally {
            setLocationLoading(false);
        }
    };

    // Parsear quoteData solo una vez
    useEffect(() => {
        if (params.quoteData && !quoteDataParsed.current) {
            try {
                const parsedQuote = JSON.parse(params.quoteData);
                setQuote(parsedQuote);
                quoteDataParsed.current = true;
            } catch (error) {
                console.error('[Confirm] Error parsing quote:', error);
            }
        }
    }, [params.quoteData]);

    // Cargar servicio solo una vez cuando cambia serviceId
    useEffect(() => {
        const sid = Array.isArray(params.serviceId) ? params.serviceId[0] : params.serviceId;
        if (sid && serviceLoaded.current !== sid) {
            loadService();
            serviceLoaded.current = sid;
        }
    }, [params.serviceId]);

    const handlePaymentMethodChange = (method: PaymentMethod) => {
        setPaymentMethod(method);
    };

    const loadService = async () => {
        const sid = Array.isArray(params.serviceId) ? params.serviceId[0] : params.serviceId;
        if (!sid) return;

        try {
            const { data, error } = await supabase
                .from('service_catalog')
                .select('*')
                .eq('id', sid)
                .single();

            if (error) throw error;

            // Solo actualizar si el servicio realmente cambió
            setService((prevService: any) => {
                if (prevService?.id === data?.id) {
                    return prevService; // No actualizar si es el mismo
                }
                return data;
            });
        } catch (error) {
            console.error('[Confirm] Error loading service:', error);
        }
    };

    /** Misma lógica que en useServiceRequestValidation: fecha en query o en la cotización. */
    const resolveAppointmentDateString = (): string => {
        const p = params.selectedDate;
        const fromParam = (Array.isArray(p) ? p[0] : p)?.toString().trim() || '';
        const fromQuote = quote?.form_data?.selected_date?.toString().trim() || '';
        return fromParam || fromQuote;
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
            // Usar ubicación ya cargada si existe, o cargarla si no
            let locationResult;
            if (locationInfo && quote?.form_data.lat && quote?.form_data.lng) {
                locationResult = {
                    location: {
                        latitude: parseFloat(quote.form_data.lat),
                        longitude: parseFloat(quote.form_data.lng),
                    },
                    address: locationInfo.address,
                    source: locationInfo.source === 'GPS' ? 'gps' : 'saved',
                    accuracy: 10,
                };
            } else {
                console.log('[Confirm] Obteniendo ubicación real...');
                locationResult = await SmartLocationService.getAndSaveLocation(user.id);
            }

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

            // Parsear fecha (params o quote.form_data; evita lead bloqueado si Expo omitió el query param)
            let appointmentDate: Date | undefined = undefined;
            const dateStr = resolveAppointmentDateString();
            if (dateStr) {
                try {
                    appointmentDate = new Date(dateStr);
                    if (!appointmentDate || isNaN(appointmentDate.getTime())) {
                        console.warn('[Confirm] Invalid date format, ignoring appointment:', dateStr);
                        appointmentDate = undefined;
                    } else {
                        console.log('[Confirm] Appointment date parsed:', {
                            original: dateStr,
                            parsed: appointmentDate.toISOString(),
                        });
                    }
                } catch (error) {
                    console.error('[Confirm] Error parsing appointment date:', error);
                    appointmentDate = undefined;
                }
            }

            console.log('[Confirm] Creating lead with:', {
                userId: user.id,
                serviceId: service.id,
                hasQuote: !!quote,
                hasLocation: !!location,
                hasAppointment: !!appointmentDate,
                appointmentDate: appointmentDate ? appointmentDate.toISOString() : undefined,
            });

            // El método de pago ya se guarda automáticamente en PaymentMethodSelector
            // No es necesario guardarlo aquí nuevamente

            // Crear lead con cotización
            const result = await QuoteService.createQuoteAndLead(
                user.id,
                service.id,
                quote,
                appointmentDate,
                location
            );

            console.log('[Confirm] ✅ Solicitud creada exitosamente:', {
                leadId: result.lead.id,
                status: result.lead.status,
                servicio: result.lead.servicio_solicitado,
            });

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
            console.error('[Confirm] ❌ Error confirming service:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                fullError: error,
            });

            // Mensaje de error más descriptivo
            let errorMessage = 'No se pudo crear la solicitud';
            if (error.message) {
                errorMessage = error.message;
                // Traducir errores comunes de PostgreSQL
                if (error.code === '22007') {
                    errorMessage = 'Error en el formato de fecha. Por favor intenta de nuevo.';
                } else if (error.code === '23502') {
                    errorMessage = 'Faltan campos requeridos. Por favor completa todos los datos.';
                } else if (error.code === '23505') {
                    errorMessage = 'Ya existe una solicitud similar. Por favor verifica tus solicitudes.';
                } else if (error.code === '42501') {
                    errorMessage = 'No tienes permisos para crear esta solicitud.';
                }
            }

            setLocationError(errorMessage);
            Alert.alert(
                'Error al crear solicitud',
                errorMessage,
                [{ text: 'OK' }]
            );
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
                        {/* Descuentos eliminados - precio transparente */}
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

                {/* Método de Pago - Componente Reutilizable */}
                <View style={styles.section}>
                    {quote && (
                        <PaymentMethodSelector
                            servicePrice={quote.total_with_tax}
                            isUrgent={quote.immediate_service_fee > 0}
                            onMethodChange={handlePaymentMethodChange}
                            initialMethod={paymentMethod}
                            showSuggestions={true}
                        />
                    )}
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

                            {quote?.form_data?.lat && quote?.form_data?.lng && (
                                <UniversalMap
                                    latitude={parseFloat(quote.form_data.lat)}
                                    longitude={parseFloat(quote.form_data.lng)}
                                    zoom={16}
                                    markers={[{
                                        id: 'preview',
                                        latitude: parseFloat(quote.form_data.lat),
                                        longitude: parseFloat(quote.form_data.lng),
                                        type: 'job',
                                        servicio: service?.service_name,
                                    }]}
                                    style={styles.map}
                                />
                            )}
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
    sectionSubtitle: {
        marginBottom: 12,
        fontSize: 13,
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
    map: {
        height: 180,
        width: '100%',
        borderRadius: 12,
        marginTop: 12,
    },
});

