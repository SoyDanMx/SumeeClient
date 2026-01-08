/**
 * Pantalla temporal para generar embeddings de servicios
 * 
 * USO:
 * 1. Navegar a /admin/generate-embeddings
 * 2. Presionar el botón "Generar Embeddings"
 * 3. Ver el progreso en tiempo real
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { GeminiIcon } from '@/components/GeminiIcon';
import { generateAllServiceEmbeddings } from '@/scripts/generate-service-embeddings';

export default function GenerateEmbeddingsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [stats, setStats] = useState<{ total: number; success: number; errors: number } | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setLogs([]);
        setStats(null);

        // Capturar console.log
        const originalLog = console.log;
        const originalError = console.error;
        
        const newLogs: string[] = [];
        
        console.log = (...args: any[]) => {
            originalLog(...args);
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');
            newLogs.push(message);
            setLogs([...newLogs]);
        };

        console.error = (...args: any[]) => {
            originalError(...args);
            const message = '❌ ' + args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');
            newLogs.push(message);
            setLogs([...newLogs]);
        };

        try {
            const stats = await generateAllServiceEmbeddings();
            
            // Usar las estadísticas retornadas directamente
            setStats({
                total: stats.total,
                success: stats.success,
                errors: stats.errors,
            });
        } catch (error: any) {
            console.error('Error fatal:', error.message || error);
            setStats({
                total: 0,
                success: 0,
                errors: 1,
            });
        } finally {
            setLoading(false);
            console.log = originalLog;
            console.error = originalError;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text variant="title" weight="bold" style={styles.title}>
                    Generar Embeddings
                </Text>
            </View>

            <View style={styles.content}>
                <Text variant="body" color={theme.textSecondary} style={styles.description}>
                    Este script generará embeddings vectoriales para todos los servicios activos en service_catalog.
                </Text>

                <TouchableOpacity
                    style={[
                        styles.button,
                        { 
                            backgroundColor: loading ? theme.border : theme.primary,
                            opacity: loading ? 0.6 : 1,
                        }
                    ]}
                    onPress={handleGenerate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <GeminiIcon size={24} color="#FFFFFF" />
                            <Text variant="body" weight="bold" color="#FFFFFF" style={styles.buttonText}>
                                Generar Embeddings
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {stats && (
                    <View style={[styles.stats, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text variant="body" weight="bold" style={styles.statsTitle}>
                            📊 Resumen
                        </Text>
                        <View style={styles.statsRow}>
                            <Text variant="body" color={theme.textSecondary}>
                                Total: {stats.total}
                            </Text>
                            <Text variant="body" color="#4CAF50" weight="bold">
                                ✅ Exitosos: {stats.success}
                            </Text>
                            <Text variant="body" color="#F44336" weight="bold">
                                ❌ Errores: {stats.errors}
                            </Text>
                        </View>
                        <Text variant="caption" color={theme.textSecondary} style={styles.statsPercent}>
                            Tasa de éxito: {((stats.success / stats.total) * 100).toFixed(2)}%
                        </Text>
                    </View>
                )}

                {logs.length > 0 && (
                    <View style={[styles.logsContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text variant="body" weight="bold" style={styles.logsTitle}>
                            📋 Logs
                        </Text>
                        <ScrollView style={styles.logs} showsVerticalScrollIndicator>
                            {logs.map((log, i) => (
                                <Text 
                                    key={i} 
                                    variant="caption" 
                                    style={[
                                        styles.log,
                                        { 
                                            color: log.includes('❌') ? '#F44336' : 
                                                   log.includes('✅') ? '#4CAF50' : 
                                                   theme.textSecondary,
                                            fontFamily: 'monospace',
                                        }
                                    ]}
                                >
                                    {log}
                                </Text>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 12,
    },
    title: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    description: {
        marginBottom: 24,
        lineHeight: 20,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
        marginBottom: 24,
    },
    buttonText: {
        marginLeft: 4,
    },
    stats: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
    },
    statsTitle: {
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statsPercent: {
        marginTop: 8,
    },
    logsContainer: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    logsTitle: {
        marginBottom: 12,
    },
    logs: {
        flex: 1,
    },
    log: {
        fontSize: 11,
        lineHeight: 16,
        marginBottom: 4,
    },
});

