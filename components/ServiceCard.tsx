import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text } from './Text';
import { useTheme } from '@/contexts/ThemeContext';

interface ServiceCardProps {
    id: string | number;
    title: string;
    price: string;
    image?: string;
    onPress?: () => void;
}

export function ServiceCard({ title, price, image, onPress }: ServiceCardProps) {
    const { theme } = useTheme();

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {image && (
                <Image 
                    source={{ uri: image }} 
                    style={styles.image}
                    resizeMode="cover"
                />
            )}
            <View style={styles.content}>
                <Text variant="body" weight="bold" numberOfLines={1} style={styles.title}>
                    {title}
                </Text>
                <Text variant="caption" style={{ color: theme.primary }}>
                    {price}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: 192,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        marginRight: 16,
    },
    image: {
        width: '100%',
        height: 112,
    },
    content: {
        padding: 12,
    },
    title: {
        marginBottom: 4,
    },
});

