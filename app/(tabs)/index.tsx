import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Text } from '@/components/Text';
import { AIDiagnosticSearch } from '@/components/AIDiagnosticSearch';
import { ServiceCard } from '@/components/ServiceCard';
import { ProfessionalCard } from '@/components/ProfessionalCard';
import { CategoryService, Category } from '@/services/categories';
import { LocationService, LocationData } from '@/services/location';
import { ServicesService, ServiceItem } from '@/services/services';
import { PopularProjectCard } from '@/components/PopularProjectCard';
import { getServiceIconConfig, extractServiceDetails } from '@/utils/serviceIcons';
import { getFeaturedProfessionals, FeaturedProfessional, formatDistance } from '@/services/professionals';
import { openWhatsApp } from '@/utils/whatsapp';
import { MarketplaceBanner } from '@/components/MarketplaceBanner';
import { SupportModal } from '@/components/SupportModal';
import { TULBOX_CONFIG } from '@/constants/Config';
import { Skeleton } from '@/components/Skeleton';
import { hapticFeedback } from '@/utils/haptics';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [popularProjects, setPopularProjects] = useState<ServiceItem[]>([]);
    const [loadingPopularProjects, setLoadingPopularProjects] = useState(true);
    const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [featuredProfessionals, setFeaturedProfessionals] = useState<FeaturedProfessional[]>([]);
    const [loadingProfessionals, setLoadingProfessionals] = useState(true);

    const [showSupportModal, setShowSupportModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                loadCategories(),
                loadPopularProjects(),
                user ? loadLocation() : Promise.resolve(),
                loadFeaturedProfessionals(),
            ]);
        } catch (error) {
            console.error('[HomeScreen] Error refreshing:', error);
        } finally {
            setRefreshing(false);
        }
    }, [user, currentLocation]);

    async function loadCategories() {
        setLoadingCategories(true);
        try {
            const cats = await CategoryService.getCategories();
            setCategories(cats || []);
        } catch (error) {
            console.error('[HomeScreen] ❌ Error loading categories:', error);
            setCategories([]);
        } finally {
            setLoadingCategories(false);
        }
    }

    async function loadPopularProjects() {
        setLoadingPopularProjects(true);
        try {
            const projects = await ServicesService.getPopularProjects();
            setPopularProjects(projects || []);
        } catch (error) {
            console.error('[HomeScreen] ❌ Error loading popular projects:', error);
            setPopularProjects([]);
        } finally {
            setLoadingPopularProjects(false);
        }
    }

    async function loadLocation() {
        if (!user) {
            setLoadingLocation(false);
            return;
        }

        try {
            setLoadingLocation(true);
            const savedLocation = await LocationService.getSavedLocation(user.id);
            if (savedLocation) {
                setCurrentLocation(savedLocation);
            } else {
                const location = await LocationService.getAndSaveLocation(user.id);
                if (location) {
                    setCurrentLocation(location);
                }
            }
        } catch (error) {
            console.error('[HomeScreen] Error loading location:', error);
        } finally {
            setLoadingLocation(false);
        }
    }

    async function loadFeaturedProfessionals() {
        setLoadingProfessionals(true);
        try {
            const userLat = currentLocation?.latitude;
            const userLng = currentLocation?.longitude;
            const professionals = await getFeaturedProfessionals(userLat, userLng, 8);
            setFeaturedProfessionals(professionals || []);
        } catch (error) {
            console.error('[HomeScreen] ❌ Error loading featured professionals:', error);
            setFeaturedProfessionals([]);
        } finally {
            setLoadingProfessionals(false);
        }
    }

    useEffect(() => {
        loadCategories();
        loadPopularProjects();
    }, []);

    useEffect(() => {
        loadLocation();
    }, [user]);

    useEffect(() => {
        loadFeaturedProfessionals();
    }, [currentLocation]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="dark" />

            {/* 1. HEADER: Ubicación y Perfil */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    style={styles.locationContainer}
                    onPress={() => router.push('/location/select')}
                    activeOpacity={0.7}
                >
                    <View style={[styles.locationIcon, { backgroundColor: theme.primary + '20' }]}>
                        {loadingLocation ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                        ) : (
                            <Ionicons name="location" size={20} color={theme.primary} />
                        )}
                    </View>
                    <View style={styles.locationText}>
                        <Text variant="caption" color={theme.textSecondary}>Ubicación actual</Text>
                        {loadingLocation ? (
                            <Text variant="body" weight="bold" color={theme.textSecondary}>
                                Cargando...
                            </Text>
                        ) : (
                            <Text variant="body" weight="bold" numberOfLines={1}>
                                {currentLocation
                                    ? LocationService.formatLocationForDisplay(currentLocation)
                                    : 'Toca para seleccionar'}
                                {' ▾'}
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.notificationButton, { backgroundColor: theme.surface, marginRight: 8 }]}
                        activeOpacity={0.7}
                        onPress={() => setShowSupportModal(true)}
                    >
                        <Ionicons name="help-circle-outline" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.notificationButton, { backgroundColor: theme.surface }]}
                        activeOpacity={0.7}
                        onPress={() => {
                            // TODO: Add notification screen/modal
                            console.log('Notifications pressed');
                        }}
                    >
                        <Ionicons name="notifications-outline" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                    />
                }
            >
                {/* 2. HERO: Bienvenida y Búsqueda (Estilo Angi) */}
                <View style={styles.heroSection}>
                    <Text variant="h1" weight="bold" style={styles.heroTitle}>
                        ¿Qué necesitas arreglar hoy?
                    </Text>
                    <Text variant="body" color={theme.textSecondary} style={styles.heroSubtitle}>
                        Encuentra expertos certificados en minutos.
                    </Text>

                    {/* Buscador de diagnóstico con IA (backend Gemini; ver services/aiDiagnostic.ts) */}
                    <View style={styles.searchWrapper}>
                        <AIDiagnosticSearch />
                    </View>
                </View>

                {/* FILTROS RÁPIDOS (Chips horizontales) */}
                <View style={styles.quickFiltersSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.quickFiltersContent}
                    >
                        {TULBOX_CONFIG.QUICK_FILTERS.map((filter, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.filterChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={() => {
                                    hapticFeedback.selection();
                                    router.push({
                                        pathname: '/professionals',
                                        params: { specialty: filter.specialty }
                                    });
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name={filter.icon as any} size={16} color={theme.primary} />
                                <Text variant="caption" weight="medium" style={styles.filterChipText}>
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* 3. CATEGORÍAS PRINCIPALES (Grid) */}
                <View style={styles.categoriesSection}>
                    <View style={styles.sectionHeader}>
                        <Text variant="h3" weight="bold">Servicios</Text>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => router.push('/services')}
                        >
                            <Text variant="body" weight="600" color={theme.primary}>Ver todos</Text>
                        </TouchableOpacity>
                    </View>

                    {loadingCategories ? (
                        <View style={styles.categoriesGrid}>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <View key={i} style={styles.categoryItem}>
                                    <Skeleton width={64} height={64} borderRadius={16} />
                                    <Skeleton width={50} height={12} style={{ marginTop: 8 }} />
                                </View>
                            ))}
                        </View>
                    ) : categories.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="construct-outline" size={48} color={theme.textSecondary} />
                            <Text variant="body" color={theme.textSecondary} style={styles.emptyText}>
                                No hay servicios disponibles en este momento
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.categoriesGrid}>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={styles.categoryItem}
                                    activeOpacity={0.7}
                                    onPress={() => router.push(`/service-category/${cat.id}`)}
                                >
                                    <View
                                        style={[
                                            styles.categoryIconContainer,
                                            { backgroundColor: cat.color }
                                        ]}
                                    >
                                        {cat.image ? (
                                            <Image source={cat.image} style={styles.categoryImage} />
                                        ) : (
                                            <Ionicons name={cat.icon as any} size={28} color={cat.iconColor} />
                                        )}
                                    </View>
                                    <Text variant="caption" weight="medium" style={styles.categoryName} numberOfLines={1}>
                                        {cat.name}
                                    </Text>
                                    {cat.minPrice && (
                                        <Text variant="caption" color={theme.primary} style={styles.categoryPrice}>
                                            Desde ${cat.minPrice.toFixed(0)}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Sección: No encuentras tu servicio - Compacta */}
                    <View style={styles.customServiceSection}>
                        <TouchableOpacity
                            style={[styles.customServiceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            onPress={() => {
                                const message = 'Hola, necesito ayuda con un servicio que no esta en su plataforma.';
                                openWhatsApp(TULBOX_CONFIG.SUPPORT.WHATSAPP, message);
                            }}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="help-circle-outline" size={20} color={theme.primary} />
                            <View style={styles.customServiceTextContainer}>
                                <Text variant="body" weight="bold" style={styles.customServiceTitle}>
                                    ¿No encuentras tu servicio?
                                </Text>
                                <Text variant="caption" color={theme.textSecondary} style={styles.customServiceDescription}>
                                    Contáctanos y lo personalizamos para ti
                                </Text>
                            </View>
                            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 4. PROFESIONALES DESTACADOS (Carrusel Horizontal) */}
                <View style={styles.professionalsSection}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text variant="h3" weight="bold">Profesionales Destacados</Text>
                            {featuredProfessionals.length > 0 && (
                                <Text variant="caption" color={theme.textSecondary} style={styles.professionalsCount}>
                                    {featuredProfessionals.length} {featuredProfessionals.length === 1 ? 'profesional' : 'profesionales'} cerca de ti
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => router.push('/professionals')}
                        >
                            <Text variant="body" weight="600" color={theme.primary}>Ver todos</Text>
                        </TouchableOpacity>
                    </View>
                    {loadingProfessionals ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.professionalsScrollContent}>
                            {[1, 2, 3].map((i) => (
                                <View key={i} style={[styles.professionalCardWrapper, { backgroundColor: theme.surface, borderRadius: 16, padding: 16 }]}>
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        <Skeleton width={60} height={60} borderRadius={30} />
                                        <View style={{ flex: 1, gap: 8 }}>
                                            <Skeleton width="80%" height={16} />
                                            <Skeleton width="50%" height={12} />
                                        </View>
                                    </View>
                                    <Skeleton width="100%" height={40} borderRadius={8} style={{ marginTop: 16 }} />
                                </View>
                            ))}
                        </ScrollView>
                    ) : featuredProfessionals.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={48} color={theme.textSecondary} />
                            <Text variant="body" color={theme.textSecondary} style={styles.emptyText}>
                                No hay profesionales disponibles en este momento
                            </Text>
                        </View>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.professionalsScrollContent}
                            style={styles.professionalsScrollView}
                        >
                            {featuredProfessionals.map((professional) => {
                                const rating = professional.calificacion_promedio || 0;
                                const reviewCount = professional.review_count || 0;

                                console.log('[HomeScreen] Rendering professional:', professional.full_name, {
                                    hasPhoto: !!professional.avatar_url,
                                    hasWhatsApp: !!professional.whatsapp,
                                    areasCount: professional.areas_servicio?.length || 0,
                                    distance: professional.distance,
                                    rating: rating,
                                    reviewCount: reviewCount,
                                });

                                return (
                                    <View key={professional.user_id} style={styles.professionalCardWrapper}>
                                        <ProfessionalCard
                                            id={professional.user_id}
                                            name={professional.full_name}
                                            specialty={professional.profession || 'Profesional'}
                                            rating={rating}
                                            completedJobs={reviewCount}
                                            photo={professional.avatar_url || undefined}
                                            verified={professional.verified}
                                            distance={professional.distance}
                                            areasServicio={Array.isArray(professional.areas_servicio) ? professional.areas_servicio : []}
                                            whatsapp={professional.whatsapp || undefined}
                                            onPress={() => router.push(`/professional/${professional.user_id}`)}
                                        />
                                    </View>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>

                {/* 5. PROYECTOS POPULARES */}
                {popularProjects.length > 0 && (
                    <View style={styles.popularSection}>
                        <View style={styles.popularHeader}>
                            <Text variant="h3" weight="bold" style={styles.popularTitle}>
                                Proyectos Populares
                            </Text>
                            <Text variant="body" color={theme.textSecondary} style={styles.popularDescription}>
                                Servicios más solicitados con{' '}
                                <Text variant="body" weight="bold" color={theme.primary}>
                                    precios fijos garantizados
                                </Text>
                                . Sin sorpresas, precio claro desde el inicio.
                            </Text>
                        </View>
                        {loadingPopularProjects ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={theme.primary} />
                                <Text variant="caption" color={theme.textSecondary} style={styles.loadingText}>
                                    Cargando proyectos...
                                </Text>
                            </View>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.projectsScroll}
                                contentContainerStyle={styles.projectsScrollContent}
                            >
                                {popularProjects.map((project) => {
                                    const iconConfig = getServiceIconConfig(project.discipline);
                                    const details = extractServiceDetails(project.service_name, project.description);

                                    return (
                                        <PopularProjectCard
                                            key={project.id}
                                            id={project.id}
                                            title={project.service_name}
                                            details={details}
                                            price={ServicesService.formatPrice(project)}
                                            icon={iconConfig.icon}
                                            iconColor={iconConfig.iconColor}
                                            backgroundColor={iconConfig.backgroundColor}
                                            discipline={project.discipline}
                                            completedCount={project.completed_count || 0}
                                            onPress={() => router.push(`/service/${project.id}`)}
                                        />
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                )}

                {/* MARKETPLACE FOOTER - Al final para no distraer de los servicios */}
                <View style={styles.marketplaceFooter}>
                    <MarketplaceBanner />
                </View>

            </ScrollView>

            <SupportModal
                visible={showSupportModal}
                onClose={() => setShowSupportModal(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    locationIcon: {
        padding: 8,
        borderRadius: 20,
        marginRight: 12,
    },
    locationText: {
        flex: 1,
    },
    notificationButton: {
        padding: 8,
        borderRadius: 20,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    heroSection: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 8,
    },
    heroTitle: {
        marginBottom: 4,
    },
    heroSubtitle: {
        marginBottom: 16,
    },
    searchWrapper: {
        marginTop: 8,
    },
    quickFiltersSection: {
        marginTop: 16,
        marginBottom: 8,
    },
    quickFiltersContent: {
        paddingHorizontal: 20,
        gap: 10,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    filterChipText: {
        fontSize: 13,
    },
    categoriesSection: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryItem: {
        width: (width - 60) / 3,
        alignItems: 'center',
        marginBottom: 16,
    },
    categoryIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        overflow: 'hidden', // Importante para que la imagen respete el border radius
    },
    categoryImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    categoryName: {
        textAlign: 'center',
        marginTop: 4,
    },
    categoryPrice: {
        textAlign: 'center',
        marginTop: 2,
        fontSize: 10,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        gap: 8,
    },
    loadingText: {
        marginLeft: 4,
    },
    professionalsSection: {
        marginTop: 8,
        marginBottom: 24,
    },
    professionalsCount: {
        marginTop: 4,
        fontSize: 12,
    },
    professionalsScrollView: {
        marginTop: 12,
    },
    professionalsScrollContent: {
        paddingHorizontal: 20,
        paddingRight: 20,
    },
    professionalCardWrapper: {
        width: width * 0.85, // 85% del ancho de pantalla
        marginRight: 16,
    },
    popularSection: {
        paddingHorizontal: 20,
        marginTop: 32,
        marginBottom: 24,
    },
    popularHeader: {
        marginBottom: 20,
    },
    popularTitle: {
        marginBottom: 8,
        fontSize: 28,
    },
    popularDescription: {
        fontSize: 16,
        lineHeight: 24,
    },
    sectionTitle: {
        marginBottom: 16,
    },
    projectsScroll: {
        marginHorizontal: -20,
    },
    projectsScrollContent: {
        paddingHorizontal: 20,
        paddingRight: 20,
    },
    servicesScroll: {
        marginHorizontal: -20,
    },
    servicesScrollContent: {
        paddingHorizontal: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 12,
        textAlign: 'center',
    },
    customServiceSection: {
        paddingHorizontal: 20,
        marginTop: 16,
        marginBottom: 8,
    },
    customServiceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        gap: 12,
    },
    customServiceTextContainer: {
        flex: 1,
    },
    customServiceTitle: {
        marginBottom: 2,
        fontSize: 14,
    },
    customServiceDescription: {
        fontSize: 12,
        lineHeight: 16,
    },
    marketplaceFooter: {
        marginTop: 24,
        marginBottom: 32,
    },
});
