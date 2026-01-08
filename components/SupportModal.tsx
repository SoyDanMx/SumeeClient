/**
 * Modal de Ayuda y Soporte
 * Sistema de vanguardia con categorización inteligente y mensajes pre-configurados
 */

import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { openWhatsApp } from '@/utils/whatsapp';
import { SUMEE_COLORS } from '@/constants/Colors';

interface SupportModalProps {
    visible: boolean;
    onClose: () => void;
}

type SupportCategory = 'technical' | 'dispute' | 'general' | 'other' | null;

interface SupportCategoryOption {
    id: SupportCategory;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    message: string;
}

const SUPPORT_CATEGORIES: SupportCategoryOption[] = [
    {
        id: 'technical',
        title: 'Problemas Técnicos',
        description: 'La app no funciona correctamente',
        icon: 'construct-outline',
        color: SUMEE_COLORS.ERROR,
        message: 'Hola, tengo problemas técnicos con la aplicación SumeeApp. ',
    },
    {
        id: 'dispute',
        title: 'Controversias',
        description: 'Problema con un servicio contratado',
        icon: 'alert-circle-outline',
        color: SUMEE_COLORS.WARNING,
        message: 'Hola, tengo una controversia con un servicio contratado a través de SumeeApp. ',
    },
    {
        id: 'general',
        title: 'Soporte General',
        description: 'Necesito ayuda o información',
        icon: 'help-circle-outline',
        color: SUMEE_COLORS.INFO,
        message: 'Hola, necesito soporte con SumeeApp. ',
    },
    {
        id: 'other',
        title: 'Otra Consulta',
        description: 'Escribe tu mensaje personalizado',
        icon: 'chatbubble-outline',
        color: SUMEE_COLORS.PURPLE,
        message: 'Hola, ',
    },
];

// Número de soporte de Sumee (configurable desde .env en el futuro)
const SUPPORT_PHONE = '+5215636741156';

