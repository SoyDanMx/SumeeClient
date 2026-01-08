import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
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
import { SUMEE_COLORS } from '@/constants/Colors';

export default function ChatScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const { leadId } = useLocalSearchParams<{ leadId: string }>();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [leadInfo, setLeadInfo] = useState<any>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (leadId && user) {
            loadMessages();
            loadLeadInfo();
            markAsRead();
        }
    }, [leadId, user]);

    // Suscribirse a nuevos mensajes
    useEffect(() => {
        if (!leadId) return;

        const unsubscribe = MessagesService.subscribeToMessages(leadId, (newMessage) => {
            setMessages((prev) => {
                // Evitar duplicados
                if (prev.some((m) => m.id === newMessage.id)) {
                    return prev;
                }
                return [...prev, newMessage];
            });
            
            // Marcar como leído si es del profesional
            if (user && newMessage.sender_id !== user.id) {
                MessagesService.markAsRead(leadId, user.id);
            }

            // Scroll al final
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });

        return unsubscribe;
    }, [leadId, user]);

    const loadMessages = async () => {
        if (!leadId || !user) return;

        try {
            setLoading(true);
            const data = await MessagesService.getMessages(leadId, user.id);
            setMessages(data);
            
            // Scroll al final
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
            }, 100);
        } catch (error) {
            console.error('[Chat] Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLeadInfo = async () => {
        if (!leadId) return;

        try {
            const { data, error } = await supabase
                .from('leads')
                .select(`
                    servicio_solicitado,
                    servicio,
                    professional_id,
                    profiles!leads_professional_id_fkey (
                        full_name,
                        avatar_url
                    )
                `)
                .eq('id', leadId)
                .single();

            if (!error && data) {
                setLeadInfo(data);
            }
        } catch (error) {
            console.error('[Chat] Error loading lead info:', error);
        }
    };

    const markAsRead = async () => {
        if (!leadId || !user) return;
        await MessagesService.markAsRead(leadId, user.id);
    };

    const handleSend = async () => {
        if (!inputText.trim() || !leadId || !user || sending) return;

        const text = inputText.trim();
        setInputText('');
        setSending(true);

        try {
            await MessagesService.sendMessage(leadId, user.id, text);
            
            // Scroll al final
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error('[Chat] Error sending message:', error);
            setInputText(text); // Restaurar texto si falla
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

    const professionalName = leadInfo?.profiles?.full_name || 'Profesional';
    const leadTitle = leadInfo?.servicio_solicitado || leadInfo?.servicio || 'Servicio';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text variant="h3" weight="bold" numberOfLines={1}>
                            {professionalName}
                        </Text>
                        <Text variant="caption" color={theme.textSecondary} numberOfLines={1}>
                            {leadTitle}
                        </Text>
                    </View>
                </View>

                {/* Mensajes */}
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
                    >
                        {messages.map((message) => {
                            const isMe = message.sender_id === user?.id;
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

                {/* Input */}
                <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                    <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Escribe un mensaje..."
                            placeholderTextColor={theme.textSecondary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={1000}
                            onSubmitEditing={handleSend}
                            returnKeyType="send"
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
        padding: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
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
        maxWidth: '75%',
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

