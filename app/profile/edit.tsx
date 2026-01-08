import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { TextInput } from 'react-native';
import { ProfileService, ProfileUpdate } from '@/services/profile';
import { SUMEE_COLORS } from '@/constants/Colors';

export default function EditProfileScreen() {
    const { theme } = useTheme();
    const { user, profile, loadUserProfile } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [formData, setFormData] = useState<ProfileUpdate>({
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
        whatsapp: profile?.whatsapp || '',
        city: profile?.city || '',
        state: profile?.state || '',
    });
    const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url || null);

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                whatsapp: profile.whatsapp || '',
                city: profile.city || '',
                state: profile.state || '',
            });
            setAvatarUri(profile.avatar_url || null);
        }
    }, [profile]);

    const handlePickImage = async () => {
        try {
            const ImagePicker = await import('expo-image-picker');
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permisos', 'Necesitamos acceso a tu galería para cambiar la foto');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setAvatarUri(result.assets[0].uri);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo seleccionar la imagen');
        }
    };

    const handleTakePhoto = async () => {
        try {
            const ImagePicker = await import('expo-image-picker');
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permisos', 'Necesitamos acceso a tu cámara para tomar una foto');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setAvatarUri(result.assets[0].uri);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo tomar la foto');
        }
    };

    const handleSave = async () => {
        if (!user) {
            Alert.alert('Error', 'No hay usuario autenticado');
            return;
        }

        setLoading(true);

        try {
            console.log('[EditProfile] Starting save process...');
            console.log('[EditProfile] User ID:', user.id);
            console.log('[EditProfile] Form data:', formData);
            console.log('[EditProfile] Avatar URI:', avatarUri);

            // Subir foto si hay una nueva
            let avatarUrl = profile?.avatar_url;
            if (avatarUri && avatarUri !== profile?.avatar_url && !avatarUri.startsWith('http')) {
                console.log('[EditProfile] Uploading new avatar...');
                setUploadingPhoto(true);
                try {
                    avatarUrl = await ProfileService.uploadAvatar(user.id, avatarUri);
                    console.log('[EditProfile] ✅ Avatar uploaded:', avatarUrl);
                } catch (avatarError: any) {
                    console.error('[EditProfile] Error uploading avatar:', avatarError);
                    Alert.alert(
                        'Error al subir foto',
                        avatarError.message || 'No se pudo subir la foto. ¿Deseas continuar sin actualizar la foto?',
                        [
                            { text: 'Cancelar', style: 'cancel' },
                            {
                                text: 'Continuar sin foto',
                                onPress: async () => {
                                    // Continuar sin actualizar la foto
                                    await saveProfileData();
                                },
                            },
                        ]
                    );
                    setUploadingPhoto(false);
                    setLoading(false);
                    return;
                } finally {
                    setUploadingPhoto(false);
                }
            }

            // Actualizar perfil con datos del formulario
            await saveProfileData(avatarUrl);
        } catch (error: any) {
            console.error('[EditProfile] Error saving profile:', error);
            Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
        } finally {
            setLoading(false);
            setUploadingPhoto(false);
        }
    };

    const saveProfileData = async (avatarUrl?: string | null) => {
        if (!user) return;

        try {
            console.log('[EditProfile] Saving profile data...');

            // Actualizar perfil
            const updates: ProfileUpdate = {
                full_name: formData.full_name || undefined,
                phone: formData.phone || undefined,
                whatsapp: formData.whatsapp || undefined,
                city: formData.city || undefined,
                state: formData.state || undefined,
            };

            // Solo agregar avatar_url si hay un valor
            if (avatarUrl !== undefined) {
                updates.avatar_url = avatarUrl || undefined;
            }

            console.log('[EditProfile] Updates to apply:', updates);

            const updatedProfile = await ProfileService.updateProfile(user.id, updates);
            console.log('[EditProfile] ✅ Profile updated:', updatedProfile);

            // Recargar perfil en AuthContext
            if (loadUserProfile) {
                console.log('[EditProfile] Reloading profile in AuthContext...');
                await loadUserProfile(user, null);
            }

            Alert.alert('¡Éxito!', 'Tu perfil ha sido actualizado', [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        } catch (error: any) {
            console.error('[EditProfile] Error in saveProfileData:', error);
            throw error;
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={[styles.header, { backgroundColor: theme.card }]}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text variant="h2" weight="bold">
                            Editar Perfil
                        </Text>
                    </View>

                    {/* Foto de Perfil */}
                    <View style={styles.photoSection}>
                        <View style={styles.avatarContainer}>
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                                    <Ionicons name="person" size={40} color="#FFFFFF" />
                                </View>
                            )}
                            {uploadingPhoto && (
                                <View style={styles.uploadingOverlay}>
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                </View>
                            )}
                        </View>
                        <View style={styles.photoButtons}>
                            <Button
                                title="Galería"
                                variant="outline"
                                size="sm"
                                onPress={handlePickImage}
                                style={styles.photoButton}
                            />
                            <Button
                                title="Cámara"
                                variant="outline"
                                size="sm"
                                onPress={handleTakePhoto}
                                style={styles.photoButton}
                            />
                        </View>
                    </View>

                    {/* Formulario */}
                    <View style={styles.formSection}>
                        <Card variant="elevated" style={styles.formCard}>
                            {/* Nombre Completo */}
                            <View style={styles.inputContainer}>
                                <Text variant="label" weight="medium" style={styles.label}>
                                    Nombre Completo
                                </Text>
                                <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                                    <Ionicons name="person-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        placeholder="Tu nombre completo"
                                        placeholderTextColor={theme.textSecondary}
                                        value={formData.full_name}
                                        onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>

                            {/* Teléfono */}
                            <View style={styles.inputContainer}>
                                <Text variant="label" weight="medium" style={styles.label}>
                                    Teléfono
                                </Text>
                                <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                                    <Ionicons name="call-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        placeholder="+52 55 1234 5678"
                                        placeholderTextColor={theme.textSecondary}
                                        value={formData.phone}
                                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            {/* WhatsApp */}
                            <View style={styles.inputContainer}>
                                <Text variant="label" weight="medium" style={styles.label}>
                                    WhatsApp
                                </Text>
                                <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                                    <Ionicons name="logo-whatsapp" size={20} color={SUMEE_COLORS.GREEN} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        placeholder="+52 55 1234 5678"
                                        placeholderTextColor={theme.textSecondary}
                                        value={formData.whatsapp}
                                        onChangeText={(text) => setFormData({ ...formData, whatsapp: text })}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            {/* Ciudad */}
                            <View style={styles.inputContainer}>
                                <Text variant="label" weight="medium" style={styles.label}>
                                    Ciudad
                                </Text>
                                <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                                    <Ionicons name="location-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        placeholder="Ciudad de México"
                                        placeholderTextColor={theme.textSecondary}
                                        value={formData.city}
                                        onChangeText={(text) => setFormData({ ...formData, city: text })}
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>

                            {/* Estado */}
                            <View style={styles.inputContainer}>
                                <Text variant="label" weight="medium" style={styles.label}>
                                    Estado
                                </Text>
                                <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                                    <Ionicons name="map-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        placeholder="CDMX"
                                        placeholderTextColor={theme.textSecondary}
                                        value={formData.state}
                                        onChangeText={(text) => setFormData({ ...formData, state: text })}
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>
                        </Card>
                    </View>

                    {/* Botones */}
                    <View style={styles.actionsSection}>
                        <Button
                            title="Guardar Cambios"
                            onPress={handleSave}
                            loading={loading || uploadingPhoto}
                            style={styles.saveButton}
                        />
                        <Button
                            title="Cancelar"
                            variant="outline"
                            onPress={() => router.back()}
                            style={styles.cancelButton}
                        />
                    </View>

                    <View style={{ height: 20 }} />
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        marginRight: 16,
    },
    photoSection: {
        alignItems: 'center',
        padding: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    photoButton: {
        minWidth: 100,
    },
    formSection: {
        padding: 20,
    },
    formCard: {
        padding: 16,
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
    actionsSection: {
        padding: 20,
        gap: 12,
    },
    saveButton: {
        marginBottom: 8,
    },
    cancelButton: {
        marginTop: 0,
    },
});

