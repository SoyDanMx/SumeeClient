import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { hapticFeedback } from '@/utils/haptics';
import { openWhatsApp } from '@/utils/whatsapp';
import { TULBOX_CONFIG } from '@/constants/Config';

interface WhatsAppSupportCardProps {
    searchQuery?: string;
}

/**
 * Card de contacto por WhatsApp para servicios no encontrados
 * Aparece al final del catálogo de servicios con mensaje contextual
 */
export function WhatsAppSupportCard({ searchQuery }: WhatsAppSupportCardProps) {
    const { theme } = useTheme();

    const handlePress = async () => {
        hapticFeedback.light();

        // Mensaje contextual inteligente
        const message = searchQuery && searchQuery.trim().length > 0
            ? `Hola TulBox, no encontré el servicio que busco: "${searchQuery}". ¿Me pueden ayudar a personalizarlo según mis necesidades?`
            : 'Hola TulBox, no encuentro el servicio exacto que necesito. ¿Me pueden ayudar a personalizarlo según mis necesidades?';

        const success = await openWhatsApp(TULBOX_CONFIG.SUPPORT.WHATSAPP, message);
        
        if (success) {
            console.log('[WhatsAppSupportCard] WhatsApp opened successfully with context:', searchQuery);
        }
    };

    return (
        <Card variant="elevated" style={styles.card}>
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.7}
                style={styles.touchable}
                accessibilityRole="button"
                accessibilityLabel="Contactar por WhatsApp para servicio personalizado"
                accessibilityHint="Abre WhatsApp para solicitar un servicio que no está en el catálogo"
            >
                <View style={styles.content}>
                    {/* Icono de WhatsApp */}
                    <View style={[styles.iconContainer, { backgroundColor: '#E8F7F0' }]}>
                        <Ionicons name="logo-whatsapp" size={32} color="#25D366" />
                    </View>

                    {/* Contenido */}
                    <View style={styles.textContainer}>
                        <Text variant="body" weight="bold" style={styles.title}>
                            ¿No encuentras tu servicio?
                        </Text>
                        <Text variant="caption" color={theme.textSecondary} style={styles.description}>
                            Déjanos un mensaje vía WhatsApp del servicio que requieres para personalizarlo a tus necesidades
                        </Text>
                        
                        {/* CTA Badge */}
                        <View style={[styles.ctaBadge, { backgroundColor: '#25D366' }]}>
                            <Ionicons name="send" size={14} color="#FFFFFF" />
                            <Text variant="caption" weight="bold" style={styles.ctaText}>
                                Enviar mensaje
                            </Text>
                        </View>
                    </View>

                    {/* Chevron */}
                    <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
                </View>
            </TouchableOpacity>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 24,
    },
    touchable: {
        width: '100%',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
        gap: 6,
    },
    title: {
        marginBottom: 2,
    },
    description: {
        lineHeight: 18,
    },
    ctaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 4,
        gap: 6,
    },
    ctaText: {
        color: '#FFFFFF',
        fontSize: 12,
    },
});
