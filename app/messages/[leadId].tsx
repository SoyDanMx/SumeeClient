import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { MessagesService, Message } from '@/services/messages';
import { supabase } from '@/lib/supabase';

type LeadHeaderInfo = {
    servicio_solicitado?: string | null;
    servicio?: string | null;
    professional?: { full_name?: string | null; avatar_url?: string | null } | null;
};

export default function ChatScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const { leadId } = useLocalSearchParams<{ leadId: string }>();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [leadInfo, setLeadInfo] = useState<LeadHeaderInfo | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    const refreshMessages = useCallback(async () => {
        if (!leadId || !user) return;
        const data = await MessagesService.getMessages(leadId, user.id);
        setMessages(data);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
    }, [leadId, user]);

    const loadLeadInfo = useCallback(async () => {
        if (!leadId || !user) return;

        try {
            const { data: leadRow, error } = await supabase
                .from('leads')
                .select('servicio_solicitado, servicio, professional_id, profesional_asignado_id, cliente_id')
                .eq('id', leadId)
                .maybeSingle();

            if (error || !leadRow) {
                console.error('[Chat] lead load:', error);
                router.back();
                return;
            }

            if ((leadRow as any).cliente_id !== user.id) {
                router.back();
                return;
            }

            const pid =
                (leadRow as any).professional_id || (leadRow as any).profesional_asignado_id || null;
            let professional: { full_name?: string | null; avatar_url?: string | null } | null = null;
            if (pid) {
                const { data: prof } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('user_id', pid)
                    .maybeSingle();
                professional = prof;
            }

            setLeadInfo({
                servicio_solicitado: (leadRow as any).servicio_solicitado,
                servicio: (leadRow as any).servicio,
                professional,
            });
        } catch (e) {
            console.error('[Chat] loadLeadInfo:', e);
        }
    }, [leadId, user, router]);

    useEffect(() => {
        if (!leadId || !user) return;

        let cancelled = false;
        (async () => {
            setLoading(true);
            await loadLeadInfo();
            if (cancelled) return;
            await MessagesService.markAsRead(leadId, user.id);
            await refreshMessages();
            if (!cancelled) setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [leadId, user, loadLeadInfo, refreshMessages]);

    useEffect(() => {
        if (!leadId || !user) return;

        const unsubscribe = MessagesService.subscribeToMessages(leadId, async (newMessage) => {
            await refreshMessages();
            if (newMessage.sender_id !== user.id) {
                await MessagesService.markAsRead(leadId, user.id);
            }
        });

        return unsubscribe;
    }, [leadId, user, refreshMessages]);

    const handleSend = async () => {
        if (!inputText.trim() || !leadId || !user || sending) return;

        const text = inputText.trim();
        setInputText('');
        setSending(true);

        try {
            await MessagesService.sendMessage(leadId, user.id, text);
            await refreshMessages();
        } catch (error) {
            console.error('[Chat] Error sending message:', error);
            setInputText(text);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const professionalName = leadInfo?.professional?.full_name || 'Profesional';
    const leadTitle = leadInfo?.servicio_solicitado || leadInfo?.servicio || 'Servicio';
    const proAvatar = leadInfo?.professional?.avatar_url;

    if (!user) {
        return null;
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    {proAvatar ? (
                        <Image source={{ uri: proAvatar }} style={styles.headerAvatar} />
                    ) : (
                        <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder, { backgroundColor: theme.primary + '22' }]}>
                            <Ionicons name="person" size={22} color={theme.primary} />
                        </View>
                    )}
                    <View style={styles.headerInfo}>
                        <Text variant="h3" weight="bold" numberOfLines={1}>
                            {professionalName}
                        </Text>
                        <Text variant="caption" color={theme.textSecondary} numberOfLines={1}>
                            {leadTitle}
                        </Text>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : (
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messagesContainer}
                        contentContainerStyle={styles.messagesContent}
                        onContentSizeChange={() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                        }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {messages.map((message) => {
                            const isMe = message.sender_id === user.id;
                            return (
                                <View
                                    key={message.id}
                                    style={[
                                        styles.messageWrapper,
                                        isMe ? styles.messageWrapperMe : styles.messageWrapperOther,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.messageBubble,
                                            isMe
                                                ? { backgroundColor: theme.primary }
                                                : { backgroundColor: theme.surface },
                                        ]}
                                    >
                                        {!isMe && message.sender_name ? (
                                            <Text variant="caption" weight="bold" style={{ color: theme.textSecondary, marginBottom: 4 }}>
                                                {message.sender_name}
                                            </Text>
                                        ) : null}
                                        <Text
                                            variant="body"
                                            style={[
                                                styles.messageText,
                                                isMe ? { color: '#FFFFFF' } : { color: theme.text },
                                            ]}
                                        >
                                            {message.content}
                                        </Text>
                                        <Text
                                            variant="caption"
                                            style={[
                                                styles.messageTime,
                                                isMe ? { color: 'rgba(255,255,255,0.7)' } : { color: theme.textSecondary },
                                            ]}
                                        >
                                            {formatTime(message.created_at)}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                )}

                <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                    <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Escribe un mensaje al profesional…"
                            placeholderTextColor={theme.textSecondary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={1000}
                            returnKeyType="default"
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!inputText.trim() || sending}
                            style={[
                                styles.sendButton,
                                {
                                    backgroundColor: inputText.trim() && !sending ? theme.primary : theme.border,
                                },
                            ]}
                            activeOpacity={0.7}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Ionicons name="send" size={20} color={inputText.trim() ? '#FFFFFF' : theme.textSecondary} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        gap: 10,
    },
    backButton: {
        marginRight: 4,
    },
    headerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    headerAvatarPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerInfo: {
        flex: 1,
        minWidth: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 24,
    },
    messageWrapper: {
        marginBottom: 12,
    },
    messageWrapperMe: {
        alignItems: 'flex-end',
    },
    messageWrapperOther: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    messageText: {
        marginBottom: 4,
    },
    messageTime: {
        fontSize: 10,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        padding: 12,
        borderTopWidth: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderRadius: 24,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    input: {
        flex: 1,
        maxHeight: 100,
        fontSize: 16,
        paddingVertical: 4,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
});
