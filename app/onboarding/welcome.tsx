/**
 * Pantalla 1: Welcome Inicial
 * Basada en Thumbtack, mejorada para Sumee
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SumeeLogo } from '@/components/onboarding/SumeeLogo';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ProgressDots } from '@/components/onboarding/ProgressDots';

export default function WelcomeScreen() {
    const { theme } = useTheme();
    const { user, reloadProfile } = useAuth();
    const router = useRouter();

    const markOnboardingCompleted = async () => {
        if (user?.id) {
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({ onboarding_completed: true })
                    .eq('user_id', user.id);
                
                if (error) {
                    console.error('[Onboarding] Error marking as completed:', error);
                    return false;
                }
                
                console.log('[Onboarding] ✅ Marked as completed in database');
                
                // IMPORTANTE: Recargar el perfil para que AuthContext detecte el cambio
                await reloadProfile();
                console.log('[Onboarding] ✅ Profile reloaded in AuthContext');
                
                return true;
            } catch (error) {
                console.error('[Onboarding] Error marking as completed:', error);
                return false;
            }
        }
        return false;
    };

    const handleFirstTime = () => {
        router.push('/onboarding/services');
    };

    const handleReturning = async () => {
        // Si ya ha usado Sumee, marcar onboarding como completado y ir al home
        const success = await markOnboardingCompleted();
        if (success) {
            router.replace('/(tabs)');
        }
    };

    const handleSkip = async () => {
        // Marcar onboarding como completado y ir al home
        const success = await markOnboardingCompleted();
        if (success) {
            router.replace('/(tabs)');
        }
    };

    const handleProfessionalLink = () => {
        // Link a SumeePros (puede ser una URL o deep link)
        Linking.openURL('https://sumeeapp.com/profesionales');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Skip button (discreto, top-right) */}
            <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Text style={[styles.skipText, { color: theme.textSecondary }]}>
                    Omitir
                </Text>
            </TouchableOpacity>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Logo Sumee */}
                <View style={styles.logoContainer}>
                    <SumeeLogo size="large" variant="light" showText={true} />
                </View>

                {/* Mensaje principal */}
                <Text style={[styles.heading, { color: theme.text }]}>
                    Expertos verificados{'\n'}
                    para cada proyecto{'\n'}
                    de tu hogar 🏠
                </Text>

                {/* Pregunta */}
                <Text style={[styles.question, { color: theme.textSecondary }]}>
                    ¿Es tu primera vez{'\n'}
                    usando Sumee?
                </Text>

                {/* Botones */}
                <View style={styles.buttonContainer}>
                    <OnboardingButton
                        title="¡Es mi primera vez!"
                        onPress={handleFirstTime}
                        variant="primary"
                    />

                    <View style={styles.buttonSpacing} />

                    <OnboardingButton
                        title="Ya he usado Sumee"
                        onPress={handleReturning}
                        variant="secondary"
                    />
                </View>

                {/* Link para profesionales */}
                <TouchableOpacity
                    style={styles.professionalLink}
                    onPress={handleProfessionalLink}
                >
                    <Text style={[styles.professionalLinkText, { color: theme.primary }]}>
                        ¿Eres profesional?{' '}
                        <Text style={styles.professionalLinkBold}>Ir a SumeePros</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Indicador de progreso */}
            <View style={styles.progressContainer}>
                <ProgressDots currentStep={1} totalSteps={4} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    skipButton: {
        position: 'absolute',
        top: 16,
        right: 24,
        zIndex: 10,
        padding: 8,
    },
    skipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 100,
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 48, // Espaciado generoso según UX/UI (1.5x el tamaño del logo)
        // Asegurar que el logo tenga suficiente "breathing room"
        paddingVertical: 20,
    },
    heading: {
        fontSize: 32,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 40,
    },
    question: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 26,
    },
    buttonContainer: {
        width: '100%',
        marginBottom: 24,
    },
    buttonSpacing: {
        height: 16,
    },
    professionalLink: {
        marginTop: 8,
    },
    professionalLinkText: {
        fontSize: 14,
        textAlign: 'center',
    },
    professionalLinkBold: {
        fontWeight: '600',
    },
    progressContainer: {
        paddingVertical: 24,
        paddingHorizontal: 24,
    },
});

