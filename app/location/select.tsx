import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LocationService, LocationData } from '@/services/location';

export default function SelectLocationScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();

    const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
    const [savedLocation, setSavedLocation] = useState<LocationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);

    useEffect(() => {
        loadSavedLocation();
    }, [user]);

    const loadSavedLocation = async () => {
        if (!user) return;

        try {
            const location = await LocationService.getSavedLocation(user.id);
            setSavedLocation(location);
        } catch (error) {
            console.error('[SelectLocation] Error loading saved location:', error);
        }
    };

    const handleGetCurrentLocation = async () => {
        if (!user) return;

        setGettingLocation(true);
        try {
            const location = await LocationService.getAndSaveLocation(user.id);
            if (location) {
                setCurrentLocation(location);
                setSavedLocation(location);
                Alert.alert(
                    'Ubicación actualizada',
                    'Tu ubicación se ha guardado correctamente.',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.back(),
                        },
                    ]
                );
            } else {
                Alert.alert(
                    'Error',
                    'No se pudo obtener tu ubicación. Verifica que tengas los permisos de ubicación activados.'
                );
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo obtener la ubicación');
        } finally {
            setGettingLocation(false);
        }
    };

    const handleUseSavedLocation = () => {
        if (savedLocation) {
            Alert.alert(
                'Ubicación guardada',
                'Esta es tu ubicación guardada. ¿Deseas actualizarla?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Actualizar',
                        onPress: handleGetCurrentLocation,
                    },
                ]
            );
        }
    };

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
                        Seleccionar Ubicación
                    </Text>
                </View>

                {/* Contenido */}
                <View style={styles.content}>
                    {/* Ubicación Actual */}
                    <Card variant="elevated" style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                                <Ionicons name="location" size={24} color={theme.primary} />
                            </View>
                            <View style={styles.cardContent}>
                                <Text variant="h3" weight="bold">
                                    Obtener Ubicación Actual
                                </Text>
                                <Text variant="body" color={theme.textSecondary}>
                                    Usa el GPS de tu dispositivo para obtener tu ubicación exacta
                                </Text>
                            </View>
                        </View>
                        <Button
                            title={gettingLocation ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
                            onPress={handleGetCurrentLocation}
                            loading={gettingLocation}
                            icon={
                                gettingLocation ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Ionicons name="navigate" size={20} color="#FFFFFF" />
                                )
                            }
                            style={styles.actionButton}
                        />
                    </Card>

                    {/* Ubicación Guardada */}
                    {savedLocation && (
                        <Card variant="elevated" style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconContainer, { backgroundColor: theme.success + '20' }]}>
                                    <Ionicons name="bookmark" size={24} color={theme.success} />
                                </View>
                                <View style={styles.cardContent}>
                                    <Text variant="h3" weight="bold">
                                        Ubicación Guardada
                                    </Text>
                                    <Text variant="body" color={theme.textSecondary} style={styles.locationText}>
                                        {LocationService.formatLocationForDisplay(savedLocation)}
                                    </Text>
                                    {savedLocation.latitude && savedLocation.longitude && (
                                        <Text variant="caption" color={theme.textSecondary} style={styles.coordsText}>
                                            {savedLocation.latitude.toFixed(6)}, {savedLocation.longitude.toFixed(6)}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <Button
                                title="Actualizar ubicación"
                                variant="outline"
                                onPress={handleGetCurrentLocation}
                                icon={<Ionicons name="refresh" size={20} color={theme.primary} />}
                                style={styles.actionButton}
                            />
                        </Card>
                    )}

                    {/* Información */}
                    <Card variant="elevated" style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
                            <View style={styles.infoContent}>
                                <Text variant="body" weight="medium">
                                    ¿Por qué necesitamos tu ubicación?
                                </Text>
                                <Text variant="caption" color={theme.textSecondary} style={styles.infoText}>
                                    Tu ubicación nos ayuda a encontrar profesionales cercanos y calcular tiempos de llegada más precisos.
                                </Text>
                            </View>
                        </View>
                    </Card>
                </View>
            </ScrollView>
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
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        marginRight: 16,
    },
    content: {
        padding: 20,
    },
    card: {
        marginBottom: 16,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
    },
    locationText: {
        marginTop: 4,
    },
    coordsText: {
        marginTop: 2,
        fontFamily: 'monospace',
    },
    actionButton: {
        marginTop: 8,
    },
    infoCard: {
        padding: 16,
        marginTop: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoText: {
        marginTop: 4,
    },
});

