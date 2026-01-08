import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';
import { GeminiIcon } from './GeminiIcon';
import { AISearchService, AISearchResult } from '@/services/aiSearch';
import { findServiceByMapping } from '@/services/serviceMapping';
import { MLTrackingService } from '@/services/ml/tracking';
import { supabase } from '@/lib/supabase';

interface AISearchBarProps {
    placeholder?: string;
    onServiceDetected?: (result: AISearchResult) => void;
    onSearch?: (query: string) => void;
    autoAnalyze?: boolean; // Analizar automáticamente después de escribir
    minLength?: number; // Longitud mínima para análisis automático
}

export function AISearchBar({
    placeholder = "Describe tu problema... Ej: 'Tengo una fuga de agua en el baño'",
    onServiceDetected,
    onSearch,
    autoAnalyze = true,
    minLength = 15,
}: AISearchBarProps) {
    const { theme } = useTheme();
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState<AISearchResult | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const currentInteractionId = useRef<string | null>(null);

    // Debounce para análisis automático
    useEffect(() => {
        if (!autoAnalyze || query.length < minLength) {
            setAiResult(null);
            return;
        }

        const timer = setTimeout(async () => {
            await analyzeProblem(query);
        }, 1000); // Esperar 1 segundo después de que el usuario deje de escribir

        return () => clearTimeout(timer);
    }, [query, autoAnalyze, minLength]);

    const analyzeProblem = useCallback(async (problemDescription: string) => {
        if (!problemDescription.trim() || problemDescription.length < minLength) {
            return;
        }

        setAnalyzing(true);
        try {
            const result = await AISearchService.analyzeProblem(problemDescription);
            setAiResult(result);
            
            // 🆕 TRACKING: Guardar interacción ML
            if (result.detected_service) {
                const interactionId = await MLTrackingService.trackInteraction({
                    query: problemDescription,
                    predicted_service_id: result.detected_service.id,
                    predicted_service_name: result.detected_service.service_name,
                    predicted_confidence: result.confidence,
                    features: {
                        query_length: problemDescription.length,
                        has_urgency_keywords: problemDescription.toLowerCase().includes('urgente') || 
                                             problemDescription.toLowerCase().includes('emergencia'),
                        has_price_keywords: /\$\d+|\d+\s*(pesos|mxn)/i.test(problemDescription),
                        discipline: result.detected_service.discipline,
                    },
                });
                
                // Guardar interactionId para actualizar después
                currentInteractionId.current = interactionId;
            }
            
            if (result.detected_service && onServiceDetected) {
                onServiceDetected(result);
            }
        } catch (error) {
            console.error('[AISearchBar] Error analyzing:', error);
        } finally {
            setAnalyzing(false);
        }
    }, [onServiceDetected, minLength]);

    const handleManualAnalyze = () => {
        if (query.trim().length >= minLength) {
            analyzeProblem(query);
        }
    };

    const handleSearch = () => {
        if (onSearch) {
            onSearch(query);
        } else {
            // Análisis por defecto
            analyzeProblem(query);
        }
    };

    // Sugerencias inteligentes con navegación directa
    const suggestions = [
        { text: "Tengo una fuga de agua en el baño", direct: true },
        { text: "Necesito instalar una lámpara", direct: true },
        { text: "Quiero pintar mi habitación", direct: true },
        { text: "Mi aire acondicionado no enfría", direct: true },
    ];

    // Manejar click en sugerencia con navegación directa si hay mapeo
    const handleSuggestionPress = useCallback(async (suggestionText: string) => {
        setQuery(suggestionText);
        
        // Verificar si hay mapeo directo
        const mapping = findServiceByMapping(suggestionText);
        if (mapping && mapping.confidence >= 0.9) {
            // Buscar servicio en BD y navegar directamente
            const { data: services } = await supabase
                .from('service_catalog')
                .select('*')
                .eq('service_name', mapping.service_name)
                .eq('discipline', mapping.discipline)
                .eq('is_active', true)
                .limit(1);

            if (services && services.length > 0) {
                const service = services[0];
                
                // 🆕 TRACKING: Trackear click en sugerencia
                await MLTrackingService.trackServiceClick(
                    service.id,
                    service.service_name,
                    suggestionText,
                    currentInteractionId.current || undefined
                );
                
                router.push(`/service/${service.id}?aiDetected=true&directMapping=true`);
                return;
            }
        }
        
        // Si no hay mapeo directo, usar análisis IA
        if (autoAnalyze) {
            setTimeout(() => analyzeProblem(suggestionText), 500);
        }
    }, [autoAnalyze, router]);

    return (
        <View style={styles.container}>
            <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {analyzing ? (
                    <View style={styles.icon}>
                        <GeminiIcon size={24} color={theme.primary} />
                    </View>
                ) : (
                    <Ionicons
                        name="search"
                        size={20}
                        color={theme.textSecondary}
                        style={styles.icon}
                    />
                )}
                <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder={placeholder}
                    placeholderTextColor={theme.textSecondary}
                    value={query}
                    onChangeText={(text) => {
                        setQuery(text);
                        setAiResult(null);
                        if (onSearch) {
                            onSearch(text);
                        }
                    }}
                    multiline
                    maxLength={500}
                    numberOfLines={3}
                />
                {analyzing && (
                    <ActivityIndicator size="small" color={theme.primary} style={styles.loader} />
                )}
                {query.length > 0 && !analyzing && (
                    <TouchableOpacity
                        onPress={handleManualAnalyze}
                        style={styles.analyzeButton}
                        activeOpacity={0.7}
                    >
                        <GeminiIcon size={24} color={theme.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Sugerencias rápidas */}
            {query.length === 0 && (
                <View style={styles.suggestionsContainer}>
                    <Text variant="caption" color={theme.textSecondary} style={styles.suggestionsTitle}>
                        💡 Ejemplos:
                    </Text>
                    <View style={styles.suggestionsRow}>
                        {suggestions.slice(0, 2).map((suggestion, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.suggestionTag, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={() => handleSuggestionPress(suggestion.text)}
                                activeOpacity={0.7}
                            >
                                <Text variant="caption" color={theme.text}>
                                    {suggestion.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Resultado de IA */}
            {aiResult && aiResult.detected_service && (
                <View style={[styles.aiResultCard, { backgroundColor: theme.primary + '15', borderColor: theme.primary }]}>
                    <View style={styles.aiResultHeader}>
                        <GeminiIcon size={24} color={theme.primary} />
                        <Text variant="body" weight="bold" color={theme.primary}>
                            Servicio Detectado
                        </Text>
                        <View style={[styles.confidenceBadge, { backgroundColor: theme.primary }]}>
                            <Text variant="caption" color="#FFFFFF" weight="bold">
                                {Math.round(aiResult.confidence * 100)}%
                            </Text>
                        </View>
                    </View>
                    <Text variant="body" weight="bold" style={styles.serviceName}>
                        {aiResult.detected_service.service_name}
                    </Text>
                    <Text variant="caption" color={theme.textSecondary} style={styles.reasoning}>
                        {aiResult.reasoning}
                    </Text>
                    {aiResult.pre_filled_data.precio_estimado && (
                        <Text variant="caption" color={theme.primary} weight="medium" style={styles.priceEstimate}>
                            💰 Precio estimado: ${aiResult.pre_filled_data.precio_estimado.min} - ${aiResult.pre_filled_data.precio_estimado.max} MXN
                        </Text>
                    )}
                    <TouchableOpacity
                        style={[styles.viewServiceButton, { backgroundColor: theme.primary }]}
                        onPress={async () => {
                            // 🆕 TRACKING: Actualizar interacción cuando usuario navega
                            if (currentInteractionId.current && aiResult.detected_service) {
                                await MLTrackingService.updateInteractionWithResult(
                                    currentInteractionId.current,
                                    aiResult.detected_service.id,
                                    aiResult.detected_service.service_name
                                );
                            } else if (aiResult.detected_service) {
                                // Si no hay interacción previa, crear una nueva
                                await MLTrackingService.trackServiceClick(
                                    aiResult.detected_service.id,
                                    aiResult.detected_service.service_name,
                                    query
                                );
                            }
                            
                            router.push(`/service/${aiResult.detected_service.id}?aiDetected=true`);
                        }}
                        activeOpacity={0.8}
                    >
                        <Text variant="body" weight="bold" color="#FFFFFF">
                            Ver Servicio
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        minHeight: 60,
    },
    icon: {
        marginRight: 10,
        marginTop: 2,
    },
    input: {
        flex: 1,
        fontSize: 16,
        padding: 0,
        textAlignVertical: 'top',
        minHeight: 40,
    },
    loader: {
        marginLeft: 8,
        marginTop: 2,
    },
    analyzeButton: {
        marginLeft: 8,
        padding: 4,
    },
    suggestionsContainer: {
        marginTop: 12,
    },
    suggestionsTitle: {
        marginBottom: 8,
    },
    suggestionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    suggestionTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    aiResultCard: {
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    aiResultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    confidenceBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 'auto',
    },
    serviceName: {
        marginBottom: 4,
    },
    reasoning: {
        marginTop: 4,
        lineHeight: 18,
    },
    priceEstimate: {
        marginTop: 8,
    },
    viewServiceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginTop: 12,
        gap: 8,
    },
});

