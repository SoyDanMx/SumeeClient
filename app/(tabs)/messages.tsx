import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { MessagesService, Conversation } from '@/services/messages';

export default function MessagesScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadConversations = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const data = await MessagesService.getConversations(user.id);
            setConversations(data);
        } catch (error) {
            console.error('[Messages] Error loading conversations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            loadConversations();
        } else {
            setLoading(false);
            setConversations([]);
        }
    }, [user, loadConversations]);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = MessagesService.subscribeToConversations(user.id, () => {
            loadConversations();
        });

        return unsubscribe;
    }, [user, loadConversations]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadConversations();
    };

    const handleConversationPress = async (conversation: Conversation) => {
        // Marcar como leído antes de navegar
        if (user && conversation.unread_count > 0) {
            await MessagesService.markAsRead(conversation.lead_id, user.id);
        }
        router.push(`/messages/${conversation.lead_id}`);
    };

    const formatTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        
        return date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="fast-response" label="Pendiente" />;
            case 'accepted':
                return <Badge variant="verified" label="Aceptado" />;
            case 'completed':
                return <Badge variant="guarantee" label="Completado" />;
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="dark" />
            
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <Text variant="h2" weight="bold" style={styles.headerTitle}>
                    Mensajes
                </Text>
                <Text variant="caption" color={theme.textSecondary}>
                    {conversations.length} conversaciones
                </Text>
            </View>

            {!user ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color={theme.textSecondary} />
                    <Text variant="h3" weight="bold" style={styles.emptyTitle}>
                        Inicia sesión
                    </Text>
                    <Text variant="body" color={theme.textSecondary} style={styles.emptyText}>
                        Así podrás chatear con los profesionales de tus solicitudes.
                    </Text>
                    <TouchableOpacity
                        style={[styles.loginCta, { backgroundColor: theme.primary }]}
                        onPress={() => router.push('/auth/login')}
                        activeOpacity={0.85}
                    >
                        <Text variant="body" weight="bold" color="#FFFFFF">
                            Ir a iniciar sesión
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text variant="body" color={theme.textSecondary} style={styles.loadingText}>
                        Cargando conversaciones...
                    </Text>
                </View>
            ) : conversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color={theme.textSecondary} />
                    <Text variant="h3" weight="bold" style={styles.emptyTitle}>
                        No hay mensajes
                    </Text>
                    <Text variant="body" color={theme.textSecondary} style={styles.emptyText}>
                        Cuando un profesional acepte tu solicitud o envíes un mensaje, el hilo aparecerá aquí.
                    </Text>
                    <TouchableOpacity
                        style={styles.secondaryCta}
                        onPress={() => router.push('/(tabs)/projects')}
                        activeOpacity={0.8}
                    >
                        <Text variant="body" weight="bold" color={theme.primary}>
                            Ver mis solicitudes
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    <View style={styles.conversationsList}>
                        {conversations.map((conversation) => (
                            <TouchableOpacity
                                key={conversation.lead_id}
                                onPress={() => handleConversationPress(conversation)}
                                activeOpacity={0.7}
                            >
                                <Card variant="elevated" style={styles.conversationCard}>
                                    <View style={styles.conversationContent}>
                                        {/* Avatar del Profesional */}
                                        <View style={styles.avatarContainer}>
                                            {conversation.professional_avatar ? (
                                                <Image
                                                    source={{ uri: conversation.professional_avatar }}
                                                    style={styles.avatarImage}
                                                />
                                            ) : (
                                                <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
                                                    <Ionicons name="person" size={24} color={theme.primary} />
                                                </View>
                                            )}
                                            {conversation.unread_count > 0 && (
                                                <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                                                    <Text variant="caption" weight="bold" color="#FFFFFF" style={styles.unreadCount}>
                                                        {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Información de la Conversación */}
                                        <View style={styles.conversationInfo}>
                                            <View style={styles.conversationHeader}>
                                                <View style={styles.conversationTitleRow}>
                                                    <Text variant="h3" weight="bold" style={styles.conversationTitle} numberOfLines={1}>
                                                        {conversation.professional_name || 'Profesional'}
                                                    </Text>
                                                    {getStatusBadge(conversation.lead_status)}
                                                </View>
                                                {conversation.last_message && (
                                                    <Text variant="caption" color={theme.textSecondary}>
                                                        {formatTime(conversation.last_message.created_at)}
                                                    </Text>
                                                )}
                                            </View>

                                            <Text variant="body" weight="medium" style={styles.leadTitle} numberOfLines={1}>
                                                {conversation.lead_title}
                                            </Text>

                                            {conversation.last_message && (
                                                <Text 
                                                    variant="body" 
                                                    color={theme.textSecondary} 
                                                    style={[
                                                        styles.lastMessage,
                                                        conversation.unread_count > 0 && { fontWeight: '600', color: theme.text }
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {conversation.last_message.content}
                                                </Text>
                                            )}
                                        </View>

                                        {/* Indicador de no leído */}
                                        {conversation.unread_count > 0 && (
                                            <View style={[styles.unreadIndicator, { backgroundColor: theme.primary }]} />
                                        )}
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
    },
    headerTitle: {
        marginBottom: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        marginTop: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        textAlign: 'center',
    },
    conversationsList: {
        padding: 20,
        paddingBottom: 100,
    },
    conversationCard: {
        marginBottom: 12,
    },
    conversationContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E5E7EB',
    },
    loginCta: {
        marginTop: 24,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 14,
    },
    secondaryCta: {
        marginTop: 20,
        paddingVertical: 12,
    },
    unreadBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    unreadCount: {
        fontSize: 10,
    },
    conversationInfo: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    conversationTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    conversationTitle: {
        flex: 1,
    },
    leadTitle: {
        marginBottom: 4,
    },
    lastMessage: {
        fontSize: 14,
    },
    unreadIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 8,
    },
});

