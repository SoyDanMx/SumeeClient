import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/Text';
import { SearchBar } from '@/components/SearchBar';
import { AISearchBar } from '@/components/AISearchBar';
import { AISearchService, AISearchResult } from '@/services/aiSearch';
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

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [popularProjects, setPopularProjects] = useState<ServiceItem[]>([]);
    const [loadingPopularProjects, setLoadingPopularProjects] = useState(true);
    const [featuredProfessionals, setFeaturedProfessionals] = useState<FeaturedProfessional[]>([]);
    const [loadingProfessionals, setLoadingProfessionals] = useState(true);

    useEffect(() => {
        async function loadCategories() {
            setLoadingCategories(true);
            try {
                console.log('[HomeScreen] 🚀 Loading categories...');
                const cats = await CategoryService.getCategories();
                console.log('[HomeScreen] ✅ Categories loaded:', cats.length);
                setCategories(cats || []);
            } catch (error) {
                console.error('[HomeScreen] ❌ Error loading categories:', error);
                setCategories([]);
            } finally {
                setLoadingCategories(false);
            }
        }
        loadCategories();
    }, []);

    useEffect(() => {
        async function loadPopularProjects() {
            setLoadingPopularProjects(true);
            try {
                console.log('[HomeScreen] 🚀 Loading popular projects...');
                const projects = await ServicesService.getPopularProjects();
                console.log('[HomeScreen] ✅ Popular projects loaded:', projects.length);
                setPopularProjects(projects || []);
            } catch (error) {
                console.error('[HomeScreen] ❌ Error loading popular projects:', error);
                setPopularProjects([]);
            } finally {
                setLoadingPopularProjects(false);
            }
        }
        loadPopularProjects();
    }, []);

    useEffect(() => {
        async function loadLocation() {
            if (!user) {
                setLoadingLocation(false);
                return;
            }

            try {
                setLoadingLocation(true);
                // Intentar cargar ubicación guardada
                const savedLocation = await LocationService.getSavedLocation(user.id);
                if (savedLocation) {
                    setCurrentLocation(savedLocation);
                } else {
                    // Si no hay ubicación guardada, intentar obtenerla
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
        loadLocation();
    }, [user]);

    useEffect(() => {
        async function loadFeaturedProfessionals() {
            setLoadingProfessionals(true);
            try {
                const userLat = currentLocation?.latitude;
                const userLng = currentLocation?.longitude;
                
                console.log('[HomeScreen] 🚀 Loading featured professionals...', {
                    hasLocation: !!currentLocation,
                    lat: userLat,
                    lng: userLng,
                });
                
                const professionals = await getFeaturedProfessionals(
                    userLat,
                    userLng,
                    10 // Limitar a 10 profesionales destacados
                );
                
                console.log('[HomeScreen] ✅ Professionals loaded:', professionals.length);
                if (professionals.length > 0) {
                    console.log('[HomeScreen] First professional:', professionals[0].full_name);
                }
                
                setFeaturedProfessionals(professionals || []);
            } catch (error) {
                console.error('[HomeScreen] ❌ Error loading featured professionals:', error);
                setFeaturedProfessionals([]);
            } finally {
                setLoadingProfessionals(false);
            }
        }
        
        // Cargar profesionales incluso sin ubicación
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
                <TouchableOpacity 
                    style={[styles.notificationButton, { backgroundColor: theme.surface }]}
                    activeOpacity={0.7}
                >
                    <Ionicons name="notifications-outline" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                
                {/* 2. HERO: Bienvenida y Búsqueda (Estilo Angi) */}
                <View style={styles.heroSection}>
                    <Text variant="h1" weight="bold" style={styles.heroTitle}>
                        ¿Qué necesitas arreglar hoy?
                    </Text>
                    <Text variant="body" color={theme.textSecondary} style={styles.heroSubtitle}>
                        Encuentra expertos certificados en minutos.
                    </Text>

                    {/* Barra de Búsqueda con IA */}
                    <View style={styles.searchWrapper}>
                        <TouchableOpacity
                            onPress={() => router.push('/search')}
                            activeOpacity={0.7}
                        >
                            <AISearchBar
                                placeholder="Describe tu problema... Ej: 'Tengo una fuga de agua'"
                                onServiceDetected={(result) => {
                                    if (result.detected_service) {
                                        // Navegar al servicio detectado con datos pre-llenados
                                        router.push(`/service/${result.detected_service.id}?aiDetected=true&preFilled=${encodeURIComponent(JSON.stringify(result.pre_filled_data))}`);
                                    }
                                }}
                                autoAnalyze={false} // No analizar automáticamente en HomeScreen, solo al hacer click
                                minLength={10}
                            />
                        </TouchableOpacity>
                    </View>
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
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={theme.primary} />
                            <Text variant="caption" color={theme.textSecondary} style={styles.loadingText}>
                                Cargando servicios...
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
                                        <Ionicons name={cat.icon} size={28} color={cat.iconColor} />
                                    </View>
                                    <Text variant="caption" weight="medium" style={styles.categoryName}>
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
                                openWhatsApp('+5215636741156', message);
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
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={theme.primary} />
                            <Text variant="caption" color={theme.textSecondary} style={styles.loadingText}>
                                Cargando profesionales...
                            </Text>
                        </View>
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
                            <Text variant="h2" weight="bold" style={styles.popularTitle}>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
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
