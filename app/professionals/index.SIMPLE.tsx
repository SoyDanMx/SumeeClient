/**
 * VERSIÓN SIMPLIFICADA PARA DEBUG
 * Si esta versión funciona, el problema está en el código más complejo
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Text as ThemedText } from '@/components/Text';
import { getAllProfessionals } from '@/services/professionals';

export default function ProfessionalsScreenSimple() {
    const { theme } = useTheme();
    const router = useRouter();
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            console.log('[ProfessionalsScreenSimple] 🚀 Starting load...');
            setLoading(true);
            setError(null);

            const data = await getAllProfessionals(undefined, undefined, {}, 'hybrid', 20);
            
            console.log('[ProfessionalsScreenSimple] ✅ Loaded:', data.length);
            setProfessionals(data || []);
        } catch (err: any) {
            console.error('[ProfessionalsScreenSimple] ❌ Error:', err);
            setError(err.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header Simple */}
            <View style={[styles.header, { backgroundColor: theme.card }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <ThemedText variant="h2" weight="bold">Profesionales</ThemedText>
                <View style={{ width: 24 }} />
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <ThemedText variant="body" color={theme.textSecondary} style={{ marginTop: 12 }}>
                        Cargando...
                    </ThemedText>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Ionicons name="alert-circle" size={48} color={theme.error || '#EF4444'} />
                    <ThemedText variant="h3" weight="bold" style={{ marginTop: 16 }}>
                        Error
                    </ThemedText>
                    <ThemedText variant="body" color={theme.textSecondary} style={{ marginTop: 8, textAlign: 'center' }}>
                        {error}
                    </ThemedText>
                    <TouchableOpacity
                        onPress={loadData}
                        style={[styles.retryButton, { backgroundColor: theme.primary }]}
                    >
                        <ThemedText variant="body" weight="600" color={theme.white}>
                            Reintentar
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            ) : professionals.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="people-outline" size={48} color={theme.textSecondary} />
                    <ThemedText variant="body" color={theme.textSecondary} style={{ marginTop: 16 }}>
                        No hay profesionales disponibles
                    </ThemedText>
                </View>
            ) : (
                <View style={styles.list}>
                    <ThemedText variant="body" weight="bold" style={{ marginBottom: 16 }}>
                        {professionals.length} profesionales encontrados
                    </ThemedText>
                    {professionals.map((prof) => (
                        <TouchableOpacity
                            key={prof.user_id}
                            style={[styles.item, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={() => router.push(`/professional/${prof.user_id}`)}
                        >
                            <ThemedText variant="body" weight="bold">{prof.full_name}</ThemedText>
                            <ThemedText variant="caption" color={theme.textSecondary}>
                                {prof.profession}
                            </ThemedText>
                            {prof.distance !== undefined && (
                                <ThemedText variant="caption" color={theme.primary}>
                                    {prof.distance.toFixed(1)} km
                                </ThemedText>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        padding: 4,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    list: {
        padding: 20,
    },
    item: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 16,
    },
});

