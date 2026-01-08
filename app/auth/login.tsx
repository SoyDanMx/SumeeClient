import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const { theme } = useTheme();
    const { signInWithEmail, signInWithPhone } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [usePhone, setUsePhone] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        if (loading) return;

        setError(null);
        setLoading(true);

        try {
            let result;
            if (usePhone) {
                if (!phone) {
                    setError('Por favor ingresa tu número de teléfono');
                    setLoading(false);
                    return;
                }
                result = await signInWithPhone(phone);
            } else {
                if (!email || !password) {
                    setError('Por favor completa todos los campos');
                    setLoading(false);
                    return;
                }
                result = await signInWithEmail(email, password);
            }

            if (result.error) {
                setError(result.error.message || 'Error al iniciar sesión');
            }
        } catch (err: any) {
            setError(err.message || 'Error inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <Text variant="h1" weight="bold" style={styles.title}>
                            Bienvenido
                        </Text>
                        <Text variant="body" color={theme.textSecondary} style={styles.subtitle}>
                            Inicia sesión para continuar
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {error && (
                            <View style={[styles.errorContainer, { backgroundColor: theme.error + '20' }]}>
                                <Ionicons name="alert-circle" size={20} color={theme.error} />
                                <Text variant="caption" color={theme.error} style={styles.errorText}>
                                    {error}
                                </Text>
                            </View>
                        )}

                        <View style={styles.toggleContainer}>
                            <Button
                                title="Email"
                                variant={!usePhone ? 'primary' : 'outline'}
                                size="sm"
                                onPress={() => setUsePhone(false)}
                                style={styles.toggleButton}
                            />
                            <Button
                                title="Teléfono"
                                variant={usePhone ? 'primary' : 'outline'}
                                size="sm"
                                onPress={() => setUsePhone(true)}
                                style={styles.toggleButton}
                            />
                        </View>

                        {usePhone ? (
                            <View style={styles.inputContainer}>
                                <Text variant="label" style={styles.label}>
                                    Número de teléfono
                                </Text>
                                <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                                    <Ionicons name="call-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        placeholder="+52 55 1234 5678"
                                        placeholderTextColor={theme.textSecondary}
                                        value={phone}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>
                        ) : (
                            <>
                                <View style={styles.inputContainer}>
                                    <Text variant="label" style={styles.label}>
                                        Email
                                    </Text>
                                    <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                                        <Ionicons name="mail-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: theme.text }]}
                                            placeholder="tu@email.com"
                                            placeholderTextColor={theme.textSecondary}
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoComplete="email"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text variant="label" style={styles.label}>
                                        Contraseña
                                    </Text>
                                    <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                                        <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: theme.text }]}
                                            placeholder="••••••••"
                                            placeholderTextColor={theme.textSecondary}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                            autoCapitalize="none"
                                            autoComplete="password"
                                        />
                                    </View>
                                </View>
                            </>
                        )}

                        <Button
                            title={usePhone ? "Enviar código" : "Iniciar sesión"}
                            onPress={handleLogin}
                            loading={loading}
                            style={styles.loginButton}
                        />

                        <View style={styles.footer}>
                            <Text variant="caption" color={theme.textSecondary}>
                                ¿No tienes cuenta?{' '}
                            </Text>
                            <Button
                                title="Regístrate"
                                variant="ghost"
                                size="sm"
                                onPress={() => router.push('/auth/register')}
                            />
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
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        marginTop: 40,
        marginBottom: 32,
    },
    title: {
        marginBottom: 8,
    },
    subtitle: {
        marginTop: 4,
    },
    form: {
        flex: 1,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        flex: 1,
    },
    toggleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    toggleButton: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 16,
    },
    loginButton: {
        marginTop: 8,
        marginBottom: 24,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

