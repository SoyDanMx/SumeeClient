/**
 * Modal de Configuración de Notificaciones
 * Permite al usuario gestionar sus preferencias de notificaciones
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Switch,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { SUMEE_COLORS } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationsModalProps {
    visible: boolean;
    onClose: () => void;
}

interface NotificationSettings {
    push_enabled: boolean;
    professional_communication: boolean; // Avisos del profesional
    platform_notifications: boolean; // Avisos de plataforma
    service_updates: boolean; // Actualizaciones de servicios
    new_leads: boolean; // Nuevos leads (para profesionales, oculto para clientes)
    quiet_hours_enabled: boolean;
    quiet_hours_start: string;
    quiet_hours_end: string;
}

const DEFAULT_SETTINGS: NotificationSettings = {
    push_enabled: true,
    professional_communication: true, // Por defecto activado - importante para comunicación
    platform_notifications: true, // Por defecto activado - avisos importantes
    service_updates: true,
    new_leads: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
};

export function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Cargar configuración del usuario
    useEffect(() => {
        if (visible && user?.id) {
            loadSettings();
        }
    }, [visible, user?.id]);

    const loadSettings = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('notification_settings')
                .eq('user_id', user.id)
                .single();

            // Si la columna no existe (42703) o no hay datos (PGRST116), usar valores por defecto
            if (error) {
                if (error.code === '42703') {
                    // Columna no existe - usar valores por defecto
                    console.log('[NotificationsModal] Columna notification_settings no existe, usando valores por defecto');
                    console.log('[NotificationsModal] Ejecuta CREAR_COLUMNA_NOTIFICATION_SETTINGS.sql en Supabase');
                    setSettings(DEFAULT_SETTINGS);
                } else if (error.code === 'PGRST116') {
                    // No hay datos - usar valores por defecto
                    setSettings(DEFAULT_SETTINGS);
                } else {
                    console.error('[NotificationsModal] Error loading settings:', error);
                    // En caso de otro error, usar valores por defecto
                    setSettings(DEFAULT_SETTINGS);
                }
                return;
            }

            // Si hay datos y notification_settings existe, usarlos
            if (data?.notification_settings) {
                setSettings({
                    ...DEFAULT_SETTINGS,
                    ...data.notification_settings,
                });
            } else {
                // Si no hay notification_settings, usar valores por defecto
                setSettings(DEFAULT_SETTINGS);
            }
        } catch (error) {
            console.error('[NotificationsModal] Error loading settings:', error);
            // En caso de error, usar valores por defecto
            setSettings(DEFAULT_SETTINGS);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        if (!user?.id) return;

        try {
            setSaving(true);
            const { error } = await supabase
                .from('profiles')
                .update({
                    notification_settings: settings,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id);

            if (error) {
                if (error.code === '42703') {
                    // Columna no existe
                    console.error('[NotificationsModal] Error: La columna notification_settings no existe');
                    console.error('[NotificationsModal] Por favor ejecuta CREAR_COLUMNA_NOTIFICATION_SETTINGS.sql en Supabase');
                    // TODO: Mostrar alerta al usuario
                    Alert.alert(
                        'Configuración Pendiente',
                        'La columna de notificaciones no está configurada en la base de datos. Por favor ejecuta el script SQL en Supabase o contacta a soporte.',
                        [{ text: 'OK' }]
                    );
                } else {
                    console.error('[NotificationsModal] Error saving settings:', error);
                    Alert.alert(
                        'Error',
                        'Error al guardar la configuración. Intenta de nuevo.',
                        [{ text: 'OK' }]
                    );
                }
                return;
            }

            // Cerrar modal después de guardar exitosamente
            onClose();
        } catch (error) {
            console.error('[NotificationsModal] Error saving settings:', error);
            Alert.alert(
                'Error',
                'Error al guardar la configuración. Intenta de nuevo.',
                [{ text: 'OK' }]
            );
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key: keyof NotificationSettings, value: boolean | string) => {
        setSettings(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const toggleSetting = (key: keyof NotificationSettings) => {
        const currentValue = settings[key];
        if (typeof currentValue === 'boolean') {
            updateSetting(key, !currentValue);
        }
    };

    // Debug: Verificar que el modal se renderiza
    console.log('[NotificationsModal] Rendering modal:', {
        visible,
        loading,
        push_enabled: settings.push_enabled,
        settingsKeys: Object.keys(settings),
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={styles.keyboardView}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                            {/* Header */}
                            <View style={styles.header}>
                            <Text variant="h2" weight="bold">
                                Notificaciones
                            </Text>
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={styles.closeButton}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="close" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>

                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <Text variant="body" color={theme.textSecondary}>
                                        Cargando configuración...
                                    </Text>
                                </View>
                            ) : (
                                <ScrollView
                                    style={styles.scrollView}
                                    contentContainerStyle={styles.scrollContent}
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    {/* Toggle Principal */}
                                    <Card variant="elevated" style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
                                        <View style={styles.toggleRow}>
                                            <View style={styles.toggleInfo}>
                                                <Ionicons name="notifications" size={24} color={theme.primary} />
                                                <View style={styles.toggleTextContainer}>
                                                    <Text variant="body" weight="bold">
                                                        Notificaciones Push
                                                    </Text>
                                                    <Text variant="caption" color={theme.textSecondary}>
                                                        Activa o desactiva todas las notificaciones
                                                    </Text>
                                                </View>
                                            </View>
                                            <Switch
                                                value={settings.push_enabled}
                                                onValueChange={() => toggleSetting('push_enabled')}
                                                trackColor={{ false: theme.border, true: SUMEE_COLORS.PURPLE + '80' }}
                                                thumbColor={settings.push_enabled ? SUMEE_COLORS.PURPLE : '#f4f3f4'}
                                            />
                                        </View>
                                    </Card>

                                    {settings.push_enabled && (
                                        <>
                                            {/* Categorías de Notificaciones */}
                                            <View style={styles.section}>
                                                <Text variant="body" weight="bold" style={styles.sectionTitle}>
                                                    Tipos de Notificaciones
                                                </Text>
                                                <Card variant="elevated" style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
                                                    <NotificationToggle
                                                        icon="chatbubble-ellipses-outline"
                                                        title="Comunicación con Profesionales"
                                                        description="Avisos y mensajes del profesional asignado a tu servicio"
                                                        value={settings.professional_communication}
                                                        onToggle={() => toggleSetting('professional_communication')}
                                                        theme={theme}
                                                    />
                                                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                                                    <NotificationToggle
                                                        icon="notifications-circle-outline"
                                                        title="Avisos de Plataforma"
                                                        description="Notificaciones importantes de SumeeApp sobre tu cuenta y servicios"
                                                        value={settings.platform_notifications}
                                                        onToggle={() => toggleSetting('platform_notifications')}
                                                        theme={theme}
                                                    />
                                                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                                                    <NotificationToggle
                                                        icon="refresh-outline"
                                                        title="Actualizaciones de Servicios"
                                                        description="Cambios en el estado de tus servicios (aceptado, en progreso, completado)"
                                                        value={settings.service_updates}
                                                        onToggle={() => toggleSetting('service_updates')}
                                                        theme={theme}
                                                    />
                                                </Card>
                                            </View>

                                            {/* Horarios de Silencio */}
                                            <View style={styles.section}>
                                                <Text variant="body" weight="bold" style={styles.sectionTitle}>
                                                    Horarios de Silencio
                                                </Text>
                                                <Card variant="elevated" style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
                                                    <View style={styles.toggleRow}>
                                                        <View style={styles.toggleInfo}>
                                                            <Ionicons name="moon-outline" size={24} color={theme.primary} />
                                                            <View style={styles.toggleTextContainer}>
                                                                <Text variant="body" weight="bold">
                                                                    Activar Horarios de Silencio
                                                                </Text>
                                                                <Text variant="caption" color={theme.textSecondary}>
                                                                    No recibir notificaciones durante estas horas
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <Switch
                                                            value={settings.quiet_hours_enabled}
                                                            onValueChange={() => toggleSetting('quiet_hours_enabled')}
                                                            trackColor={{ false: theme.border, true: SUMEE_COLORS.PURPLE + '80' }}
                                                            thumbColor={settings.quiet_hours_enabled ? SUMEE_COLORS.PURPLE : '#f4f3f4'}
                                                        />
                                                    </View>
                                                    {settings.quiet_hours_enabled && (
                                                        <View style={styles.quietHoursInfo}>
                                                            <Text variant="caption" color={theme.textSecondary}>
                                                                Silencio activo de {settings.quiet_hours_start} a {settings.quiet_hours_end}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </Card>
                                            </View>
                                        </>
                                    )}

                                    {/* Botón Guardar */}
                                    <TouchableOpacity
                                        style={[styles.saveButton, { backgroundColor: SUMEE_COLORS.PURPLE }]}
                                        activeOpacity={0.8}
                                        onPress={saveSettings}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <Text variant="body" weight="bold" color="#FFFFFF">
                                                Guardando...
                                            </Text>
                                        ) : (
                                            <>
                                                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                                <Text variant="body" weight="bold" color="#FFFFFF">
                                                    Guardar Cambios
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </ScrollView>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </Modal>
    );
}

interface NotificationToggleProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    value: boolean;
    onToggle: () => void;
    theme: any;
}

function NotificationToggle({ icon, title, description, value, onToggle, theme }: NotificationToggleProps) {
    return (
        <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
                <Ionicons name={icon} size={20} color={theme.textSecondary} />
                <View style={styles.toggleTextContainer}>
                    <Text variant="body" weight="medium">
                        {title}
                    </Text>
                    <Text variant="caption" color={theme.textSecondary}>
                        {description}
                    </Text>
                </View>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: theme.border, true: SUMEE_COLORS.PURPLE + '80' }}
                thumbColor={value ? SUMEE_COLORS.PURPLE : '#f4f3f4'}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        zIndex: 1000,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    keyboardView: {
        maxHeight: Dimensions.get('window').height * 0.75,
        width: '100%',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: 400,
        maxHeight: Dimensions.get('window').height * 0.75,
        paddingBottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    closeButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
        flexGrow: 1,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        marginBottom: 12,
    },
    sectionCard: {
        padding: 0,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        gap: 12,
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    toggleTextContainer: {
        flex: 1,
    },
    divider: {
        height: 1,
        marginLeft: 52,
    },
    quietHoursInfo: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginTop: 8,
        marginBottom: 32,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
});