export function SupportModal({ visible, onClose }: SupportModalProps) {
    const { theme } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState<SupportCategory>(null);
    const [customMessage, setCustomMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleCategorySelect = (category: SupportCategory) => {
        setSelectedCategory(category);
        if (category !== 'other') {
            setCustomMessage('');
        } else {
            setCustomMessage('Hola, ');
        }
    };

    const handleSend = async () => {
        if (!selectedCategory) return;

        setIsSending(true);

        try {
            let message = '';

            if (selectedCategory === 'other') {
                message = customMessage.trim() || 'Hola, necesito ayuda con SumeeApp.';
            } else {
                const category = SUPPORT_CATEGORIES.find(c => c.id === selectedCategory);
                message = category?.message || 'Hola, necesito ayuda con SumeeApp.';
                
                // Si hay mensaje personalizado adicional, agregarlo
                if (customMessage.trim()) {
                    message += customMessage.trim();
                }
            }

            // Agregar información del usuario si está disponible
            const userInfo = `\n\n[Usuario: ${new Date().toLocaleDateString('es-MX')}]`;
            message += userInfo;

            const success = await openWhatsApp(SUPPORT_PHONE, message);
            
            if (success) {
                // Cerrar modal después de enviar
                setTimeout(() => {
                    onClose();
                    setSelectedCategory(null);
                    setCustomMessage('');
                }, 500);
            }
        } catch (error) {
            console.error('[SupportModal] Error sending message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const selectedCategoryData = selectedCategory
        ? SUPPORT_CATEGORIES.find(c => c.id === selectedCategory)
        : null;

    // Debug: Verificar que el modal se renderiza
    console.log('[SupportModal] Rendering modal:', {
        visible,
        selectedCategory,
        categoriesCount: SUPPORT_CATEGORIES.length,
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={styles.keyboardView}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text variant="h2" weight="bold">
                            Ayuda y Soporte
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Categorías */}
                        {!selectedCategory && (
                            <View style={styles.categoriesContainer}>
                                <Text variant="body" color={theme.textSecondary} style={styles.subtitle}>
                                    Selecciona el tipo de ayuda que necesitas:
                                </Text>
                                {SUPPORT_CATEGORIES.map((category) => (
                                    <TouchableOpacity
                                        key={category.id}
                                        onPress={() => handleCategorySelect(category.id)}
                                        activeOpacity={0.7}
                                    >
                                        <Card
                                            variant="elevated"
                                            style={[
                                                styles.categoryCard,
                                                { backgroundColor: theme.surface },
                                            ]}
                                        >
                                            <View style={styles.categoryContent}>
                                                <View
                                                    style={[
                                                        styles.categoryIconContainer,
                                                        { backgroundColor: category.color + '20' },
                                                    ]}
                                                >
                                                    <Ionicons
                                                        name={category.icon}
                                                        size={32}
                                                        color={category.color}
                                                    />
                                                </View>
                                                <View style={styles.categoryTextContainer}>
                                                    <Text variant="body" weight="bold">
                                                        {category.title}
                                                    </Text>
                                                    <Text variant="caption" color={theme.textSecondary}>
                                                        {category.description}
                                                    </Text>
                                                </View>
                                                <Ionicons
                                                    name="chevron-forward"
                                                    size={20}
                                                    color={theme.textSecondary}
                                                />
                                            </View>
                                        </Card>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Formulario de mensaje */}
                        {selectedCategory && (
                            <View style={styles.messageContainer}>
                                <View style={styles.selectedCategoryHeader}>
                                    <TouchableOpacity
                                        onPress={() => setSelectedCategory(null)}
                                        style={styles.backButton}
                                    >
                                        <Ionicons
                                            name="arrow-back"
                                            size={24}
                                            color={theme.primary}
                                        />
                                    </TouchableOpacity>
                                    <View style={styles.selectedCategoryInfo}>
                                        <View
                                            style={[
                                                styles.selectedCategoryIcon,
                                                {
                                                    backgroundColor:
                                                        selectedCategoryData?.color + '20',
                                                },
                                            ]}
                                        >
                                            <Ionicons
                                                name={selectedCategoryData?.icon || 'help-circle'}
                                                size={24}
                                                color={selectedCategoryData?.color}
                                            />
                                        </View>
                                        <Text variant="h3" weight="bold">
                                            {selectedCategoryData?.title}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.messageField}>
                                    <Text variant="body" weight="medium" style={styles.messageLabel}>
                                        {selectedCategory === 'other'
                                            ? 'Escribe tu mensaje:'
                                            : 'Mensaje pre-configurado (puedes editarlo):'}
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.messageInput,
                                            {
                                                backgroundColor: theme.surface,
                                                color: theme.text,
                                                borderColor: theme.border,
                                            },
                                        ]}
                                        value={
                                            selectedCategory === 'other'
                                                ? customMessage
                                                : selectedCategoryData?.message + customMessage
                                        }
                                        onChangeText={(text) => {
                                            if (selectedCategory === 'other') {
                                                setCustomMessage(text);
                                            } else {
                                                // Remover el mensaje base y solo guardar el adicional
                                                const baseMessage = selectedCategoryData?.message || '';
                                                if (text.startsWith(baseMessage)) {
                                                    setCustomMessage(text.substring(baseMessage.length));
                                                } else {
                                                    setCustomMessage(text);
                                                }
                                            }
                                        }}
                                        placeholder={
                                            selectedCategory === 'other'
                                                ? 'Escribe tu mensaje aquí...'
                                                : 'Agrega más detalles aquí...'
                                        }
                                        placeholderTextColor={theme.textSecondary}
                                        multiline
                                        numberOfLines={6}
                                        textAlignVertical="top"
                                    />
                                    <Text variant="caption" color={theme.textSecondary} style={styles.helpText}>
                                        Se abrirá WhatsApp con este mensaje pre-cargado
                                    </Text>
                                </View>

                                <Button
                                    title="Abrir WhatsApp"
                                    variant="primary"
                                    onPress={handleSend}
                                    loading={isSending}
                                    style={styles.sendButton}
                                    icon={
                                        <Ionicons 
                                            name="logo-whatsapp" 
                                            size={20} 
                                            color="#FFFFFF" 
                                            style={{ marginRight: 8 }}
                                        />
                                    }
                                />
                            </View>
                        )}
                    </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        zIndex: 1000,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    keyboardView: {
        maxHeight: Dimensions.get('window').height * 0.75,
        width: '100%',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: 400,
        maxHeight: Dimensions.get('window').height * 0.75,
        paddingBottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    closeButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100, // Espacio generoso al final para que el botón sea visible al hacer scroll
        flexGrow: 1,
    },
    subtitle: {
        marginBottom: 16,
    },
    categoriesContainer: {
        gap: 12,
        paddingTop: 8,
    },
    categoryCard: {
        padding: 0,
        marginBottom: 0,
    },
    categoryContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
    },
    categoryIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryTextContainer: {
        flex: 1,
    },
    messageContainer: {
        gap: 20,
    },
    selectedCategoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    selectedCategoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    selectedCategoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageField: {
        gap: 8,
    },
    messageLabel: {
        marginBottom: 4,
    },
    messageInput: {
        minHeight: 120,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: 16,
        lineHeight: 24,
    },
    helpText: {
        marginTop: 4,
    },
    sendButton: {
        marginTop: 24,
        marginBottom: 32, // Espacio adicional al final para que sea visible
        backgroundColor: SUMEE_COLORS.GREEN,
    },
});

