import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme } from '@/contexts/ThemeContext';

type BadgeVariant = 
    | 'fixed-price' 
    | 'verified' 
    | 'guarantee' 
    | 'fast-response'
    | 'popular'
    | 'new';

interface BadgeProps {
    variant: BadgeVariant;
    children?: React.ReactNode;
    icon?: keyof typeof Ionicons.glyphMap;
}

export function Badge({ variant, children, icon }: BadgeProps) {
    const { theme } = useTheme();

    const getConfig = () => {
        switch (variant) {
            case 'fixed-price':
                return {
                    backgroundColor: theme.success + '20',
                    color: theme.success,
                    text: 'Precio Fijo',
                    defaultIcon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
                };
            case 'verified':
                return {
                    backgroundColor: theme.primary + '20',
                    color: theme.primary,
                    text: 'Verificado',
                    defaultIcon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
                };
            case 'guarantee':
                return {
                    backgroundColor: theme.info + '20',
                    color: theme.info,
                    text: 'Garantía',
                    defaultIcon: 'shield' as keyof typeof Ionicons.glyphMap,
                };
            case 'fast-response':
                return {
                    backgroundColor: theme.warning + '20',
                    color: theme.warning,
                    text: '2 horas',
                    defaultIcon: 'time' as keyof typeof Ionicons.glyphMap,
                };
            case 'popular':
                return {
                    backgroundColor: '#FEF3C7',
                    color: '#D97706',
                    text: 'Popular',
                    defaultIcon: 'star' as keyof typeof Ionicons.glyphMap,
                };
            case 'new':
                return {
                    backgroundColor: theme.primary + '20',
                    color: theme.primary,
                    text: 'Nuevo',
                    defaultIcon: 'sparkles' as keyof typeof Ionicons.glyphMap,
                };
            default:
                return {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    text: '',
                    defaultIcon: 'information-circle' as keyof typeof Ionicons.glyphMap,
                };
        }
    };

    const config = getConfig();
    const displayIcon = icon || config.defaultIcon;
    const displayText = children || config.text;

    return (
        <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
            <Ionicons name={displayIcon} size={12} color={config.color} style={styles.icon} />
            <Text 
                variant="caption" 
                weight="bold" 
                style={[styles.text, { color: config.color }]}
            >
                {displayText}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    icon: {
        marginRight: 4,
    },
    text: {
        fontSize: 10,
        lineHeight: 12,
    },
});

