/**
 * Inicio de sesión clásico: correo + contraseña (Supabase).
 * Apple / Google: integración lista (mismo patrón Supabase + Expo).
 */

import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Linking,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as ExpoLinking from 'expo-linking';
import { Text } from '@/components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { mapAuthMessage, signInWithGoogle, signInWithApple } from '@/lib/auth/oauthProviders';

const TULBOX_PURPLE = '#820AD1';

export default function LoginScreen() {
    const router = useRouter();
    const { signInWithEmail } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

    const showApple = Platform.OS === 'ios';
    const formBusy = isLoading || socialLoading !== null;

    const handleLogin = async () => {
        if (formBusy) return;
        setError(null);

        if (!email.trim() || !password) {
            setError('Completa correo y contraseña.');
            return;
        }

        setIsLoading(true);
        try {
            const { error: signError } = await signInWithEmail(email.trim(), password);

            if (signError) {
                setError(mapAuthMessage(signError.message));
                return;
            }
            // AuthContext: signInWithEmail + onAuthStateChange cargan perfil y redirigen.
        } catch (err: any) {
            setError(mapAuthMessage(err?.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        setError(null);
        const e = email.trim();
        if (!e) {
            setError('Escribe tu correo y vuelve a tocar «Olvidaste tu contraseña».');
            return;
        }
        try {
            const redirectTo = ExpoLinking.createURL('auth/callback');
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(e, { redirectTo });
            if (resetError) {
                setError(mapAuthMessage(resetError.message));
                return;
            }
            Alert.alert('Revisa tu correo', 'Si hay una cuenta asociada, recibirás un enlace para restablecer la contraseña.');
        } catch (err: any) {
            setError(mapAuthMessage(err?.message));
        }
    };

    const handleGoogle = async () => {
        if (formBusy) return;
        setError(null);
        setSocialLoading('google');
        try {
            const { error: gErr } = await signInWithGoogle();
            if (gErr) setError(gErr.message);
        } finally {
            setSocialLoading(null);
        }
    };

    const handleApple = async () => {
        if (formBusy) return;
        setError(null);
        setSocialLoading('apple');
        try {
            const { error: aErr } = await signInWithApple();
            if (aErr) setError(aErr.message);
        } finally {
            setSocialLoading(null);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar style="dark" />

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={28} color="#1F2937" />
            </TouchableOpacity>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Text variant="h1" weight="bold" style={styles.title}>
                            Bienvenido a <Text variant="h1" weight="bold" color={TULBOX_PURPLE}>TulBox</Text>
                        </Text>
                        <Text variant="body" color="#6B7280" style={styles.subtitle}>
                            Inicia sesión para continuar
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text variant="label" weight="medium" style={styles.label}>
                                Email
                            </Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="tu@email.com"
                                    placeholderTextColor="#9CA3AF"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="email"
                                    textContentType="emailAddress"
                                    editable={!formBusy}
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text variant="label" weight="medium" style={styles.label}>
                                Contraseña
                            </Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoComplete="password"
                                    textContentType="password"
                                    editable={!formBusy}
                                />
                            </View>
                        </View>

                        {error ? (
                            <Text variant="caption" style={styles.fieldError}>
                                {error}
                            </Text>
                        ) : null}

                        <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword} disabled={formBusy}>
                            <Text variant="caption" weight="bold" color={TULBOX_PURPLE}>
                                ¿Olvidaste tu contraseña?
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.primaryButton, formBusy && isLoading && styles.primaryButtonDisabled]}
                            onPress={handleLogin}
                            disabled={formBusy}
                            activeOpacity={0.85}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text variant="body" weight="bold" style={styles.primaryButtonText}>
                                    Continuar
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text variant="caption" color="#9CA3AF" style={styles.dividerText}>
                                o
                            </Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.socialButtons}>
                            {showApple && (
                                <TouchableOpacity
                                    style={[styles.socialButton, socialLoading && styles.socialButtonDisabled]}
                                    onPress={handleApple}
                                    disabled={formBusy}
                                    activeOpacity={0.85}
                                >
                                    {socialLoading === 'apple' ? (
                                        <ActivityIndicator color="#1F2937" />
                                    ) : (
                                        <>
                                            <Ionicons name="logo-apple" size={22} color="#000000" />
                                            <Text variant="body" weight="bold" style={styles.socialButtonText}>
                                                Ingresar con Apple
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.socialButton, socialLoading && styles.socialButtonDisabled]}
                                onPress={handleGoogle}
                                disabled={formBusy}
                                activeOpacity={0.85}
                            >
                                {socialLoading === 'google' ? (
                                    <ActivityIndicator color="#1F2937" />
                                ) : (
                                    <>
                                        <Ionicons name="logo-google" size={22} color="#EA4335" />
                                        <Text variant="body" weight="bold" style={styles.socialButtonText}>
                                            Ingresar con Google
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <Text variant="body" color="#6B7280">
                                ¿No tienes cuenta?{' '}
                            </Text>
                            <TouchableOpacity onPress={() => router.push('/auth/register')} disabled={formBusy}>
                                <Text variant="body" weight="bold" color={TULBOX_PURPLE}>
                                    Regístrate
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.legalFooter}>
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
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        width: 60,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        marginTop: 10,
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        color: '#1F2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
    },
    form: {
        flex: 1,
    },
    fieldError: {
        color: '#DC2626',
        marginTop: -4,
        marginBottom: 12,
        lineHeight: 18,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        color: '#374151',
    },
    inputWrapper: {
        minHeight: 56,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    input: {
        fontSize: 16,
        color: '#1F2937',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
        paddingVertical: 4,
    },
    primaryButton: {
        backgroundColor: '#111827',
        minHeight: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    primaryButtonDisabled: {
        opacity: 0.65,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        marginHorizontal: 16,
    },
    socialButtons: {
        gap: 12,
        marginBottom: 32,
    },
    socialButton: {
        flexDirection: 'row',
        minHeight: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: '#FFFFFF',
    },
    socialButtonDisabled: {
        opacity: 0.7,
    },
    socialButtonText: {
        color: '#1F2937',
        fontSize: 15,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    legalFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        paddingBottom: 8,
    },
});
