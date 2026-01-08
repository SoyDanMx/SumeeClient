import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    KeyboardAvoidingView,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '@/contexts/ThemeContext';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { normalizeWhatsappNumber, formatWhatsappForDisplay } from '@/utils/whatsapp';
import { getAddressSuggestions, formatAddressSuggestion, AddressSuggestion } from '@/services/addressAutocomplete';

interface EditLeadModalProps {
    visible: boolean;
    lead: {
        id: string;
        servicio_solicitado?: string | null;
        servicio?: string | null; // Campo alternativo
        descripcion_proyecto?: string | null;
        ubicacion_direccion?: string | null;
        whatsapp?: string | null;
        photos_urls?: string[] | null;
    };
    onClose: () => void;
    onSave: (data: {
        service: string;
        description: string;
        whatsapp: string;
        address?: string;
        photos: string[];
    }) => Promise<void>;
}

export function EditLeadModal({ visible, lead, onClose, onSave }: EditLeadModalProps) {
    const { theme } = useTheme();
    // Usar servicio_solicitado o servicio como fallback
    const [service, setService] = useState(lead.servicio_solicitado || lead.servicio || '');
    const [description, setDescription] = useState(lead.descripcion_proyecto || '');
    const [address, setAddress] = useState(lead.ubicacion_direccion || '');
    const [whatsapp, setWhatsapp] = useState(() => {
        const { normalized, isValid } = normalizeWhatsappNumber(lead.whatsapp || '');
        return isValid ? formatWhatsappForDisplay(normalized) : lead.whatsapp || '';
    });
    const [whatsappError, setWhatsappError] = useState<string | null>(null);
    const [photos, setPhotos] = useState<string[]>(lead.photos_urls || []);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    
    // Estados para autocompletado de direcciones
    const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const addressSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (visible) {
            // Usar servicio_solicitado o servicio como fallback
            setService(lead.servicio_solicitado || lead.servicio || '');
            setDescription(lead.descripcion_proyecto || '');
            setAddress(lead.ubicacion_direccion || '');
            const { normalized, isValid } = normalizeWhatsappNumber(lead.whatsapp || '');
            setWhatsapp(isValid ? formatWhatsappForDisplay(normalized) : lead.whatsapp || '');
            setWhatsappError(null);
            setPhotos(lead.photos_urls || []);
            setUploadError(null);
            setAddressSuggestions([]);
            setShowAddressSuggestions(false);
        }
    }, [visible, lead]);

    // Función para buscar sugerencias de direcciones
    const fetchAddressSuggestions = async (query: string) => {
        if (!query || query.length < 3) {
            setAddressSuggestions([]);
            setShowAddressSuggestions(false);
            return;
        }

        setIsLoadingAddress(true);
        
        // Limpiar timeout anterior
        if (addressSearchTimeoutRef.current) {
            clearTimeout(addressSearchTimeoutRef.current);
        }

        // Debounce: esperar 400ms antes de buscar
        addressSearchTimeoutRef.current = setTimeout(async () => {
            try {
                console.log('[EditLeadModal] Buscando sugerencias para:', query);
                const suggestions = await getAddressSuggestions(query, 5);
                console.log('[EditLeadModal] Sugerencias recibidas:', suggestions.length);
                setAddressSuggestions(suggestions);
                setShowAddressSuggestions(suggestions.length > 0);
                console.log('[EditLeadModal] Mostrando sugerencias:', suggestions.length > 0);
            } catch (error: any) {
                console.error('[EditLeadModal] Error al obtener sugerencias de dirección:', error);
                console.error('[EditLeadModal] Error details:', error.message, error.stack);
                setAddressSuggestions([]);
                setShowAddressSuggestions(false);
            } finally {
                setIsLoadingAddress(false);
            }
        }, 400);
    };

    // Manejar cambio en el input de dirección con autocompletado
    const handleAddressChange = (value: string) => {
        console.log('[EditLeadModal] handleAddressChange:', value);
        setAddress(value);
        
        // Si se limpia el campo, limpiar también las sugerencias
        if (value.length === 0) {
            setShowAddressSuggestions(false);
            setAddressSuggestions([]);
        } else if (value.length >= 3) {
            // Buscar sugerencias mientras el usuario escribe
            console.log('[EditLeadModal] Llamando fetchAddressSuggestions con:', value);
            fetchAddressSuggestions(value);
        } else {
            setAddressSuggestions([]);
            setShowAddressSuggestions(false);
        }
    };

    // Manejar selección de sugerencia de dirección
    const handleSelectAddressSuggestion = (suggestion: AddressSuggestion) => {
        const formattedAddress = formatAddressSuggestion(suggestion);
        setAddress(formattedAddress);
        setShowAddressSuggestions(false);
        setAddressSuggestions([]);
    };

    const handleWhatsappChange = (value: string) => {
        setWhatsapp(value);
        if (whatsappError) {
            setWhatsappError(null);
        }
    };

    const applyWhatsappFormatting = () => {
        const { normalized, isValid } = normalizeWhatsappNumber(whatsapp);
        if (isValid) {
            setWhatsapp(formatWhatsappForDisplay(normalized));
        }
    };

    const handlePickImage = async () => {
        try {
            // Solicitar permisos
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permisos necesarios',
                    'Necesitamos acceso a tus fotos para subir evidencias del servicio.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Abrir selector de imágenes
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
                allowsEditing: false,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }

            // Verificar límite de fotos
            if (photos.length + result.assets.length > 10) {
                Alert.alert(
                    'Límite de fotos',
                    'Puedes subir máximo 10 fotos. Elimina algunas antes de agregar más.',
                    [{ text: 'OK' }]
                );
                return;
            }

            setIsUploading(true);
            setUploadError(null);

            const newUrls: string[] = [];

            for (const asset of result.assets) {
                try {
                    // Leer el archivo como base64
                    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
                        encoding: 'base64' as FileSystem.EncodingType,
                    });

                    // Convertir base64 a ArrayBuffer
                    const binaryString = atob(base64);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const arrayBuffer = bytes.buffer;

                    // Determinar extensión
                    const fileExt = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
                    const filePath = `${lead.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

                    // Subir a Supabase Storage
                    const { error: uploadError } = await supabase.storage
                        .from('lead-photos')
                        .upload(filePath, arrayBuffer, {
                            contentType: `image/${fileExt}`,
                            cacheControl: '3600',
                            upsert: false,
                        });

                    if (uploadError) {
                        throw uploadError;
                    }

                    // Obtener URL pública
                    const { data: { publicUrl } } = supabase.storage
                        .from('lead-photos')
                        .getPublicUrl(filePath);

                    newUrls.push(publicUrl);
                } catch (error: any) {
                    console.error('[EditLeadModal] Error uploading photo:', error);
                    setUploadError('No se pudo subir una o más imágenes. Intenta de nuevo.');
                }
            }

            setPhotos((prev) => [...prev, ...newUrls]);
        } catch (error: any) {
            console.error('[EditLeadModal] Error picking image:', error);
            setUploadError('Error al seleccionar imágenes. Intenta de nuevo.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemovePhoto = async (url: string) => {
        Alert.alert(
            'Eliminar foto',
            '¿Deseas eliminar esta foto? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Extraer el path del URL
                            const path = url.split('/lead-photos/')[1];
                            if (path) {
                                const { error } = await supabase.storage
                                    .from('lead-photos')
                                    .remove([path]);
                                if (error) {
                                    throw error;
                                }
                            }
                            setPhotos((prev) => prev.filter((photo) => photo !== url));
                        } catch (error: any) {
                            console.error('[EditLeadModal] Error removing photo:', error);
                            Alert.alert(
                                'Error',
                                'No se pudo eliminar la foto. Intenta de nuevo.',
                                [{ text: 'OK' }]
                            );
                        }
                    },
                },
            ]
        );
    };

    const handleSave = async () => {
        // Validar WhatsApp
        const { normalized, isValid } = normalizeWhatsappNumber(whatsapp);
        if (!isValid) {
            setWhatsappError('Ingresa un número de WhatsApp válido de 10 dígitos (ej. 55 1234 5678).');
            return;
        }

        // Validar campos requeridos
        if (!service.trim()) {
            Alert.alert('Campo requerido', 'El servicio es requerido.');
            return;
        }

        if (!description.trim() || description.trim().length < 20) {
            Alert.alert(
                'Descripción muy corta',
                'La descripción debe tener al menos 20 caracteres.'
            );
            return;
        }

        try {
            setIsSaving(true);
            await onSave({
                service: service.trim(),
                description: description.trim(),
                whatsapp: normalized,
                address: address.trim() || undefined,
                photos,
            });
            onClose();
        } catch (error: any) {
            console.error('[EditLeadModal] Error saving:', error);
            Alert.alert(
                'Error',
                error.message || 'No se pudieron guardar los cambios. Intenta de nuevo.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]} edges={['top', 'bottom']}>
                <TouchableOpacity 
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={onClose}
                >
                    <TouchableOpacity 
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={styles.keyboardView}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                        >
                            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                                {/* Header */}
                                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                                    <Text variant="h2" weight="bold">
                                        Editar Servicio
                                    </Text>
                                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                        <Ionicons name="close" size={24} color={theme.text} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView 
                                    style={styles.scrollView}
                                    contentContainerStyle={styles.scrollContent}
                                    showsVerticalScrollIndicator={true}
                                    keyboardShouldPersistTaps="handled"
                                    nestedScrollEnabled={true}
                                >
                        {/* Servicio */}
                        <View style={styles.field}>
                            <Text variant="body" weight="medium" style={styles.label}>
                                Servicio <Text style={{ color: 'red' }}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                value={service}
                                onChangeText={setService}
                                placeholder="Servicio Profesional"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        {/* Descripción */}
                        <View style={styles.field}>
                            <Text variant="body" weight="medium" style={styles.label}>
                                Descripción <Text style={{ color: 'red' }}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Describe el servicio que necesitas (mínimo 20 caracteres)"
                                placeholderTextColor={theme.textSecondary}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                            <Text variant="caption" color={theme.textSecondary} style={styles.charCount}>
                                {description.length} / 500 caracteres
                            </Text>
                        </View>

                        {/* WhatsApp */}
                        <View style={styles.field}>
                            <Text variant="body" weight="medium" style={styles.label}>
                                WhatsApp de contacto <Text style={{ color: 'red' }}>*</Text>
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: theme.background,
                                        color: theme.text,
                                        borderColor: whatsappError ? 'red' : theme.border,
                                    },
                                ]}
                                value={whatsapp}
                                onChangeText={handleWhatsappChange}
                                onBlur={applyWhatsappFormatting}
                                placeholder="55 1234 5678"
                                placeholderTextColor={theme.textSecondary}
                                keyboardType="phone-pad"
                            />
                            {whatsappError && (
                                <Text variant="caption" style={{ color: 'red', marginTop: 4 }}>
                                    {whatsappError}
                                </Text>
                            )}
                            <Text variant="caption" color={theme.textSecondary} style={styles.helpText}>
                                Este número se comparte con profesionales verificados para coordinar el servicio por WhatsApp.
                            </Text>
                        </View>

                        {/* Ubicación con Autocompletado */}
                        <View style={styles.field}>
                            <Text variant="body" weight="medium" style={styles.label}>
                                Ubicación
                            </Text>
                            <View style={styles.addressInputContainer}>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                    value={address}
                                    onChangeText={handleAddressChange}
                                    onFocus={() => {
                                        console.log('[EditLeadModal] Input focused, sugerencias:', addressSuggestions.length);
                                        if (addressSuggestions.length > 0) {
                                            setShowAddressSuggestions(true);
                                        }
                                    }}
                                    onBlur={() => {
                                        // Delay para permitir que se ejecute el onPress de las sugerencias
                                        setTimeout(() => {
                                            console.log('[EditLeadModal] Input blurred, ocultando sugerencias');
                                            setShowAddressSuggestions(false);
                                        }, 300);
                                    }}
                                    placeholder="Escribe la dirección (ej: Calle Principal 123, CDMX)"
                                    placeholderTextColor={theme.textSecondary}
                                />
                                {isLoadingAddress && (
                                    <View style={styles.addressLoader}>
                                        <ActivityIndicator size="small" color={theme.primary} />
                                    </View>
                                )}
                            </View>
                            
                            {/* Dropdown de sugerencias - Usando FlatList para mejor rendimiento */}
                            {showAddressSuggestions && addressSuggestions.length > 0 && (
                                <View style={[styles.suggestionsContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                    <FlatList
                                        data={addressSuggestions}
                                        keyExtractor={(item, index) => `suggestion-${index}-${item.display_name}`}
                                        renderItem={({ item, index }) => {
                                            const formatted = formatAddressSuggestion(item);
                                            return (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.suggestionItem, 
                                                        { 
                                                            borderBottomColor: index < addressSuggestions.length - 1 ? theme.border : 'transparent',
                                                            backgroundColor: theme.card,
                                                        }
                                                    ]}
                                                    onPress={() => {
                                                        console.log('[EditLeadModal] ✅ Sugerencia seleccionada:', formatted);
                                                        handleSelectAddressSuggestion(item);
                                                    }}
                                                    activeOpacity={0.7}
                                                >
                                                    <Ionicons name="location" size={18} color={theme.primary} style={styles.suggestionIcon} />
                                                    <Text variant="body" style={[styles.suggestionText, { color: theme.text }]} numberOfLines={2}>
                                                        {formatted || item.display_name}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        }}
                                        keyboardShouldPersistTaps="handled"
                                        nestedScrollEnabled={true}
                                        style={styles.suggestionsList}
                                        scrollEnabled={addressSuggestions.length > 3}
                                    />
                                </View>
                            )}
                            
                            {/* Debug info - solo en desarrollo */}
                            {__DEV__ && (
                                <View style={{ marginTop: 8, padding: 8, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
                                    <Text variant="caption" style={{ color: 'gray', fontSize: 10 }}>
                                        Debug: {addressSuggestions.length} sugerencias | Mostrar: {showAddressSuggestions ? 'SÍ' : 'NO'} | Cargando: {isLoadingAddress ? 'SÍ' : 'NO'}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Fotos */}
                        <View style={styles.field}>
                            <Text variant="body" weight="medium" style={styles.label}>
                                Galería de fotos (opcional)
                            </Text>
                            <Text variant="caption" color={theme.textSecondary} style={styles.helpText}>
                                Sube evidencia del problema o avances del servicio (máximo 10 fotos, 10MB por archivo).
                            </Text>

                            {/* Grid de fotos */}
                            {photos.length > 0 && (
                                <View style={styles.photosGrid}>
                                    {photos.map((url, index) => (
                                        <View key={index} style={styles.photoContainer}>
                                            <Image source={{ uri: url }} style={styles.photo} />
                                            <TouchableOpacity
                                                style={styles.removePhotoButton}
                                                onPress={() => handleRemovePhoto(url)}
                                            >
                                                <Ionicons name="close-circle" size={24} color="red" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Botón agregar fotos */}
                            <TouchableOpacity
                                style={[styles.addPhotoButton, { borderColor: theme.primary }]}
                                onPress={handlePickImage}
                                disabled={isUploading || photos.length >= 10}
                            >
                                {isUploading ? (
                                    <ActivityIndicator size="small" color={theme.primary} />
                                ) : (
                                    <>
                                        <Ionicons name="add" size={20} color={theme.primary} />
                                        <Text variant="body" style={{ color: theme.primary, marginLeft: 8 }}>
                                            Agregar fotos
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {uploadError && (
                                <Text variant="caption" style={{ color: 'red', marginTop: 4 }}>
                                    {uploadError}
                                </Text>
                            )}
                        </View>
                                </ScrollView>

                                {/* Footer con botones */}
                                <View style={[styles.footer, { borderTopColor: theme.border }]}>
                                    <Button
                                        title="Cancelar"
                                        onPress={onClose}
                                        variant="outline"
                                        style={styles.footerButton}
                                    />
                                    <Button
                                        title={isSaving ? 'Guardando...' : 'Guardar cambios'}
                                        onPress={handleSave}
                                        disabled={isSaving || isUploading}
                                        style={styles.footerButton}
                                    />
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    keyboardView: {
        width: '100%',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    closeButton: {
        padding: 4,
    },
    scrollView: {
        flexGrow: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    field: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        minHeight: 100,
    },
    charCount: {
        marginTop: 4,
    },
    helpText: {
        marginTop: 4,
    },
    photosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        marginBottom: 12,
        gap: 12,
    },
    photoContainer: {
        width: 100,
        height: 100,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    removePhotoButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'white',
        borderRadius: 12,
    },
    addPhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderTopWidth: 1,
        gap: 12,
    },
    footerButton: {
        flex: 1,
    },
    addressInputContainer: {
        position: 'relative',
        zIndex: 1,
    },
    addressLoader: {
        position: 'absolute',
        right: 12,
        top: 12,
        zIndex: 2,
    },
    suggestionsContainer: {
        marginTop: 4,
        borderRadius: 12,
        borderWidth: 1,
        maxHeight: 200,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        overflow: 'hidden',
    },
    suggestionsList: {
        maxHeight: 200,
        flexGrow: 0,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        minHeight: 50,
    },
    suggestionIcon: {
        marginRight: 12,
        flexShrink: 0,
    },
    suggestionText: {
        flex: 1,
        fontSize: 15,
    },
});

