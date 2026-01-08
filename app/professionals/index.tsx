import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    RefreshControl,
    FlatList,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/Text';
import { ProfessionalCard } from '@/components/ProfessionalCard';
import {
    getAllProfessionals,
    FeaturedProfessional,
    ProfessionalFilters,
    SortOption,
} from '@/services/professionals';
import { LocationService } from '@/services/location';
import { SUMEE_COLORS } from '@/constants/Colors';

export default function ProfessionalsScreen() {
    const { theme } = useTheme();
    const { profile } = useAuth();
    const router = useRouter();
    
    const [professionals, setProfessionals] = useState<FeaturedProfessional[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('hybrid');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<ProfessionalFilters>({});
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Definir funciones antes de usarlas en useEffect
    const loadUserLocation = useCallback(async () => {
        try {
            // Intentar obtener ubicación guardada del perfil
            if (profile?.ubicacion_lat && profile?.ubicacion_lng) {
                console.log('[ProfessionalsScreen] 📍 Using saved location from profile');
                setUserLocation({
                    lat: profile.ubicacion_lat,
                    lng: profile.ubicacion_lng,
                });
                return;
            }

            // Si no hay ubicación guardada, obtener ubicación actual
            console.log('[ProfessionalsScreen] 📍 Requesting current location...');
            const location = await LocationService.getCurrentLocation();
            if (location) {
                console.log('[ProfessionalsScreen] ✅ Got current location:', location);
                setUserLocation({
                    lat: location.latitude,
                    lng: location.longitude,
                });
            } else {
                console.log('[ProfessionalsScreen] ⚠️ No location available, will load without distance sorting');
            }
        } catch (error) {
            console.error('[ProfessionalsScreen] ❌ Error loading location:', error);
            // Continuar sin ubicación - los profesionales se cargarán sin ordenamiento por distancia
        }
    }, [profile]);

    const loadProfessionals = useCallback(async () => {
        try {
            setLoading(true);
            console.log('[ProfessionalsScreen] Loading professionals...', {
                sortBy,
                filters,
                userLocation,
            });

            const data = await getAllProfessionals(
                userLocation?.lat,
                userLocation?.lng,
                filters,
                sortBy,
                100 // Más resultados para la lista completa
            );

            console.log(`[ProfessionalsScreen] ✅ Loaded ${data.length} professionals`);
            setProfessionals(data || []);
        } catch (error) {
            console.error('[ProfessionalsScreen] ❌ Error loading professionals:', error);
            setProfessionals([]); // Asegurar que siempre hay un array
        } finally {
            setLoading(false);
        }
    }, [sortBy, filters, userLocation]);

    // Cargar ubicación del usuario
    useEffect(() => {
        loadUserLocation();
    }, [loadUserLocation]);

    // Cargar profesionales
    useEffect(() => {
        loadProfessionals();
    }, [loadProfessionals]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadUserLocation();
        await loadProfessionals();
        setRefreshing(false);
    }, [loadUserLocation, loadProfessionals]);

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        // Filtrar en memoria (búsqueda simple)
        // TODO: Implementar búsqueda en backend si es necesario
    };

    const filteredProfessionals = professionals.filter((prof) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            prof.full_name?.toLowerCase().includes(query) ||
            prof.profession?.toLowerCase().includes(query) ||
            prof.areas_servicio?.some(area => area.toLowerCase().includes(query))
        );
    });

    const renderProfessional = ({ item }: { item: FeaturedProfessional }) => {
        return (
            <View style={styles.professionalItem}>
                <ProfessionalCard
                    id={item.user_id}
                    name={item.full_name}
                    specialty={item.profession || 'Profesional'}
                    rating={item.calificacion_promedio || 0}
                    completedJobs={item.review_count || 0}
                    photo={item.avatar_url || undefined}
                    verified={item.verified}
                    distance={item.distance}
                    areasServicio={Array.isArray(item.areas_servicio) ? item.areas_servicio : []}
                    whatsapp={item.whatsapp || undefined}
                    onPress={() => router.push(`/professional/${item.user_id}`)}
                />
                
                {/* Badge de completitud del perfil */}
                {item.profile_completeness !== undefined && (
                    <View style={styles.completenessBadge}>
                        <View style={styles.completenessBarContainer}>
                            <View
                                style={[
                                    styles.completenessBar,
                                    {
                                        width: `${item.profile_completeness}%`,
                                        backgroundColor:
                                            item.profile_completeness >= 80
                                                ? SUMEE_COLORS.GREEN
                                                : item.profile_completeness >= 60
                                                ? SUMEE_COLORS.YELLOW
                                                : SUMEE_COLORS.RED,
                                    },
                                ]}
                            />
                        </View>
                        <Text variant="caption" style={styles.completenessText}>
                            {item.profile_completeness}% completo
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    const sortOptions: { label: string; value: SortOption }[] = [
        { label: '🎯 Recomendado', value: 'hybrid' },
        { label: '📍 Más Cercano', value: 'distance' },
        { label: '✅ Perfil Completo', value: 'completeness' },
        { label: '⭐ Mejor Calificado', value: 'rating' },
        { label: '💼 Más Experiencia', value: 'experience' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="dark" />
            
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text variant="h2" weight="bold" style={styles.headerTitle}>
                    Profesionales
                </Text>
                <TouchableOpacity
                    onPress={() => setShowFilters(!showFilters)}
                    style={styles.filterButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="filter" size={24} color={theme.primary} />
                    {(filters.profession || filters.minRating || filters.maxDistance) && (
                        <View style={[styles.filterBadge, { backgroundColor: theme.primary }]} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Buscar profesionales..."
                    placeholderTextColor={theme.textSecondary}
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                        <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Sort Options */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.sortContainer, { backgroundColor: theme.surface }]}
                contentContainerStyle={styles.sortContent}
            >
                {sortOptions.map((option) => (
                    <TouchableOpacity
                        key={option.value}
                        style={[
                            styles.sortButton,
                            sortBy === option.value && { backgroundColor: theme.primary },
                        ]}
                        onPress={() => setSortBy(option.value)}
                        activeOpacity={0.7}
                    >
                        <Text
                            variant="caption"
                            weight="medium"
                            color={sortBy === option.value ? theme.white : theme.text}
                        >
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Results Count */}
            {!loading && (
                <View style={styles.resultsContainer}>
                    <Text variant="caption" color={theme.textSecondary}>
                        {filteredProfessionals.length} {filteredProfessionals.length === 1 ? 'profesional encontrado' : 'profesionales encontrados'}
                        {userLocation && ' • Ordenado por '}
                        {userLocation && sortBy === 'hybrid' && 'recomendación (cercanía + perfil completo)'}
                        {userLocation && sortBy === 'distance' && 'cercanía'}
                        {userLocation && sortBy === 'completeness' && 'perfil completo'}
                        {userLocation && sortBy === 'rating' && 'calificación'}
                        {userLocation && sortBy === 'experience' && 'experiencia'}
                    </Text>
                </View>
            )}

            {/* Professionals List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text variant="body" color={theme.textSecondary} style={styles.loadingText}>
                        Cargando profesionales...
                    </Text>
                </View>
            ) : filteredProfessionals.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={64} color={theme.textSecondary} />
                    <Text variant="h3" weight="bold" style={styles.emptyTitle}>
                        No se encontraron profesionales
                    </Text>
                    <Text variant="body" color={theme.textSecondary} style={styles.emptyText}>
                        {searchQuery
                            ? `No hay resultados para "${searchQuery}"`
                            : 'No hay profesionales disponibles en este momento'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredProfessionals}
                    renderItem={renderProfessional}
                    keyExtractor={(item) => item.user_id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                />
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
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        marginLeft: 10,
        marginRight: 10,
    },
    filterButton: {
        padding: 4,
        position: 'relative',
    },
    filterBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    clearButton: {
        marginLeft: 10,
        padding: 4,
    },
    sortContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    sortContent: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    sortButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#F3F4F6',
    },
    resultsContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        textAlign: 'center',
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    professionalItem: {
        marginBottom: 20,
    },
    completenessBadge: {
        marginTop: 8,
        paddingHorizontal: 4,
    },
    completenessBarContainer: {
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 4,
    },
    completenessBar: {
        height: '100%',
        borderRadius: 2,
    },
    completenessText: {
        fontSize: 11,
        color: '#6B7280',
    },
});

