/**
 * Onboarding inmersivo (FlatList horizontal) + login integrado estilo bottom sheet.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    FlatList,
    NativeSyntheticEvent,
    NativeScrollEvent,
    TextInput,
    TouchableOpacity,
    Linking,
    Platform,
    StatusBar,
    KeyboardAvoidingView,
    ScrollView,
    ActivityIndicator,
    Alert,
    Text as RNText,
    ImageBackground,
    type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ExpoLinking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Text } from '@/components/Text';
import {
    mapAuthMessage,
    signInWithGoogle,
    signInWithApple,
} from '@/lib/auth/oauthProviders';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Debe coincidir con AuthContext.checkWelcomeStatus */
const WELCOME_SHOWN_KEY = 'sumee_client_welcome_shown';

const TULBOX_PURPLE = '#820AD1';
const TULBOX_PURPLE_DARK = '#5B0A9E';

type Phase = 'slides' | 'auth' | 'finish';

/** Ilustraciones 9:16 (IA) — electricidad, plomería, CCTV, WiFi, cargadores, solares, construcción */
const ONBOARDING_SLIDE_1 = require('../../assets/onboarding/slide1.png');
const ONBOARDING_SLIDE_2 = require('../../assets/onboarding/slide2.png');

type Slide = {
    id: string;
    title: string;
    subtitle: string;
    image: ImageSourcePropType;
};

const SLIDES: Slide[] = [
    {
        id: '1',
        title: 'Tu hogar, sin dolores de cabeza',
        subtitle:
            'Profesionales verificados al instante —para tu hogar, oficina o negocio.',
        image: ONBOARDING_SLIDE_1,
    },
    {
        id: '2',
        title: 'Soluciones a un toque',
        subtitle:
            'Electricidad, plomería, CCTV, WiFi, movilidad eléctrica, solar y construcción —y más servicios para cada espacio.',
        image: ONBOARDING_SLIDE_2,
    },
];

function SlidePage({ item }: { item: Slide }) {
    return (
        <View style={slideStyles.page}>
            <ImageBackground source={item.image} style={slideStyles.imageBg} resizeMode="cover">
                <LinearGradient
                    colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.78)']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
                <View style={slideStyles.textBlock}>
                    <RNText style={slideStyles.heroTitle}>{item.title}</RNText>
                    <RNText style={slideStyles.heroSubtitle}>{item.subtitle}</RNText>
                </View>
            </ImageBackground>
        </View>
    );
}

const slideStyles = StyleSheet.create({
    page: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    imageBg: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    textBlock: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingBottom: 140,
    },
    heroTitle: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 42,
        letterSpacing: -0.5,
        marginBottom: 16,
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    heroSubtitle: {
        fontSize: 18,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.92)',
        lineHeight: 26,
        textShadowColor: 'rgba(0,0,0,0.25)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
});

