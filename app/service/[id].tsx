import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
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
import { Badge } from '@/components/Badge';
import { QuoteService, ServiceQuote, ServiceQuoteFormData } from '@/services/quotes';
import { CategoryService } from '@/services/categories';
import { supabase } from '@/lib/supabase';
import { SUMEE_COLORS } from '@/constants/Colors';
import { useServiceRequestValidation } from '@/hooks/useServiceRequestValidation';
import { SmartServiceRequestButton } from '@/components/SmartServiceRequestButton';

interface ServiceCatalogItem {
    id: string;
    discipline: string;
    service_name: string;
    price_type: 'fixed' | 'range' | 'starting_at';
    min_price: number;
    max_price: number | null;
    unit: string;
    includes_materials: boolean;
    description: string | null;
}

export default function ServiceDetailScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const { id, aiDetected, preFilled } = useLocalSearchParams<{ 
        id: string; 
        aiDetected?: string;
        preFilled?: string;
    }>();
    
    const [service, setService] = useState<ServiceCatalogItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<ServiceQuoteFormData>({});
    const [aiPreFilled, setAiPreFilled] = useState<any>(null);
    const [immediateService, setImmediateService] = useState(false);
    const [quote, setQuote] = useState<ServiceQuote | null>(null);
    const [currentStep, setCurrentStep] = useState<'form' | 'quote' | 'schedule'>('form');
    const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

    // Validación en tiempo real
    const validation = useServiceRequestValidation({
        formData,
        quote,
        service,
        selectedDate,
    });

    useEffect(() => {
        loadService();
        
        // Si hay datos pre-llenados de IA, aplicarlos
        if (aiDetected === 'true' && preFilled) {
            try {
                const preFilledData = JSON.parse(decodeURIComponent(preFilled));
                setAiPreFilled(preFilledData);
                
                // Pre-llenar formulario con datos de IA
                if (preFilledData.descripcion) {
                    setFormData(prev => ({
                        ...prev,
                        description: preFilledData.descripcion,
                        additionalInfo: preFilledData.descripcion,
                        problem_description: preFilledData.descripcion, // Para uso en creación de lead
                    }));
                }
                
                // Si hay urgencia, aplicarla
                if (preFilledData.urgencia) {
                    if (preFilledData.urgencia === 'alta') {
                        setImmediateService(true);
                    }
                }
                
                console.log('[ServiceDetail] ✅ Datos de IA aplicados:', preFilledData);
            } catch (error) {
                console.error('[ServiceDetail] Error parsing pre-filled data:', error);
            }
        }
    }, [id, aiDetected, preFilled]);

    useEffect(() => {
        if (service) {
            calculateQuote();
        }
    }, [formData, immediateService, service]);

    const loadService = async () => {
        try {
            const { data, error } = await supabase
                .from('service_catalog')
                .select('*')
                .eq('id', id)
                .eq('is_active', true)
                .single();

            if (error) throw error;
            setService(data);
        } catch (error) {
            console.error('[ServiceDetail] Error loading service:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateQuote = () => {
        if (!service) return;

        const calculatedQuote = QuoteService.calculatePrice(
            service.min_price,
            formData,
            immediateService
        );
        setQuote(calculatedQuote);
    };

    const handleFormChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleContinue = () => {
        if (currentStep === 'form') {
            setCurrentStep('quote');
        } else if (currentStep === 'quote') {
            setCurrentStep('schedule');
        }
    };

    const handleRequestService = async () => {
        if (!user || !service || !quote || !validation.canSubmit) {
            console.warn('[ServiceDetail] No se puede solicitar servicio:', {
                hasUser: !!user,
                hasService: !!service,
                hasQuote: !!quote,
                canSubmit: validation.canSubmit,
                missingFields: validation.missingFields,
            });
            return;
        }

        try {
            // Navegar a pantalla de confirmación con todos los datos
            router.push({
                pathname: '/request-service/confirm',
                params: {
                    serviceId: service.id,
                    quoteData: JSON.stringify(quote),
                    formData: JSON.stringify(formData),
                    selectedDate: selectedDate || '',
                },
            });
        } catch (error) {
            console.error('[ServiceDetail] Error requesting service:', error);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!service) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.errorContainer}>
                    <Text variant="h3" weight="bold">Servicio no encontrado</Text>
                    <Button
                        title="Volver"
                        onPress={() => router.back()}
                        style={styles.backButton}
                    />
                </View>
            </SafeAreaView>
        );
    }

    const disciplineConfig = CategoryService.getDisciplineConfig(service.discipline);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
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
                        <View style={styles.headerContent}>
                            <View style={[styles.iconContainer, { backgroundColor: disciplineConfig?.color || theme.surface }]}>
                                <Ionicons
                                    name={disciplineConfig?.icon || 'construct'}
                                    size={32}
                                    color={disciplineConfig?.iconColor || theme.text}
                                />
                            </View>
                            <Text variant="h2" weight="bold" style={styles.serviceName}>
                                {service.service_name}
                            </Text>
                            <View style={styles.priceContainer}>
                                <Text variant="h3" weight="bold" color={theme.primary}>
                                    Desde ${service.min_price}
                                </Text>
                                {service.price_type === 'fixed' && (
                                    <Badge variant="fixed-price">Precio Fijo</Badge>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Formulario Dinámico (Similar a AORA) */}
                    {currentStep === 'form' && (
                        <View style={styles.formSection}>
                            <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                                ¿Qué necesitas?
                            </Text>

                            {/* Tipo de Servicio */}
                            <Card variant="elevated" style={styles.formCard}>
                                <Text variant="label" weight="medium" style={styles.fieldLabel}>
                                    Tipo de servicio
                                </Text>
                                <View style={styles.optionsRow}>
                                    {['Instalar', 'Mantenimiento', 'Reparar'].map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={[
                                                styles.optionButton,
                                                formData.service_type === option && {
                                                    backgroundColor: theme.primary,
                                                    borderColor: theme.primary,
                                                },
                                                { borderColor: theme.border },
                                            ]}
                                            onPress={() => handleFormChange('service_type', option)}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                variant="body"
                                                weight="medium"
                                                style={[
                                                    formData.service_type === option && { color: '#FFFFFF' },
                                                ]}
                                            >
                                                {option}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </Card>

                            {/* Servicio Inmediato */}
                            <Card variant="elevated" style={styles.formCard}>
                                <Text variant="label" weight="medium" style={styles.fieldLabel}>
                                    ¿Necesitas servicio inmediato?
                                </Text>
                                <View style={styles.optionsRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.optionButton,
                                            immediateService && {
                                                backgroundColor: theme.primary,
                                                borderColor: theme.primary,
                                            },
                                            { borderColor: theme.border },
                                        ]}
                                        onPress={() => setImmediateService(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            variant="body"
                                            weight="medium"
                                            style={[
                                                immediateService && { color: '#FFFFFF' },
                                            ]}
                                        >
                                            Sí (+$10)
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.optionButton,
                                            !immediateService && {
                                                backgroundColor: theme.primary,
                                                borderColor: theme.primary,
                                            },
                                            { borderColor: theme.border },
                                        ]}
                                        onPress={() => setImmediateService(false)}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            variant="body"
                                            weight="medium"
                                            style={[
                                                !immediateService && { color: '#FFFFFF' },
                                            ]}
                                        >
                                            No
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </Card>

                            {/* Preguntas específicas según el servicio */}
                            {service.discipline === 'aire-acondicionado' && (
                                <>
                                    <Card variant="elevated" style={styles.formCard}>
                                        <Text variant="label" weight="medium" style={styles.fieldLabel}>
                                            ¿Necesitas que desinstalemos el A/C actual?
                                        </Text>
                                        <View style={styles.optionsRow}>
                                            {['Sí', 'No'].map((option) => (
                                                <TouchableOpacity
                                                    key={option}
                                                    style={[
                                                        styles.optionButton,
                                                        formData.needs_uninstall === (option === 'Sí') && {
                                                            backgroundColor: theme.primary,
                                                            borderColor: theme.primary,
                                                        },
                                                        { borderColor: theme.border },
                                                    ]}
                                                    onPress={() => handleFormChange('needs_uninstall', option === 'Sí')}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text
                                                        variant="body"
                                                        weight="medium"
                                                        style={[
                                                            formData.needs_uninstall === (option === 'Sí') && { color: '#FFFFFF' },
                                                        ]}
                                                    >
                                                        {option}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </Card>

                                    <Card variant="elevated" style={styles.formCard}>
                                        <Text variant="label" weight="medium" style={styles.fieldLabel}>
                                            ¿Cuántos A/C necesitas instalar?
                                        </Text>
                                        <View style={styles.optionsRow}>
                                            {[1, 2, 3, 4, '5+'].map((num) => (
                                                <TouchableOpacity
                                                    key={num}
                                                    style={[
                                                        styles.optionButton,
                                                        formData.quantity === num && {
                                                            backgroundColor: theme.primary,
                                                            borderColor: theme.primary,
                                                        },
                                                        { borderColor: theme.border },
                                                    ]}
                                                    onPress={() => handleFormChange('quantity', num)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text
                                                        variant="body"
                                                        weight="medium"
                                                        style={[
                                                            formData.quantity === num && { color: '#FFFFFF' },
                                                        ]}
                                                    >
                                                        {num}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </Card>
                                </>
                            )}

                            {/* Botón Continuar */}
                            <Button
                                title="Continuar"
                                onPress={handleContinue}
                                style={styles.continueButton}
                            />
                        </View>
                    )}

                    {/* Cotización (Similar a AORA) */}
                    {currentStep === 'quote' && quote && (
                        <View style={styles.quoteSection}>
                            <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                                Resumen de Cotización
                            </Text>

                            <Card variant="elevated" style={styles.quoteCard}>
                                {/* Servicio */}
                                <View style={styles.quoteRow}>
                                    <Text variant="label" color={theme.textSecondary}>
                                        Precio Base
                                    </Text>
                                    <Text variant="body" weight="bold">
                                        ${quote.base_price.toFixed(2)}
                                    </Text>
                                </View>

                                {quote.immediate_service_fee > 0 && (
                                    <View style={styles.quoteRow}>
                                        <Text variant="label" color={theme.textSecondary}>
                                            Servicio Inmediato
                                        </Text>
                                        <Text variant="body" weight="bold">
                                            ${quote.immediate_service_fee.toFixed(2)}
                                        </Text>
                                    </View>
                                )}

                                {quote.additional_services.filter(s => s.selected).length > 0 && (
                                    <>
                                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                                        <Text variant="label" weight="bold" style={styles.subsectionTitle}>
                                            Adicionales
                                        </Text>
                                        {quote.additional_services
                                            .filter(s => s.selected)
                                            .map((service) => (
                                                <View key={service.id} style={styles.quoteRow}>
                                                    <Text variant="label" color={theme.textSecondary}>
                                                        {service.name}
                                                    </Text>
                                                    <Text variant="body" weight="bold">
                                                        ${service.price.toFixed(2)}
                                                    </Text>
                                                </View>
                                            ))}
                                    </>
                                )}

                                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                                {/* Descuentos */}
                                {quote.discounts.length > 0 && (
                                    <>
                                        {quote.discounts.map((discount) => (
                                            <View key={discount.id} style={styles.quoteRow}>
                                                <Text variant="label" color={theme.success}>
                                                    {discount.name}
                                                </Text>
                                                <Text variant="body" weight="bold" color={theme.success}>
                                                    -${discount.amount.toFixed(2)}
                                                </Text>
                                            </View>
                                        ))}
                                    </>
                                )}

                                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                                {/* Total */}
                                <View style={styles.totalRow}>
                                    <Text variant="h3" weight="bold">
                                        Total
                                    </Text>
                                    <Text variant="h3" weight="bold" color={theme.primary}>
                                        ${quote.total.toFixed(2)}
                                    </Text>
                                </View>

                                <View style={styles.totalRow}>
                                    <Text variant="body" color={theme.textSecondary}>
                                        Total + IVA (16%)
                                    </Text>
                                    <Text variant="h2" weight="bold" color={theme.primary}>
                                        ${quote.total_with_tax.toFixed(2)}
                                    </Text>
                                </View>
                            </Card>

                            <Button
                                title="Continuar"
                                onPress={handleContinue}
                                style={styles.continueButton}
                            />
                        </View>
                    )}

                    {/* Agendamiento (Similar a AORA) */}
                    {currentStep === 'schedule' && (
                        <View style={styles.scheduleSection}>
                            <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                                Días Disponibles
                            </Text>
                            <Text variant="body" color={theme.textSecondary} style={styles.sectionSubtitle}>
                                Prográmalo o solicítalo de inmediato. Disponibilidad garantizada.
                            </Text>

                            <Card variant="elevated" style={styles.scheduleCard}>
                                {getAvailableDays().map((day, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.dayOption,
                                            (formData.selected_date === day.date || selectedDate === day.date) && {
                                                backgroundColor: theme.primary + '20',
                                            },
                                        ]}
                                        onPress={() => {
                                            const date = day.date;
                                            setSelectedDate(date);
                                            handleFormChange('selected_date', date);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.dayContent}>
                                            <Text variant="body" weight="bold">
                                                {day.label}
                                            </Text>
                                            <Text variant="caption" color={theme.textSecondary}>
                                                {day.dateLabel}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                ))}
                            </Card>

                            <SmartServiceRequestButton
                                validation={validation}
                                loading={false}
                                onPress={handleRequestService}
                                variant="A"
                                style={styles.requestButton}
                            />
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function getAvailableDays() {
    const today = new Date();
    const days = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        let label = '';
        if (i === 0) {
            label = 'Hoy';
        } else if (i === 1) {
            label = 'Mañana';
        } else {
            label = date.toLocaleDateString('es-MX', { weekday: 'long' });
        }

        days.push({
            label,
            date: date.toISOString().split('T')[0],
            dateLabel: date.toLocaleDateString('es-MX', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short' 
            }),
        });
    }

    return days;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        marginBottom: 16,
    },
    headerContent: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    serviceName: {
        marginBottom: 8,
        textAlign: 'center',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    formSection: {
        padding: 20,
    },
    sectionTitle: {
        marginBottom: 16,
    },
    sectionSubtitle: {
        marginBottom: 16,
    },
    formCard: {
        marginBottom: 16,
    },
    fieldLabel: {
        marginBottom: 12,
    },
    optionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    optionButton: {
        flex: 1,
        minWidth: 100,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        alignItems: 'center',
    },
    continueButton: {
        marginTop: 24,
    },
    quoteSection: {
        padding: 20,
    },
    quoteCard: {
        marginBottom: 20,
    },
    quoteRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    subsectionTitle: {
        marginBottom: 8,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    scheduleSection: {
        padding: 20,
    },
    scheduleCard: {
        marginBottom: 20,
        padding: 0,
    },
    dayOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    dayContent: {
        flex: 1,
    },
    requestButton: {
        marginTop: 24,
    },
});
