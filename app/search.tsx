import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { SearchBar } from '@/components/SearchBar';
import { AISearchBar } from '@/components/AISearchBar';
import { GeminiIcon } from '@/components/GeminiIcon';
import { SearchService, SearchResult } from '@/services/search';
import { AISearchService, AISearchResult } from '@/services/aiSearch';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { query: initialQuery } = useLocalSearchParams<{ query?: string }>();
    const [searchQuery, setSearchQuery] = useState(initialQuery || '');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [popularSearches, setPopularSearches] = useState<string[]>([]);
    const [aiResult, setAiResult] = useState<AISearchResult | null>(null);
    const [useAI, setUseAI] = useState(true); // Activar IA por defecto

    useEffect(() => {
        loadPopularSearches();
        if (initialQuery) {
            performSearch(initialQuery);
        }
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim().length > 0) {
                performSearch(searchQuery);
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const loadPopularSearches = async () => {
        const popular = await SearchService.getPopularSearches();
        setPopularSearches(popular);
    };

    const performSearch = async (query: string) => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            // Usar búsqueda semántica si el query es suficientemente descriptivo
            const useSemantic = query.trim().length >= 10;
            const searchResults = await SearchService.search(query, useSemantic);
            setResults(searchResults);
        } catch (error) {
            console.error('[SearchScreen] Error searching:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResultPress = (result: SearchResult) => {
        if (result.type === 'professional') {
            router.push(`/professional/${result.id}`);
        } else {
            router.push(`/service/${result.id}`);
        }
    };

    const handlePopularSearch = (search: string) => {
        setSearchQuery(search);
        performSearch(search);
    };

    const renderResult = ({ item }: { item: SearchResult }) => (
        <TouchableOpacity
            style={[
                styles.resultItem, 
                { 
                    backgroundColor: theme.card, 
                    borderColor: item.similarity ? theme.primary : theme.border,
                    borderWidth: item.similarity ? 2 : 1,
                }
            ]}
            onPress={() => handleResultPress(item)}
            activeOpacity={0.7}
        >
            {item.image && (
                <Image source={{ uri: item.image }} style={styles.resultImage} />
            )}
            <View style={styles.resultContent}>
                <View style={styles.resultHeader}>
                    <View style={styles.titleContainer}>
                        <Text variant="body" weight="bold" numberOfLines={1}>
                            {item.title}
                        </Text>
                        {item.similarity && (
                            <View style={[styles.similarityBadge, { backgroundColor: theme.primary + '20' }]}>
                                <GeminiIcon size={16} color={theme.primary} />
                                <Text variant="caption" color={theme.primary} style={styles.similarityText}>
                                    {(item.similarity * 100).toFixed(0)}%
                                </Text>
                            </View>
                        )}
                    </View>
                    <Ionicons
                        name={item.type === 'professional' ? 'person' : 'construct'}
                        size={20}
                        color={theme.primary}
                    />
                </View>
                {item.description && (
                    <Text variant="caption" color={theme.textSecondary} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}
                <View style={styles.footerContainer}>
                    {item.rating && (
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#F59E0B" />
                            <Text variant="caption" color={theme.text} style={styles.ratingText}>
                                {item.rating.toFixed(1)}
                            </Text>
                        </View>
                    )}
                    {item.price && (
                        <View style={styles.priceContainer}>
                            <Text variant="caption" color={theme.primary} weight="bold">
                                Desde ${parseFloat(item.price).toLocaleString('es-MX')}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="dark" />
            
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.searchContainer}>
                    {useAI ? (
                        <AISearchBar
                            placeholder="Describe tu problema... Ej: 'Tengo una fuga de agua en el baño'"
                            onServiceDetected={(result) => {
                                setAiResult(result);
                                if (result.detected_service) {
                                    // Navegar directamente al servicio detectado
                                    router.push(`/service/${result.detected_service.id}?aiDetected=true&preFilled=${encodeURIComponent(JSON.stringify(result.pre_filled_data))}`);
                                }
                            }}
                            onSearch={(query) => {
                                setSearchQuery(query);
                                performSearch(query);
                            }}
                            autoAnalyze={true}
                            minLength={10}
                        />
                    ) : (
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Buscar servicios o profesionales..."
                            autoFocus
                        />
                    )}
                    <TouchableOpacity
                        onPress={() => setUseAI(!useAI)}
                        style={styles.aiToggle}
                        activeOpacity={0.7}
                    >
                        {useAI ? (
                            <GeminiIcon size={24} color={theme.primary} />
                        ) : (
                            <Ionicons
                                name="search"
                                size={20}
                                color={theme.textSecondary}
                            />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            )}

            {!loading && searchQuery.trim().length === 0 && (
                <View style={styles.emptyState}>
                    <Ionicons name="search" size={64} color={theme.textSecondary} />
                    <Text variant="h3" weight="bold" style={styles.emptyTitle}>
                        Busca servicios o profesionales
                    </Text>
                    <Text variant="body" color={theme.textSecondary} style={styles.emptySubtitle}>
                        Encuentra lo que necesitas
                    </Text>

                    {popularSearches.length > 0 && (
                        <View style={styles.popularContainer}>
                            <Text variant="label" weight="bold" style={styles.popularTitle}>
                                Búsquedas populares
                            </Text>
                            <View style={styles.popularTags}>
                                {popularSearches.map((search, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.popularTag, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                        onPress={() => handlePopularSearch(search)}
                                    >
                                        <Text variant="caption" color={theme.text}>
                                            {search}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            )}

            {!loading && results.length > 0 && (
                <FlatList
                    data={results}
                    renderItem={renderResult}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.resultsList}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {!loading && searchQuery.trim().length > 0 && results.length === 0 && (
                <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={64} color={theme.textSecondary} />
                    <Text variant="h3" weight="bold" style={styles.emptyTitle}>
                        No se encontraron resultados
                    </Text>
                    <Text variant="body" color={theme.textSecondary} style={styles.emptySubtitle}>
                        Intenta con otros términos de búsqueda
                    </Text>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    aiToggle: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultsList: {
        padding: 16,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
        gap: 12,
    },
    resultImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E5E7EB',
    },
    resultContent: {
        flex: 1,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    ratingText: {
        marginLeft: 2,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    similarityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 4,
    },
    similarityText: {
        fontSize: 10,
        fontWeight: '600',
    },
    footerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    priceContainer: {
        marginLeft: 'auto',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        textAlign: 'center',
    },
    popularContainer: {
        marginTop: 32,
        width: '100%',
    },
    popularTitle: {
        marginBottom: 12,
    },
    popularTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    popularTag: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
});

