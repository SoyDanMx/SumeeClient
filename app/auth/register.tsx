import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
    const { theme } = useTheme();
    const { signUpWithEmail } = useAuth();
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async () => {
        if (loading) return;

        setError(null);

        // Validation
        if (!fullName || !email || !password || !confirmPassword) {
            setError('Por favor completa todos los campos');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const result = await signUpWithEmail(email, password, fullName);

            if (result.error) {
                setError(result.error.message || 'Error al registrarse');
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
                            Crear cuenta
                        </Text>
                        <Text variant="body" color={theme.textSecondary} style={styles.subtitle}>
                            Regístrate para comenzar
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

                        <View style={styles.inputContainer}>
                            <Text variant="label" style={styles.label}>
                                Nombre completo
                            </Text>
                            <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                                <Ionicons name="person-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="Juan Pérez"
                                    placeholderTextColor={theme.textSecondary}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

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
                                    autoComplete="password-new"
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text variant="label" style={styles.label}>
                                Confirmar contraseña
                            </Text>
                            <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="••••••••"
                                    placeholderTextColor={theme.textSecondary}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoComplete="password-new"
                                />
                            </View>
                        </View>

                        <Button
                            title="Registrarse"
                            onPress={handleRegister}
                            loading={loading}
                            style={styles.registerButton}
                        />

                        <View style={styles.footer}>
                            <Text variant="caption" color={theme.textSecondary}>
                                ¿Ya tienes cuenta?{' '}
                            </Text>
                            <Button
                                title="Inicia sesión"
                                variant="ghost"
                                size="sm"
                                onPress={() => router.push('/auth/login')}
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
    registerButton: {
        marginTop: 8,
        marginBottom: 24,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

