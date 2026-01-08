import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function ProfessionalDetailScreen() {
    const { theme } = useTheme();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [professional, setProfessional] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<any[]>([]);

    useEffect(() => {
        loadProfessional();
    }, [id]);

    const loadProfessional = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', id)
                .eq('user_type', 'professional')
                .single();

            if (error) {
                console.error('[ProfessionalDetail] Error loading professional:', error);
                // Use mock data for now
                setProfessional({
                    user_id: id,
                    full_name: 'Profesional de Ejemplo',
                    specialties: 'Electricista',
                    rating: 4.8,
                    completed_jobs: 150,
                });
            } else {
                setProfessional(data);
            }

            // Load reviews
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('reviews')
                .select('*')
                .eq('professional_id', id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (!reviewsError && reviewsData) {
                setReviews(reviewsData);
            }
        } catch (error) {
            console.error('[ProfessionalDetail] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestService = () => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        router.push(`/request-service?professionalId=${id}`);
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <StatusBar style="dark" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

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
                <Text variant="h3" weight="bold" style={styles.headerTitle}>
                    Profesional
                </Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.profileSection}>
                    {professional?.avatar_url ? (
                        <Image source={{ uri: professional.avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="person" size={48} color={theme.primary} />
                        </View>
                    )}
                    
                    <Text variant="h2" weight="bold" style={styles.name}>
                        {professional?.full_name}
                    </Text>
                    
                    {professional?.specialties && (
                        <Text variant="body" color={theme.textSecondary} style={styles.specialty}>
                            {professional.specialties}
                        </Text>
                    )}

                    <View style={styles.statsContainer}>
                        {professional?.rating && (
                            <View style={styles.stat}>
                                <Ionicons name="star" size={20} color="#F59E0B" />
                                <Text variant="body" weight="bold">
                                    {professional.rating.toFixed(1)}
                                </Text>
                            </View>
                        )}
                        {professional?.completed_jobs && (
                            <View style={styles.stat}>
                                <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                                <Text variant="body" weight="bold">
                                    {professional.completed_jobs} trabajos
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {professional?.bio && (
                    <View style={[styles.section, { backgroundColor: theme.card }]}>
                        <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                            Sobre mí
                        </Text>
                        <Text variant="body" color={theme.textSecondary}>
                            {professional.bio}
                        </Text>
                    </View>
                )}

                {reviews.length > 0 && (
                    <View style={[styles.section, { backgroundColor: theme.card }]}>
                        <Text variant="h3" weight="bold" style={styles.sectionTitle}>
                            Reseñas ({reviews.length})
                        </Text>
                        {reviews.map((review) => (
                            <View key={review.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Text variant="body" weight="bold">
                                        {review.client_name || 'Cliente'}
                                    </Text>
                                    <View style={styles.ratingContainer}>
                                        <Ionicons name="star" size={14} color="#F59E0B" />
                                        <Text variant="caption" color={theme.text}>
                                            {review.rating}
                                        </Text>
                                    </View>
                                </View>
                                {review.comment && (
                                    <Text variant="caption" color={theme.textSecondary} style={styles.reviewComment}>
                                        {review.comment}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                <Button
                    title="Solicitar servicio"
                    onPress={handleRequestService}
                    style={styles.requestButton}
                />
            </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
    },
    placeholder: {
        width: 32,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    profileSection: {
        alignItems: 'center',
        padding: 24,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    name: {
        marginBottom: 4,
    },
    specialty: {
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 24,
        marginTop: 8,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    section: {
        margin: 16,
        padding: 16,
        borderRadius: 12,
    },
    sectionTitle: {
        marginBottom: 12,
    },
    reviewCard: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    reviewComment: {
        marginTop: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
    },
    requestButton: {
        width: '100%',
    },
});

