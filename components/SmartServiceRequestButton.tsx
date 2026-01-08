import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { ValidationState } from '@/hooks/useServiceRequestValidation';

export type ButtonVariant = 'A' | 'B' | 'C' | 'D';

export type ButtonState = 'disabled' | 'ready' | 'loading' | 'success' | 'error';

interface SmartServiceRequestButtonProps {
    validation: ValidationState;
    loading?: boolean;
    error?: string | null;
    onPress: () => void;
    variant?: ButtonVariant;
    style?: any;
}

const BUTTON_VARIANTS: Record<ButtonVariant, { text: string; icon?: string }> = {
    A: { text: 'Solicitar Servicio Ahora', icon: 'checkmark-circle' },
    B: { text: 'Contratar Profesional', icon: 'person-add' },
    C: { text: 'Obtener Cotización Gratis', icon: 'receipt' },
    D: { text: 'Agendar Cita', icon: 'calendar' },
};

export function SmartServiceRequestButton({
    validation,
    loading = false,
    error = null,
    onPress,
    variant = 'A',
    style,
}: SmartServiceRequestButtonProps) {
    const { theme } = useTheme();
    const [pulseAnim] = useState(new Animated.Value(1));
    const [shakeAnim] = useState(new Animated.Value(0));

    // Determinar estado del botón
    const buttonState: ButtonState = React.useMemo(() => {
        if (error) return 'error';
        if (loading) return 'loading';
        if (!validation.canSubmit) return 'disabled';
        return 'ready';
    }, [validation.canSubmit, loading, error]);

    // Animación de pulse cuando está listo
    useEffect(() => {
        if (buttonState === 'ready') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.02,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [buttonState]);

    // Animación de shake cuando hay error
    useEffect(() => {
        if (buttonState === 'error') {
            Animated.sequence([
                Animated.timing(shakeAnim, {
                    toValue: 10,
                    duration: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                    toValue: -10,
                    duration: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                    toValue: 10,
                    duration: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                    toValue: 0,
                    duration: 50,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [buttonState, error]);

    const getButtonStyle = () => {
        switch (buttonState) {
            case 'disabled':
                return {
                    backgroundColor: '#E2E8F0',
                    opacity: 0.6,
                };
            case 'ready':
                return {
                    backgroundColor: theme.primary,
                };
            case 'loading':
                return {
                    backgroundColor: theme.primary,
                    opacity: 0.8,
                };
            case 'success':
                return {
                    backgroundColor: '#10B981',
                };
            case 'error':
                return {
                    backgroundColor: '#EF4444',
                };
            default:
                return {
                    backgroundColor: theme.primary,
                };
        }
    };

    const getButtonText = () => {
        switch (buttonState) {
            case 'disabled':
                if (validation.missingFields.length > 0) {
                    return `Completa: ${validation.missingFields[0]}`;
                }
                return 'Completa los campos requeridos';
            case 'loading':
                return 'Creando solicitud...';
            case 'success':
                return '¡Solicitud Creada!';
            case 'error':
                return error || 'Error al crear solicitud';
            default:
                return BUTTON_VARIANTS[variant].text;
        }
    };

    const handlePress = () => {
        if (buttonState === 'disabled' || buttonState === 'loading') {
            return;
        }
        onPress();
    };

    const buttonStyle = getButtonStyle();
    const buttonText = getButtonText();
    const icon = BUTTON_VARIANTS[variant].icon;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [
                        { scale: buttonState === 'ready' ? pulseAnim : 1 },
                        { translateX: shakeAnim },
                    ],
                },
            ]}
        >
            <TouchableOpacity
                style={[
                    styles.button,
                    buttonStyle,
                    style,
                    (buttonState === 'disabled' || buttonState === 'loading') && styles.buttonDisabled,
                ]}
                onPress={handlePress}
                activeOpacity={0.8}
                disabled={buttonState === 'disabled' || buttonState === 'loading'}
            >
                {buttonState === 'loading' ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text variant="body" weight="bold" color="#FFFFFF" style={styles.buttonText}>
                            {buttonText}
                        </Text>
                    </View>
                ) : buttonState === 'success' ? (
                    <View style={styles.successContainer}>
                        <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                        <Text variant="body" weight="bold" color="#FFFFFF" style={styles.buttonText}>
                            {buttonText}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.contentContainer}>
                        {icon && buttonState === 'ready' && (
                            <Ionicons name={icon as any} size={20} color="#FFFFFF" style={styles.icon} />
                        )}
                        <Text
                            variant="body"
                            weight="bold"
                            color={buttonState === 'disabled' ? theme.textSecondary : '#FFFFFF'}
                            style={styles.buttonText}
                        >
                            {buttonText}
                        </Text>
                    </View>
                )}

                {/* Progress bar durante loading */}
                {buttonState === 'loading' && (
                    <View style={styles.progressBarContainer}>
                        <Animated.View
                            style={[
                                styles.progressBar,
                                {
                                    backgroundColor: '#FFFFFF',
                                    opacity: 0.3,
                                },
                            ]}
                        />
                    </View>
                )}
            </TouchableOpacity>

            {/* Mensaje de error debajo del botón */}
            {buttonState === 'error' && error && (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text variant="caption" color="#EF4444" style={styles.errorText}>
                        {error}
                    </Text>
                </View>
            )}

            {/* Indicador de campos faltantes */}
            {buttonState === 'disabled' && validation.missingFields.length > 0 && (
                <View style={styles.missingFieldsContainer}>
                    <Text variant="caption" color={theme.textSecondary} style={styles.missingFieldsText}>
                        Campos requeridos: {validation.missingFields.join(', ')}
                    </Text>
                </View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    button: {
        width: '100%',
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingHorizontal: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    icon: {
        marginRight: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    progressBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        width: '100%',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    errorText: {
        flex: 1,
    },
    missingFieldsContainer: {
        marginTop: 8,
        paddingHorizontal: 4,
    },
    missingFieldsText: {
        fontSize: 12,
    },
});

