import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { ServicesService, ServiceItem, CategoryGroup } from '@/services/services';

export default function AllServicesScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    
    const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ServiceItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'express' | 'pro' | 'fixed'>('all');

    useEffect(() => {
        loadServices();
    }, []);

    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            handleSearch();
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }
    }, [searchQuery, selectedFilter]);

    const loadServices = async () => {
        setLoading(true);
        try {
            console.log('[AllServices] Loading services...');
            const groups = await ServicesService.getAllServicesGrouped();
            console.log('[AllServices] Category groups loaded:', groups.length);
            setCategoryGroups(groups);
        } catch (error) {
            console.error('[AllServices] Error loading services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const filters: any = {};
            if (selectedFilter === 'express') {
                filters.service_type = 'express';
            } else if (selectedFilter === 'pro') {
                filters.service_type = 'pro';
            } else if (selectedFilter === 'fixed') {
                filters.price_type = 'fixed';
            }

            const results = await ServicesService.searchServices(searchQuery, filters);
            setSearchResults(results);
        } catch (error) {
            console.error('[AllServices] Error searching:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleServicePress = (service: ServiceItem) => {
        router.push(`/service/${service.id}`);
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text variant="body" color={theme.textSecondary} style={styles.loadingText}>
                        Cargando servicios...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const showSearchResults = searchQuery.trim().length > 0;
    const displayServices = showSearchResults ? searchResults : [];

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
                    Todos los Servicios
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
                <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Buscar servicios..."
                        placeholderTextColor={theme.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setSearchQuery('')}
                            style={styles.clearButton}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersContainer}
                contentContainerStyle={styles.filtersContent}
            >
                <TouchableOpacity
                    style={[
                        styles.filterChip,
                        selectedFilter === 'all' && { backgroundColor: theme.primary },
                        { borderColor: theme.border },
                    ]}
                    onPress={() => setSelectedFilter('all')}
                    activeOpacity={0.7}
                >
                    <Text
                        variant="caption"
                        weight="medium"
                        style={selectedFilter === 'all' ? { color: '#FFFFFF' } : { color: theme.text }}
                    >
                        Todos
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.filterChip,
                        selectedFilter === 'express' && { backgroundColor: theme.primary },
                        { borderColor: theme.border },
                    ]}
                    onPress={() => setSelectedFilter('express')}
                    activeOpacity={0.7}
                >
                    <Text
                        variant="caption"
                        weight="medium"
                        style={selectedFilter === 'express' ? { color: '#FFFFFF' } : { color: theme.text }}
                    >
                        Express
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.filterChip,
                        selectedFilter === 'pro' && { backgroundColor: theme.primary },
                        { borderColor: theme.border },
                    ]}
                    onPress={() => setSelectedFilter('pro')}
                    activeOpacity={0.7}
                >
                    <Text
                        variant="caption"
                        weight="medium"
                        style={selectedFilter === 'pro' ? { color: '#FFFFFF' } : { color: theme.text }}
                    >
                        Pro
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.filterChip,
                        selectedFilter === 'fixed' && { backgroundColor: theme.primary },
                        { borderColor: theme.border },
                    ]}
                    onPress={() => setSelectedFilter('fixed')}
                    activeOpacity={0.7}
                >
                    <Text
                        variant="caption"
                        weight="medium"
                        style={selectedFilter === 'fixed' ? { color: '#FFFFFF' } : { color: theme.text }}
                    >
                        Precio Fijo
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                {showSearchResults ? (
                    // Search Results
                    <View style={styles.section}>
                        <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                            Resultados de búsqueda
                        </Text>
                        {isSearching ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={theme.primary} />
                            </View>
                        ) : displayServices.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="search-outline" size={64} color={theme.textSecondary} />
                                <Text variant="body" color={theme.textSecondary} style={styles.emptyText}>
                                    No se encontraron servicios
                                </Text>
                            </View>
                        ) : (
                            displayServices.map((service) => (
                                <ServiceCard
                                    key={service.id}
                                    service={service}
                                    onPress={() => handleServicePress(service)}
                                />
                            ))
                        )}
                    </View>
                ) : (
                    <>
                        {/* Category Groups */}
                        {categoryGroups.map((group) => (
                            <View key={group.id} style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.groupHeader}>
                                        <Ionicons name={group.icon} size={24} color={theme.primary} />
                                        <Text variant="h3" weight="bold" style={styles.groupTitle}>
                                            {group.name}
                                        </Text>
                                    </View>
                                </View>
                                {group.services.map((service) => (
                                    <ServiceCard
                                        key={service.id}
                                        service={service}
                                        onPress={() => handleServicePress(service)}
                                    />
                                ))}
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// Service Card Component
function ServiceCard({ service, onPress }: { service: ServiceItem; onPress: () => void }) {
    const { theme } = useTheme();
    const price = ServicesService.formatPrice(service);

    return (
        <Card variant="elevated" style={styles.serviceCard}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                <View style={styles.serviceContent}>
                    <View style={styles.serviceInfo}>
                        <View style={styles.serviceHeader}>
                            <Text variant="h3" weight="bold" style={styles.serviceName} numberOfLines={2}>
                                {service.service_name}
                            </Text>
                            {service.is_popular && (
                                <Badge variant="popular" style={styles.popularBadge}>
                                    Popular
                                </Badge>
                            )}
                        </View>
                        {service.description && (
                            <Text variant="caption" color={theme.textSecondary} numberOfLines={2} style={styles.serviceDescription}>
                                {service.description}
                            </Text>
                        )}
                        <View style={styles.serviceFooter}>
                            <View style={styles.badgesContainer}>
                                {service.service_type === 'express' && (
                                    <Badge variant="verified" style={styles.badge}>
                                        Express
                                    </Badge>
                                )}
                                {service.price_type === 'fixed' && (
                                    <Badge variant="guarantee" style={styles.badge}>
                                        Precio Fijo
                                    </Badge>
                                )}
                                {service.badge_tags?.includes('urgencias') && (
                                    <Badge variant="popular" style={styles.badge}>
                                        Urgencias
                                    </Badge>
                                )}
                            </View>
                            <Text variant="h3" weight="bold" color={theme.primary} style={styles.servicePrice}>
                                {price}
                            </Text>
                        </View>
                        {service.completed_count && service.completed_count > 0 && (
                            <Text variant="caption" color={theme.textSecondary} style={styles.completedCount}>
                                +{service.completed_count} servicios completados
                            </Text>
                        )}
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
                </View>
            </TouchableOpacity>
        </Card>
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
        gap: 16,
    },
    loadingText: {
        marginTop: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 12,
    },
    headerTitle: {
        flex: 1,
    },
    headerSpacer: {
        width: 36,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    clearButton: {
        marginLeft: 8,
    },
    filtersContainer: {
        maxHeight: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    filtersContent: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        marginBottom: 16,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    groupTitle: {
        marginLeft: 4,
    },
    serviceCard: {
        marginBottom: 12,
    },
    serviceContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    serviceInfo: {
        flex: 1,
    },
    serviceHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        gap: 8,
    },
    serviceName: {
        flex: 1,
    },
    popularBadge: {
        marginTop: 2,
    },
    serviceDescription: {
        marginBottom: 12,
    },
    serviceFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    badgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    badge: {
        marginRight: 4,
    },
    servicePrice: {
        marginLeft: 8,
    },
    completedCount: {
        marginTop: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        textAlign: 'center',
    },
});

