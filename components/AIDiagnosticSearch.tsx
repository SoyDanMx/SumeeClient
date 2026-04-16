import React, { useCallback, useState } from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Skeleton } from '@/components/Skeleton';
import { hapticFeedback } from '@/utils/haptics';
import { openWhatsApp } from '@/utils/whatsapp';
import { TULBOX_CONFIG } from '@/constants/Config';
import {
    analyzeProblemWithAI,
    AIDiagnosticResult,
    categoriaToDisciplineId,
    categoriaToDisplayLabel,
    ProfesionalCategoria,
} from '@/services/aiDiagnostic';

const PLACEHOLDER = 'Ej: Me quedé sin luz al prender el microondas';

function urgencyLabel(nivel: AIDiagnosticResult['nivel_urgencia']): string {
    if (nivel === 'critico') return 'Urgencia crítica';
    if (nivel === 'alto') return 'Urgencia alta';
    if (nivel === 'medio') return 'Urgencia media';
    return 'Urgencia baja';
}

function urgencyColors(
    nivel: AIDiagnosticResult['nivel_urgencia'],
    primary: string
): { bg: string; text: string } {
    if (nivel === 'critico') return { bg: 'rgba(127, 29, 29, 0.14)', text: '#B91C1C' };
    if (nivel === 'alto') return { bg: 'rgba(239, 68, 68, 0.12)', text: '#DC2626' };
    if (nivel === 'medio') return { bg: 'rgba(245, 158, 11, 0.15)', text: '#D97706' };
    return { bg: primary + '18', text: primary };
}

