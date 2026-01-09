/**
 * Welcome Screen de Vanguardia para App Cliente
 * Basado en el diseño del welcome profesional, adaptado para clientes
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SumeeLogo } from '@/components/onboarding/SumeeLogo';
import { SUMEE_COLORS } from '@/constants/Colors';
import { Text } from '@/components/Text';
import { Text as RNText } from 'react-native';

const { width, height } = Dimensions.get('window');

// Brand Colors from Sumee
const SUMEE_PURPLE = SUMEE_COLORS.PURPLE; // #820AD1
const SUMEE_PURPLE_DARK = SUMEE_COLORS.PURPLE_DARK;
const SUMEE_GRADIENT_START = SUMEE_COLORS.PURPLE;
const SUMEE_GRADIENT_END = SUMEE_COLORS.PURPLE_LIGHT;

const WELCOME_SHOWN_KEY = 'sumee_client_welcome_shown';

// Features específicas para clientes
const clientFeatures = [
    {
        icon: 'shield-checkmark' as const,
        title: 'Protección Garantizada',
        description: 'Tu dinero está protegido hasta que el trabajo esté completamente terminado y verificado',
        color: '#10B981',
    },
    {
        icon: 'flash' as const,
        title: 'Profesionales Cercanos',
        description: 'Encuentra técnicos verificados cerca de ti, disponibles en tiempo real',
        color: '#F59E0B',
    },
    {
        icon: 'checkmark-circle' as const,
        title: 'Servicios de Calidad',
        description: 'Accede a profesionales verificados con calificaciones y reseñas reales',
        color: '#3B82F6',
    },
];

export default function WelcomeScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { user, reloadProfile } = useAuth();
    
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(40)).current;
    const logoScaleAnim = useRef(new Animated.Value(0.7)).current;
    const buttonScaleAnim = useRef(new Animated.Value(0.9)).current;
    
    // Feature animations
    const featureAnimations = useRef(
        clientFeatures.map(() => new Animated.Value(0))
    ).current;

    useEffect(() => {
        // Main entrance animation sequence
        Animated.sequence([
            // Logo entrance with scale
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(logoScaleAnim, {
                    toValue: 1,
                    tension: 40,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]),
            // Content slide up
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            // Features staggered animation
            Animated.stagger(
                120,
                featureAnimations.map(anim =>
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    })
                )
            ),
            // Button scale animation
            Animated.spring(buttonScaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const markOnboardingCompleted = async () => {
        if (user?.id) {
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({ onboarding_completed: true })
                    .eq('user_id', user.id);
                
                if (error) {
                    console.error('[Welcome] Error marking as completed:', error);
                    return false;
                }
                
                console.log('[Welcome] ✅ Marked as completed in database');
                
                // IMPORTANTE: Recargar el perfil para que AuthContext detecte el cambio
                await reloadProfile();
                console.log('[Welcome] ✅ Profile reloaded in AuthContext');
                
                return true;
            } catch (error) {
                console.error('[Welcome] Error marking as completed:', error);
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
        // Link a SumeePros
        Linking.openURL('https://sumeeapp.com/profesionales');
    };

    const handleContinue = async () => {
        // Si el usuario está autenticado, ir directamente al home
        if (user) {
            const success = await markOnboardingCompleted();
            if (success) {
                router.replace('/(tabs)');
            } else {
                router.push('/onboarding/services');
            }
        } else {
            // Si no está autenticado, ir a onboarding
            router.push('/onboarding/services');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Gradient Background */}
            <LinearGradient
                colors={[SUMEE_GRADIENT_START, SUMEE_GRADIENT_END]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Decorative Elements */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativeCircle3} />

            {/* Skip button (discreto, top-right) */}
            <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <RNText style={styles.skipText}>
                    Omitir
                </RNText>
            </TouchableOpacity>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <View style={styles.content}>
                    {/* Logo Section */}
                    <Animated.View
                        style={[
                            styles.logoSection,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: logoScaleAnim }],
                            },
                        ]}
                    >
                        <View style={styles.logoWrapper}>
                            <SumeeLogo size="large" variant="white" showText={true} />
                        </View>
                    </Animated.View>

                    {/* Welcome Text */}
                    <Animated.View
                        style={[
                            styles.textSection,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideUpAnim }],
                            },
                        ]}
                    >
                        <Text variant="h1" weight="bold" style={styles.welcomeTitle}>
                            Bienvenido a Sumee
                        </Text>
                        <Text variant="body" style={styles.welcomeSubtitle}>
                            Encuentra profesionales verificados para cada proyecto de tu hogar
                        </Text>
                    </Animated.View>

                    {/* Features Grid */}
                    <View style={styles.featuresContainer}>
                        {clientFeatures.map((feature, index) => {
                            return (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.featureCard,
                                        {
                                            opacity: featureAnimations[index],
                                            transform: [
                                                {
                                                    translateY: featureAnimations[index].interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [30, 0],
                                                    }),
                                                },
                                            ],
                                        },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.featureIconContainer,
                                            { backgroundColor: `${feature.color}20` },
                                        ]}
                                    >
                                        <Ionicons name={feature.icon} size={28} color={feature.color} />
                                    </View>
                                    <Text variant="h3" weight="bold" style={styles.featureTitle}>
                                        {feature.title}
                                    </Text>
                                    <Text variant="body" style={styles.featureDescription}>
                                        {feature.description}
                                    </Text>
                                </Animated.View>
                            );
                        })}
                    </View>

                    {/* CTA Buttons */}
                    <Animated.View
                        style={[
                            styles.buttonContainer,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    { translateY: slideUpAnim },
                                    { scale: buttonScaleAnim },
                                ],
                            },
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.ctaButton}
                            onPress={handleContinue}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#FFFFFF', '#F8FAFC']}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.buttonContent}>
                                    <Ionicons name="home" size={24} color={SUMEE_PURPLE} />
                                    <RNText style={styles.ctaButtonText}>
                                        Comenzar
                                    </RNText>
                                    <Ionicons name="chevron-forward" size={20} color={SUMEE_PURPLE} />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Botones adicionales para primera vez / ya usado */}
                        <View style={styles.additionalButtons}>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleFirstTime}
                                activeOpacity={0.8}
                            >
                                <RNText style={styles.secondaryButtonText}>
                                    ¡Es mi primera vez!
                                </RNText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleReturning}
                                activeOpacity={0.8}
                            >
                                <RNText style={styles.secondaryButtonText}>
                                    Ya he usado Sumee
                                </RNText>
                            </TouchableOpacity>
                        </View>
                        
                        <RNText style={styles.helperText}>
                            Al continuar, aceptas nuestros términos y condiciones
                        </RNText>

                        {/* Link para profesionales */}
                        <TouchableOpacity
                            style={styles.professionalLink}
                            onPress={handleProfessionalLink}
                        >
                            <RNText style={styles.professionalLinkText}>
                                ¿Eres profesional?{' '}
                                <RNText style={styles.professionalLinkBold}>Ir a SumeePros</RNText>
                            </RNText>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <RNText style={styles.footerText}>
                    Potenciado por <RNText style={styles.footerBold}>Sumee</RNText> - Tu hogar en buenas manos
                </RNText>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: SUMEE_PURPLE,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 120,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        justifyContent: 'flex-start',
        minHeight: height - 120,
    },
    decorativeCircle1: {
        position: 'absolute',
        width: width * 1.5,
        height: width * 1.5,
        borderRadius: width * 0.75,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        top: -width * 0.4,
        right: -width * 0.3,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: width * 1.0,
        height: width * 1.0,
        borderRadius: width * 0.5,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        bottom: height * 0.15,
        left: -width * 0.25,
    },
    decorativeCircle3: {
        position: 'absolute',
        width: width * 0.7,
        height: width * 0.7,
        borderRadius: width * 0.35,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        top: height * 0.25,
        left: -width * 0.2,
    },
    skipButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 40,
        right: 24,
        zIndex: 10,
        padding: 8,
    },
    skipText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 14,
        fontWeight: '500',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 18, // Optimizado según UX/UI: 18px para proximidad óptima (Material Design: 16-24px)
        marginTop: height * 0.06,
    },
    logoWrapper: {
        // Contenedor sin fondo para que el logo se vea directamente sobre el gradiente púrpura
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 0, // Eliminado para acercar al texto
    },
    textSection: {
        alignItems: 'center',
        marginBottom: 48,
        marginTop: 0, // Sin margen superior para acercar al logo
        paddingHorizontal: 8,
    },
    welcomeTitle: {
        fontSize: Platform.OS === 'web' ? 38 : 34,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: -1,
        lineHeight: Platform.OS === 'web' ? 46 : 42,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    welcomeSubtitle: {
        fontSize: 17,
        color: 'rgba(255, 255, 255, 0.95)',
        textAlign: 'center',
        lineHeight: 26,
        paddingHorizontal: 12,
        fontWeight: '500',
    },
    featuresContainer: {
        width: '100%',
        marginBottom: 48,
        paddingHorizontal: 4,
    },
    featureCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
    },
    featureIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    featureTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    featureDescription: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.85)',
        lineHeight: 22,
        fontWeight: '400',
    },
    buttonContainer: {
        width: '100%',
        paddingHorizontal: 4,
        marginTop: 8,
    },
    ctaButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 16,
    },
    buttonGradient: {
        paddingVertical: 18,
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    ctaButtonText: {
        color: SUMEE_PURPLE,
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    additionalButtons: {
        width: '100%',
        gap: 12,
        marginBottom: 16,
    },
    secondaryButton: {
        width: '100%',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    helperText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.75)',
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    professionalLink: {
        marginTop: 8,
        paddingVertical: 8,
    },
    professionalLinkText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
    },
    professionalLinkBold: {
        fontWeight: '700',
        color: '#FFFFFF',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
        paddingTop: 20,
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.15)',
    },
    footerText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.75)',
        fontWeight: '500',
    },
    footerBold: {
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
