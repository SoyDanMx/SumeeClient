import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { CategoryService, ServiceCatalogItem } from '@/services/categories';
import { SUMEE_COLORS } from '@/constants/Colors';

export default function ServiceCategoryScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    
    const [services, setServices] = useState<ServiceCatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<any>(null);

    useEffect(() => {
        loadCategoryAndServices();
    }, [id]);

    const loadCategoryAndServices = async () => {
        if (!id) return;

        try {
            // Obtener configuración de la categoría
            const config = CategoryService.getDisciplineConfig(id);
            setCategory(config);

            // Obtener servicios de la categoría
            const servicesData = await CategoryService.getServicesByDiscipline(id);
            setServices(servicesData);
        } catch (error) {
            console.error('[ServiceCategory] Error loading:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleServicePress = (serviceId: string) => {
        router.push(`/service/${serviceId}`);
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="dark" />
            
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    {category && (
                        <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
                            <Ionicons
                                name={category.icon}
                                size={32}
                                color={category.iconColor}
                            />
                        </View>
                    )}
                    <Text variant="h2" weight="bold" style={styles.categoryName}>
                        {category?.name || id}
                    </Text>
                    <Text variant="body" color={theme.textSecondary}>
                        {services.length} servicios disponibles
                    </Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.servicesSection}>
                    {services.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="construct-outline" size={64} color={theme.textSecondary} />
                            <Text variant="body" color={theme.textSecondary} style={styles.emptyText}>
                                No hay servicios disponibles en esta categoría
                            </Text>
                        </View>
                    ) : (
                        services.map((service) => (
                            <Card
                                key={service.id}
                                variant="elevated"
                                style={styles.serviceCard}
                            >
                                <TouchableOpacity
                                    onPress={() => handleServicePress(service.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.serviceContent}>
                                        <View style={styles.serviceInfo}>
                                            <Text variant="h3" weight="bold" style={styles.serviceName}>
                                                {service.service_name}
                                            </Text>
                                            {service.description && (
                                                <Text variant="caption" color={theme.textSecondary} numberOfLines={2}>
                                                    {service.description}
                                                </Text>
                                            )}
                                            <View style={styles.serviceFooter}>
                                                <View style={styles.priceContainer}>
                                                    <Text variant="h3" weight="bold" color={theme.primary}>
                                                        Desde ${service.min_price}
                                                    </Text>
                                                    {service.price_type === 'fixed' && (
                                                        <Badge variant="fixed-price" style={styles.priceBadge}>
                                                            Precio Fijo
                                                        </Badge>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
                                    </View>
                                </TouchableOpacity>
                            </Card>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
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
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        marginBottom: 16,
    },
    headerContent: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    categoryName: {
        marginBottom: 4,
    },
    servicesSection: {
        padding: 20,
    },
    serviceCard: {
        marginBottom: 16,
    },
    serviceContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        marginBottom: 8,
    },
    serviceFooter: {
        marginTop: 12,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priceBadge: {
        marginLeft: 8,
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