export function AIDiagnosticSearch() {
    const { theme } = useTheme();
    const router = useRouter();
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AIDiagnosticResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const runAnalysis = useCallback(async () => {
        const q = text.trim();
        setError(null);
        setResult(null);
        if (q.length < 8) {
            setError('Escribe al menos 8 caracteres para poder analizar tu situación.');
            return;
        }
        hapticFeedback.light();
        setIsLoading(true);
        try {
            const data = await analyzeProblemWithAI(q);
            setResult(data);
            hapticFeedback.success();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'No pudimos analizar tu mensaje. Intenta de nuevo.';
            setError(msg);
            hapticFeedback.medium();
        } finally {
            setIsLoading(false);
        }
    }, [text]);

    /** Flujo de colocación de pedido: catálogo por disciplina → detalle de servicio → confirmación. */
    const goToSolicitarServicio = useCallback(
        async (categoria: ProfesionalCategoria, diagnostic: AIDiagnosticResult) => {
            hapticFeedback.selection();
            if (diagnostic.cta.action === 'llamar_tecnico' || diagnostic.cta.type === 'emergencia') {
                const summary = diagnostic.diagnostico.slice(0, 180);
                const waMessage =
                    `Hola TulBox, necesito técnico ${diagnostic.cta.prioridad}. ` +
                    `Categoría sugerida: ${categoriaToDisplayLabel(categoria)}. ` +
                    `Prediagnóstico: ${summary}`;
                await openWhatsApp(TULBOX_CONFIG.SUPPORT.WHATSAPP, waMessage);
                return;
            }

            const disciplineId = categoriaToDisciplineId(categoria);
            if (disciplineId) {
                router.push(`/service-category/${disciplineId}`);
            } else {
                router.push('/services');
            }
        },
        [router]
    );

    const categoryLabel = result ? categoriaToDisplayLabel(result.categoria_profesional) : '';
    const urg = result ? urgencyColors(result.nivel_urgencia, theme.primary) : null;

    return (
        <View style={styles.wrapper}>
            <View
                style={[
                    styles.inputShell,
                    {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                    },
                ]}
            >
                <View style={styles.inputHeader}>
                    <Text style={styles.sparkle} accessibilityLabel="Asistencia con inteligencia artificial">
                        ✨
                    </Text>
                    <Text variant="caption" weight="600" color={theme.textSecondary} style={styles.aiHint}>
                        Diagnóstico con IA
                    </Text>
                </View>
                <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder={PLACEHOLDER}
                    placeholderTextColor={theme.textSecondary}
                    value={text}
                    onChangeText={(v) => {
                        setText(v);
                        setResult(null);
                        setError(null);
                    }}
                    multiline
                    textAlignVertical="top"
                    maxLength={600}
                    editable={!isLoading}
                    returnKeyType="default"
                    accessibilityLabel="Describe tu problema en lenguaje natural"
                />
                <TouchableOpacity
                    style={[
                        styles.submitBtn,
                        { backgroundColor: isLoading || !text.trim() ? theme.border : theme.primary },
                    ]}
                    onPress={runAnalysis}
                    disabled={isLoading || !text.trim()}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Analizar problema con inteligencia artificial"
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <>
                            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                            <Text variant="body" weight="bold" style={styles.submitLabel}>
                                Analizar
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {error ? (
                <Text variant="caption" style={[styles.errorText, { color: '#DC2626' }]}>
                    {error}
                </Text>
            ) : null}

            {isLoading ? (
                <View style={styles.loadingBlock} accessibilityLabel="Analizando tu problema">
                    <View style={[styles.loadingRow, { backgroundColor: theme.surface }]}>
                        <ActivityIndicator size="small" color={theme.primary} />
                        <Text variant="body" weight="600" color={theme.textSecondary} style={styles.loadingCopy}>
                            Analizando tu problema...
                        </Text>
                    </View>
                    <View style={[styles.skeletonCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Skeleton width="92%" height={14} borderRadius={6} />
                        <Skeleton width="75%" height={14} borderRadius={6} style={{ marginTop: 10 }} />
                        <Skeleton width="55%" height={12} borderRadius={6} style={{ marginTop: 16 }} />
                        <Skeleton width="100%" height={44} borderRadius={12} style={{ marginTop: 20 }} />
                    </View>
                </View>
            ) : null}

            {result && !isLoading ? (
                <View
                    style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                    accessibilityRole="summary"
                >
                    <LinearGradient
                        colors={[theme.primary + '22', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.resultGradient}
                    />
                    <View style={styles.resultHeader}>
                        <View style={[styles.iconBadge, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="medkit-outline" size={22} color={theme.primary} />
                        </View>
                        <View style={styles.resultHeaderText}>
                            <Text variant="body" weight="bold" color={theme.text}>
                                Diagnóstico
                            </Text>
                            {urg ? (
                                <View style={[styles.urgencyPill, { backgroundColor: urg.bg }]}>
                                    <Text variant="caption" weight="600" style={{ color: urg.text }}>
                                        {urgencyLabel(result.nivel_urgencia)}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    </View>

                    <Text variant="body" color={theme.text} style={styles.diagnostico}>
                        {result.diagnostico}
                    </Text>

                    {result.advertencia_seguridad ? (
                        <View
                            style={[
                                styles.warningBox,
                                {
                                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                                    borderColor: 'rgba(234, 88, 12, 0.35)',
                                },
                            ]}
                        >
                            <Ionicons name="warning-outline" size={20} color="#EA580C" style={styles.warningIcon} />
                            <Text variant="caption" style={styles.warningText}>
                                {result.advertencia_seguridad}
                            </Text>
                        </View>
                    ) : null}

                    {result.causas_probables.length > 0 ? (
                        <View style={styles.listBlock}>
                            <Text variant="caption" weight="bold" color={theme.textSecondary}>
                                Causas probables
                            </Text>
                            {result.causas_probables.map((cause, idx) => (
                                <View key={`${cause}-${idx}`} style={styles.bulletRow}>
                                    <Text variant="caption" style={styles.bulletDot}>•</Text>
                                    <Text variant="caption" color={theme.textSecondary} style={styles.bulletText}>
                                        {cause}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    <View style={styles.planBlock}>
                        <Text variant="caption" weight="bold" color={theme.textSecondary}>
                            Qué hará el técnico TulBox
                        </Text>
                        <Text variant="caption" color={theme.textSecondary} style={styles.planText}>
                            {result.que_hara_el_tecnico}
                        </Text>
                    </View>

                    <Text variant="tiny" color={theme.textSecondary} style={styles.disclaimerText}>
                        {result.disclaimer}
                    </Text>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => goToSolicitarServicio(result.categoria_profesional, result)}
                        style={styles.ctaTouchable}
                        accessibilityRole="button"
                        accessibilityLabel={
                            categoriaToDisciplineId(result.categoria_profesional)
                                ? `Solicitar un servicio de ${categoryLabel}`
                                : 'Ver catálogo de servicios para solicitar'
                        }
                    >
                        <LinearGradient
                            colors={[theme.primary, theme.primary + 'CC']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.ctaGradient}
                        >
                            <Ionicons name="clipboard-outline" size={22} color="#FFFFFF" />
                            <Text variant="body" weight="bold" style={styles.ctaText}>
                                {result.cta.label}
                            </Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
    },
    inputShell: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
            },
            android: { elevation: 2 },
        }),
    },
    inputHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    sparkle: {
        fontSize: 20,
    },
    aiHint: {
        letterSpacing: 0.3,
    },
    input: {
        minHeight: 100,
        fontSize: 17,
        lineHeight: 24,
        paddingVertical: 4,
        marginBottom: 14,
    },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
    },
    submitLabel: {
        color: '#FFFFFF',
    },
    errorText: {
        marginTop: 10,
        marginHorizontal: 4,
    },
    loadingBlock: {
        marginTop: 16,
        gap: 12,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
    },
    loadingCopy: {
        flex: 1,
    },
    skeletonCard: {
        borderRadius: 18,
        borderWidth: 1,
        padding: 18,
    },
    resultCard: {
        marginTop: 16,
        borderRadius: 20,
        borderWidth: 1,
        padding: 18,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
            },
            android: { elevation: 3 },
        }),
    },
    resultGradient: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.9,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        zIndex: 1,
    },
    iconBadge: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    resultHeaderText: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
    },
    urgencyPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    diagnostico: {
        lineHeight: 24,
        zIndex: 1,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 14,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        zIndex: 1,
    },
    warningIcon: {
        marginRight: 10,
        marginTop: 2,
    },
    warningText: {
        flex: 1,
        color: '#9A3412',
        lineHeight: 20,
    },
    listBlock: {
        marginTop: 14,
        gap: 6,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
    },
    bulletDot: {
        lineHeight: 18,
    },
    bulletText: {
        flex: 1,
        lineHeight: 18,
    },
    planBlock: {
        marginTop: 14,
        gap: 4,
    },
    planText: {
        lineHeight: 18,
    },
    disclaimerText: {
        marginTop: 12,
        lineHeight: 14,
    },
    ctaTouchable: {
        marginTop: 18,
        borderRadius: 14,
        overflow: 'hidden',
        zIndex: 1,
    },
    ctaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    ctaText: {
        color: '#FFFFFF',
    },
});
