/**
 * Marketplace Banner Component
 * Banner promocional para el marketplace de Sumee
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { SUMEE_COLORS } from '@/constants/Colors';

const { width } = Dimensions.get('window');

interface MarketplaceBannerProps {
    onPress?: () => void;
}

export function MarketplaceBanner({ onPress }: MarketplaceBannerProps) {
    const router = useRouter();
    const { theme } = useTheme();
    
    const handlePress = () => {
        // Analytics tracking
        console.log('[MarketplaceBanner] Banner clicked');
        // trackMarketplaceEvent('marketplace_banner_clicked');
        
        if (onPress) {
            onPress();
        } else {
            router.push('/marketplace');
        }
    };
    
    return (
        <TouchableOpacity 
            activeOpacity={0.9}
            onPress={handlePress}
            style={styles.container}
        >
            <LinearGradient
                colors={[SUMEE_COLORS.PURPLE, '#E91E63']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="construct" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text variant="body" weight="bold" color="#FFFFFF" style={styles.title}>
                            🛒 Marketplace Sumee
                        </Text>
                        <Text variant="caption" color="#FFFFFF" style={styles.subtitle}>
                            Herramientas y equipos para tu próximo proyecto
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" style={styles.chevron} />
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginVertical: 8,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    gradient: {
        padding: 16,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        marginBottom: 2,
        fontSize: 16,
    },
    subtitle: {
        opacity: 0.85,
        fontSize: 12,
    },
    chevron: {
        opacity: 0.8,
    },
});