export default function WelcomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, reloadProfile, setHasSeenWelcome, isLoading: authLoading, signInWithEmail } = useAuth();
    const listRef = useRef<FlatList<Slide>>(null);

    const [phase, setPhase] = useState<Phase>('slides');

    useEffect(() => {
        if (!authLoading && user?.id) {
            setPhase('finish');
        }
    }, [authLoading, user?.id]);
    const [slideIndex, setSlideIndex] = useState(0);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

    const showApple = Platform.OS === 'ios';
    const formBusy = isLoading || socialLoading !== null;

    const persistWelcomeShown = async () => {
        try {
            if (Platform.OS === 'web') {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
                }
            } else {
                await SecureStore.setItemAsync(WELCOME_SHOWN_KEY, 'true');
            }
            setHasSeenWelcome(true);
        } catch (e) {
            console.error('[Welcome] persist:', e);
            setHasSeenWelcome(true);
        }
    };

    const markOnboardingCompleted = async () => {
        if (!user?.id) return false;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('user_id', user.id);
            if (error) {
                console.error('[Welcome]', error);
                return false;
            }
            await reloadProfile();
            return true;
        } catch {
            return false;
        }
    };

    const goToAuthPhase = async () => {
        await persistWelcomeShown();
        setPhase('auth');
    };

    const onScrollMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const x = e.nativeEvent.contentOffset.x;
        const idx = Math.round(x / SCREEN_WIDTH);
        setSlideIndex(Math.min(Math.max(idx, 0), SLIDES.length - 1));
    }, []);

    const handleContinueSlides = async () => {
        if (user?.id) {
            const ok = await markOnboardingCompleted();
            if (ok) router.replace('/(tabs)');
            return;
        }
        if (slideIndex < SLIDES.length - 1) {
            listRef.current?.scrollToIndex({ index: slideIndex + 1, animated: true });
            return;
        }
        await goToAuthPhase();
    };

    const handleSkip = async () => {
        if (user?.id) {
            const ok = await markOnboardingCompleted();
            if (ok) router.replace('/(tabs)');
        } else {
            await persistWelcomeShown();
            router.replace('/auth/login');
        }
    };

    const handleLogin = async () => {
        if (formBusy) return;
        setFormError(null);
        if (!email.trim() || !password) {
            setFormError('Completa correo y contraseña.');
            return;
        }
        setIsLoading(true);
        try {
            const { error } = await signInWithEmail(email.trim(), password);
            if (error) setFormError(mapAuthMessage(error.message));
        } catch (err: any) {
            setFormError(mapAuthMessage(err?.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        setFormError(null);
        const e = email.trim();
        if (!e) {
            setFormError('Escribe tu correo y vuelve a tocar «Olvidaste tu contraseña».');
            return;
        }
        try {
            const redirectTo = ExpoLinking.createURL('auth/callback');
            const { error } = await supabase.auth.resetPasswordForEmail(e, { redirectTo });
            if (error) {
                setFormError(mapAuthMessage(error.message));
                return;
            }
            Alert.alert('Revisa tu correo', 'Si hay una cuenta asociada, recibirás un enlace para restablecer la contraseña.');
        } catch (err: any) {
            setFormError(mapAuthMessage(err?.message));
        }
    };

    const handleGoogle = async () => {
        if (formBusy) return;
        setFormError(null);
        setSocialLoading('google');
        try {
            const { error } = await signInWithGoogle();
            if (error) setFormError(error.message);
        } finally {
            setSocialLoading(null);
        }
    };

    const handleApple = async () => {
        if (formBusy) return;
        setFormError(null);
        setSocialLoading('apple');
        try {
            const { error } = await signInWithApple();
            if (error) setFormError(error.message);
        } finally {
            setSocialLoading(null);
        }
    };

    const handleFinishOnboarding = async () => {
        const ok = await markOnboardingCompleted();
        if (ok) router.replace('/(tabs)');
    };

    const openProLink = () => Linking.openURL('https://tulbox.pro/en/profesionales');

    if (phase === 'finish' && user?.id) {
        return (
            <SafeAreaView style={finishStyles.root} edges={['top', 'bottom']}>
                <StatusBar barStyle="light-content" />
                <LinearGradient
                    colors={[TULBOX_PURPLE_DARK, TULBOX_PURPLE, '#A855F7']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                <View style={finishStyles.inner}>
                    <RNText style={finishStyles.title}>¡Casi listo!</RNText>
                    <RNText style={finishStyles.sub}>Toca continuar para empezar a usar TulBox.</RNText>
                    <TouchableOpacity style={finishStyles.btn} onPress={handleFinishOnboarding} activeOpacity={0.9}>
                        <RNText style={finishStyles.btnText}>Comenzar</RNText>
                        <Ionicons name="arrow-forward" size={22} color={TULBOX_PURPLE} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (phase === 'auth') {
        return (
            <SafeAreaView style={authStyles.safe} edges={['top']}>
                <StatusBar barStyle="light-content" />
                <KeyboardAvoidingView
                    style={authStyles.flex}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <View style={authStyles.hero}>
                        <ImageBackground
                            source={ONBOARDING_SLIDE_2}
                            style={StyleSheet.absoluteFillObject}
                            resizeMode="cover"
                        >
                            <LinearGradient
                                colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)']}
                                style={StyleSheet.absoluteFillObject}
                            />
                            <View style={[authStyles.heroContent, { paddingTop: insets.top + 8 }]}>
                                <TouchableOpacity style={authStyles.backLink} onPress={() => setPhase('slides')} hitSlop={12}>
                                    <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
                                    <RNText style={authStyles.backText}>Volver</RNText>
                                </TouchableOpacity>
                                <View style={authStyles.heroTextWrap}>
                                    <RNText style={authStyles.heroMiniTitle}>TulBox</RNText>
                                    <RNText style={authStyles.heroTagline}>
                                        Un solo lugar para contratar —y más servicios para tu hogar, oficina o negocio.
                                    </RNText>
                                </View>
                            </View>
                        </ImageBackground>
                    </View>

                    <View style={authStyles.sheet}>
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={authStyles.sheetScroll}
                        >
                            <View style={authStyles.grabber} />

                            <Text variant="h2" weight="bold" style={authStyles.sheetTitle}>
                                Bienvenido a <Text variant="h2" weight="bold" color={TULBOX_PURPLE}>TulBox</Text>
                            </Text>
                            <Text variant="body" color="#6B7280" style={authStyles.sheetSub}>
                                Inicia sesión para continuar
                            </Text>

                            <View style={authStyles.field}>
                                <Text variant="label" weight="medium" style={authStyles.label}>
                                    Email
                                </Text>
                                <TextInput
                                    style={authStyles.input}
                                    placeholder="tu@email.com"
                                    placeholderTextColor="#9CA3AF"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="email"
                                    editable={!formBusy}
                                />
                            </View>

                            <View style={authStyles.field}>
                                <Text variant="label" weight="medium" style={authStyles.label}>
                                    Contraseña
                                </Text>
                                <TextInput
                                    style={authStyles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoComplete="password"
                                    editable={!formBusy}
                                />
                            </View>

                            {formError ? (
                                <Text variant="caption" style={authStyles.fieldError}>
                                    {formError}
                                </Text>
                            ) : null}

                            <TouchableOpacity style={authStyles.forgotWrap} onPress={handleForgotPassword} disabled={formBusy}>
                                <Text variant="caption" weight="bold" color={TULBOX_PURPLE}>
                                    ¿Olvidaste tu contraseña?
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleLogin}
                                disabled={formBusy}
                                activeOpacity={0.9}
                                style={authStyles.primaryTouchable}
                            >
                                <LinearGradient
                                    colors={[TULBOX_PURPLE_DARK, TULBOX_PURPLE]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={authStyles.primaryBtn}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <RNText style={authStyles.primaryBtnText}>Continuar</RNText>
                                            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={authStyles.divider}>
                                <View style={authStyles.dividerLine} />
                                <Text variant="caption" color="#9CA3AF" style={authStyles.dividerMid}>
                                    o
                                </Text>
                                <View style={authStyles.dividerLine} />
                            </View>

                            {showApple && (
                                <TouchableOpacity
                                    style={[authStyles.socialBtn, formBusy && authStyles.socialDisabled]}
                                    onPress={handleApple}
                                    disabled={formBusy}
                                >
                                    {socialLoading === 'apple' ? (
                                        <ActivityIndicator color="#111827" />
                                    ) : (
                                        <>
                                            <Ionicons name="logo-apple" size={22} color="#000000" />
                                            <RNText style={authStyles.socialText}>Ingresar con Apple</RNText>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[authStyles.socialBtn, formBusy && authStyles.socialDisabled]}
                                onPress={handleGoogle}
                                disabled={formBusy}
                            >
                                {socialLoading === 'google' ? (
                                    <ActivityIndicator color="#111827" />
                                ) : (
                                    <>
                                        <Ionicons name="logo-google" size={22} color="#EA4335" />
                                        <RNText style={authStyles.socialText}>Ingresar con Google</RNText>
                                    </>
                                )}
                            </TouchableOpacity>

                            <View style={authStyles.footerRow}>
                                <Text variant="body" color="#6B7280">
                                    ¿No tienes cuenta?{' '}
                                </Text>
                                <TouchableOpacity onPress={() => router.push('/auth/register')} disabled={formBusy}>
                                    <Text variant="body" weight="bold" color={TULBOX_PURPLE}>
                                        Regístrate
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={authStyles.proLink} onPress={openProLink}>
                                <Text variant="caption" color="#9CA3AF">
                                    ¿Eres profesional? <Text variant="caption" weight="bold" color="#6B7280">TulBoxPros</Text>
                                </Text>
                            </TouchableOpacity>

                            <View style={authStyles.legalRow}>
                                <TouchableOpacity onPress={() => Linking.openURL('https://tulbox.pro/en/privacidad')}>
                                    <Text variant="caption" color="#9CA3AF">
                                        Privacidad
                                    </Text>
                                </TouchableOpacity>
                                <Text variant="caption" color="#9CA3AF">
                                    {' '}
                                    •{' '}
                                </Text>
                                <TouchableOpacity onPress={() => Linking.openURL('https://tulbox.pro/en/terminos')}>
                                    <Text variant="caption" color="#9CA3AF">
                                        Términos
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.slidesRoot}>
            <StatusBar barStyle="light-content" />
            <FlatList
                ref={listRef}
                data={SLIDES}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => <SlidePage item={item} />}
                onMomentumScrollEnd={onScrollMomentumEnd}
                getItemLayout={(_, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                })}
                initialNumToRender={2}
                windowSize={3}
                onScrollToIndexFailed={({ index }) => {
                    setTimeout(() => {
                        listRef.current?.scrollToIndex({ index, animated: true });
                    }, 350);
                }}
            />

            <TouchableOpacity style={[styles.skipFab, { top: insets.top + 8 }]} onPress={handleSkip} hitSlop={12}>
                <RNText style={styles.skipFabText}>Omitir</RNText>
            </TouchableOpacity>

            <View style={[styles.dots, { bottom: insets.bottom + 100 }]}>
                {SLIDES.map((_, i) => (
                    <View key={i} style={[styles.dot, i === slideIndex && styles.dotActive]} />
                ))}
            </View>

            <View style={[styles.continueBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
                <TouchableOpacity style={styles.continueBtn} onPress={handleContinueSlides} activeOpacity={0.92}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.95)', 'rgba(248,250,252,0.98)']}
                        style={styles.continueGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <RNText style={styles.continueText}>Continuar</RNText>
                        <Ionicons name="arrow-forward" size={20} color={TULBOX_PURPLE} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const HERO_HEIGHT = SCREEN_HEIGHT * 0.4;

const authStyles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    flex: {
        flex: 1,
    },
    hero: {
        height: HERO_HEIGHT,
        width: '100%',
    },
    heroContent: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        paddingBottom: 16,
    },
    backLink: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
    },
    backText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    heroTextWrap: {
        paddingBottom: 8,
    },
    heroMiniTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    heroTagline: {
        marginTop: 8,
        fontSize: 15,
        color: 'rgba(255,255,255,0.88)',
        fontWeight: '500',
        maxWidth: 320,
        lineHeight: 23,
    },
    sheet: {
        flex: 1,
        marginTop: -24,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 12,
        overflow: 'hidden',
    },
    sheetScroll: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 32,
    },
    grabber: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
        marginBottom: 20,
    },
    sheetTitle: {
        fontSize: 24,
        color: '#111827',
        marginBottom: 6,
    },
    sheetSub: {
        marginBottom: 24,
    },
    field: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
        color: '#374151',
    },
    input: {
        minHeight: 52,
        backgroundColor: '#F3F4F6',
        borderRadius: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#111827',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    fieldError: {
        color: '#DC2626',
        marginTop: -4,
        marginBottom: 10,
    },
    forgotWrap: {
        alignSelf: 'flex-end',
        marginBottom: 20,
        paddingVertical: 4,
    },
    primaryTouchable: {
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 22,
        shadowColor: TULBOX_PURPLE,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    primaryBtn: {
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 24,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerMid: {
        marginHorizontal: 14,
    },
    socialBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        minHeight: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FAFAFA',
        marginBottom: 12,
    },
    socialDisabled: {
        opacity: 0.65,
    },
    socialText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    footerRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    proLink: {
        alignItems: 'center',
        marginBottom: 16,
    },
    legalRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
});

const finishStyles = StyleSheet.create({
    root: { flex: 1 },
    inner: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 12,
    },
    sub: {
        fontSize: 17,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 32,
        lineHeight: 24,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#FFF',
        paddingVertical: 16,
        borderRadius: 16,
    },
    btnText: {
        fontSize: 17,
        fontWeight: '700',
        color: TULBOX_PURPLE,
    },
});

const styles = StyleSheet.create({
    slidesRoot: {
        flex: 1,
        backgroundColor: '#000',
    },
    skipFab: {
        position: 'absolute',
        right: 20,
        zIndex: 20,
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    skipFabText: {
        color: 'rgba(255,255,255,0.92)',
        fontSize: 15,
        fontWeight: '600',
    },
    dots: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        zIndex: 15,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.35)',
    },
    dotActive: {
        backgroundColor: '#FFFFFF',
        width: 22,
    },
    continueBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 24,
        zIndex: 20,
    },
    continueBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
    continueGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 28,
    },
    continueText: {
        fontSize: 17,
        fontWeight: '700',
        color: TULBOX_PURPLE,
    },
});
