import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Profile Service - Gestión de perfil de cliente
 * Alineado con SumeePros
 */

export interface Address {
    id?: string;
    user_id: string;
    name: string; // "Casa", "Oficina", etc.
    address: string;
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    zip_code?: string;
    is_default: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ProfileUpdate {
    full_name?: string;
    phone?: string;
    whatsapp?: string;
    city?: string;
    state?: string;
    avatar_url?: string;
}

export class ProfileService {
    /**
     * Actualizar perfil del usuario
     */
    static async updateProfile(userId: string, updates: ProfileUpdate) {
        try {
            console.log('[ProfileService] Updating profile for user:', userId);
            console.log('[ProfileService] Updates:', updates);

            // Construir objeto de actualización solo con campos definidos
            const updateData: any = {
                updated_at: new Date().toISOString(),
            };

            // Agregar solo campos que están definidos
            if (updates.full_name !== undefined) updateData.full_name = updates.full_name;
            if (updates.phone !== undefined) updateData.phone = updates.phone;
            if (updates.whatsapp !== undefined) updateData.whatsapp = updates.whatsapp;
            if (updates.city !== undefined) updateData.city = updates.city;
            if (updates.state !== undefined) updateData.state = updates.state;
            if (updates.avatar_url !== undefined) updateData.avatar_url = updates.avatar_url;

            console.log('[ProfileService] Update data:', updateData);

            const { data, error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                console.error('[ProfileService] Supabase error:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                });
                throw error;
            }

            console.log('[ProfileService] ✅ Profile updated successfully:', data);
            return data;
        } catch (error: any) {
            console.error('[ProfileService] Error updating profile:', error);
            throw new Error(error.message || 'No se pudo actualizar el perfil');
        }
    }

    /**
     * Subir foto de perfil
     * Usa el bucket 'professional-avatars' que ya existe y tiene permisos configurados
     * 
     * IMPORTANTE: Usa expo-file-system para leer archivos locales (file:// o content://)
     * porque fetch() no puede leer URIs locales en React Native
     */
    static async uploadAvatar(userId: string, imageUri: string): Promise<string> {
        try {
            console.log('[ProfileService] Uploading avatar for user:', userId);
            console.log('[ProfileService] Image URI:', imageUri);

            // Leer el archivo como base64 usando expo-file-system
            // Usar el mismo método que funciona en SumeePros/app/professional-docs.tsx
            console.log('[ProfileService] Reading file from local URI...');
            const base64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: 'base64' as FileSystem.EncodingType,
            });

            if (!base64) {
                throw new Error('No se pudo leer el archivo de imagen');
            }

            console.log('[ProfileService] ✅ File read successfully, size:', base64.length, 'chars');

            // Determinar extensión del archivo
            const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
            const filePath = fileName;

            console.log('[ProfileService] Uploading to bucket: professional-avatars');
            console.log('[ProfileService] File path:', filePath);
            console.log('[ProfileService] File extension:', fileExt);

            // Convertir base64 a ArrayBuffer para Supabase Storage
            // En React Native, Supabase Storage acepta ArrayBuffer o Uint8Array directamente
            // Este es el método que funciona en otras partes del proyecto (SumeePros)
            console.log('[ProfileService] Converting base64 to ArrayBuffer...');
            
            // Convertir base64 a Uint8Array (método probado en SumeePros)
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Usar el ArrayBuffer del Uint8Array (como en professional-docs.tsx)
            const arrayBuffer = bytes.buffer;

            console.log('[ProfileService] ArrayBuffer created, size:', arrayBuffer.byteLength, 'bytes');

            // Subir a Supabase Storage usando ArrayBuffer
            // Este es el método que funciona en SumeePros/app/professional-docs.tsx
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('professional-avatars')
                .upload(filePath, arrayBuffer, {
                    contentType: `image/${fileExt}`,
                    upsert: true,
                    cacheControl: '3600',
                });

            if (uploadError) {
                console.error('[ProfileService] Upload error:', {
                    code: uploadError.statusCode,
                    message: uploadError.message,
                    error: uploadError,
                });
                throw new Error(`Error al subir la imagen: ${uploadError.message}`);
            }

            console.log('[ProfileService] ✅ File uploaded:', uploadData);

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('professional-avatars')
                .getPublicUrl(filePath);

            console.log('[ProfileService] Public URL:', publicUrl);

            // Guardar solo el path relativo en la BD (no la URL completa)
            // Esto permite que el sistema de resolución funcione correctamente
            const relativePath = filePath;

            // Actualizar perfil con el path relativo
            await this.updateProfile(userId, { avatar_url: relativePath });

            console.log('[ProfileService] ✅ Profile updated with avatar path:', relativePath);

            // Retornar URL completa para mostrar inmediatamente
            return publicUrl;
        } catch (error: any) {
            console.error('[ProfileService] Error uploading avatar:', error);
            console.error('[ProfileService] Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
            });
            throw new Error(error.message || 'No se pudo subir la foto de perfil');
        }
    }

    /**
     * Seleccionar imagen desde galería o cámara
     */
    static async pickImage(): Promise<string | null> {
        try {
            // Importación dinámica para evitar errores si el paquete no está instalado
            const ImagePicker = await import('expo-image-picker');
            
            // Pedir permisos
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Permisos de galería denegados');
            }

            // Abrir selector de imagen
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (result.canceled || !result.assets[0]) {
                return null;
            }

            return result.assets[0].uri;
        } catch (error) {
            console.error('[ProfileService] Error picking image:', error);
            throw error;
        }
    }

    /**
     * Obtener direcciones guardadas del usuario
     */
    static async getAddresses(userId: string): Promise<Address[]> {
        try {
            // Intentar obtener de tabla 'addresses' si existe
            const { data, error } = await supabase
                .from('addresses')
                .select('*')
                .eq('user_id', userId)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) {
                // Si la tabla no existe, retornar array vacío
                if (error.code === '42P01') {
                    console.warn('[ProfileService] Addresses table does not exist');
                    return [];
                }
                throw error;
            }

            return (data as Address[]) || [];
        } catch (error) {
            console.error('[ProfileService] Error getting addresses:', error);
            return [];
        }
    }

    /**
     * Crear nueva dirección
     */
    static async createAddress(address: Omit<Address, 'id' | 'created_at' | 'updated_at'>): Promise<Address> {
        try {
            // Si es la dirección por defecto, desmarcar las demás
            if (address.is_default) {
                await supabase
                    .from('addresses')
                    .update({ is_default: false })
                    .eq('user_id', address.user_id);
            }

            const { data, error } = await supabase
                .from('addresses')
                .insert({
                    ...address,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            return data as Address;
        } catch (error) {
            console.error('[ProfileService] Error creating address:', error);
            throw error;
        }
    }

    /**
     * Actualizar dirección
     */
    static async updateAddress(addressId: string, updates: Partial<Address>): Promise<Address> {
        try {
            // Si se marca como default, desmarcar las demás
            if (updates.is_default) {
                const address = await this.getAddressById(addressId);
                if (address) {
                    await supabase
                        .from('addresses')
                        .update({ is_default: false })
                        .eq('user_id', address.user_id)
                        .neq('id', addressId);
                }
            }

            const { data, error } = await supabase
                .from('addresses')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', addressId)
                .select()
                .single();

            if (error) throw error;
            return data as Address;
        } catch (error) {
            console.error('[ProfileService] Error updating address:', error);
            throw error;
        }
    }

    /**
     * Eliminar dirección
     */
    static async deleteAddress(addressId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('addresses')
                .delete()
                .eq('id', addressId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('[ProfileService] Error deleting address:', error);
            throw error;
        }
    }

    /**
     * Obtener dirección por ID
     */
    static async getAddressById(addressId: string): Promise<Address | null> {
        try {
            const { data, error } = await supabase
                .from('addresses')
                .select('*')
                .eq('id', addressId)
                .single();

            if (error) throw error;
            return data as Address;
        } catch (error) {
            console.error('[ProfileService] Error getting address:', error);
            return null;
        }
    }

    /**
     * Establecer dirección por defecto
     */
    static async setDefaultAddress(userId: string, addressId: string): Promise<boolean> {
        try {
            // Desmarcar todas las direcciones
            await supabase
                .from('addresses')
                .update({ is_default: false })
                .eq('user_id', userId);

            // Marcar la seleccionada como default
            await supabase
                .from('addresses')
                .update({ is_default: true })
                .eq('id', addressId);

            return true;
        } catch (error) {
            console.error('[ProfileService] Error setting default address:', error);
            throw error;
        }
    }
}

