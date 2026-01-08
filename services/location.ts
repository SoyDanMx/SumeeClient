import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';

/**
 * Location Service - Gestión de ubicación del cliente
 * Obtiene ubicación actual, hace reverse geocoding y guarda en perfil
 */

export interface LocationData {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    district?: string;
}

export class LocationService {
    /**
     * Solicitar permisos de ubicación
     */
    static async requestPermissions(): Promise<boolean> {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('[LocationService] Error requesting permissions:', error);
            return false;
        }
    }

    /**
     * Obtener ubicación actual del dispositivo
     */
    static async getCurrentLocation(): Promise<LocationData | null> {
        try {
            // Solicitar permisos
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                console.warn('[LocationService] Location permission denied');
                return null;
            }

            // Obtener ubicación
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeout: 15000,
            });

            const { latitude, longitude } = location.coords;

            // Hacer reverse geocoding para obtener dirección
            let addressData: LocationData = {
                latitude,
                longitude,
            };

            try {
                const [reverseGeocode] = await Location.reverseGeocodeAsync({
                    latitude,
                    longitude,
                });

                if (reverseGeocode) {
                    // Construir dirección legible
                    const addressParts = [
                        reverseGeocode.street,
                        reverseGeocode.name,
                        reverseGeocode.district,
                    ].filter(Boolean);

                    addressData.address = addressParts.join(', ') || undefined;
                    addressData.city = reverseGeocode.city || undefined;
                    addressData.state = reverseGeocode.region || undefined;
                    addressData.zipCode = reverseGeocode.postalCode || undefined;
                    addressData.district = reverseGeocode.district || reverseGeocode.subregion || undefined;
                }
            } catch (geoError) {
                console.warn('[LocationService] Reverse geocoding failed:', geoError);
                // Continuar sin dirección, pero con coordenadas
            }

            return addressData;
        } catch (error) {
            console.error('[LocationService] Error getting location:', error);
            return null;
        }
    }

    /**
     * Guardar ubicación en el perfil del usuario
     */
    static async saveLocationToProfile(
        userId: string,
        location: LocationData
    ): Promise<boolean> {
        try {
            // Construir objeto de actualización solo con campos que existen
            // NOTA: postal_code no se incluye porque puede no existir en la BD
            const updateData: any = {
                ubicacion_lat: location.latitude,
                ubicacion_lng: location.longitude,
                updated_at: new Date().toISOString(),
            };

            // Agregar campos opcionales solo si existen en la BD
            if (location.city) updateData.city = location.city;
            if (location.state) updateData.state = location.state;
            // sub_city_zone NO se incluye porque la columna puede no existir
            // Si necesitas sub_city_zone, agrega la columna a la tabla profiles primero
            // if (location.district) updateData.sub_city_zone = location.district;
            // postal_code NO se incluye porque la columna puede no existir
            // Si necesitas postal_code, agrega la columna a la tabla profiles primero

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('user_id', userId);

            if (error) {
                console.error('[LocationService] Error saving location:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('[LocationService] Error saving location:', error);
            return false;
        }
    }

    /**
     * Obtener ubicación guardada del perfil
     */
    static async getSavedLocation(userId: string): Promise<LocationData | null> {
        try {
            // Seleccionar solo columnas que existen
            const { data, error } = await supabase
                .from('profiles')
                .select('ubicacion_lat, ubicacion_lng, city, state')
                .eq('user_id', userId)
                .single();

            if (error || !data) {
                return null;
            }

            if (!data.ubicacion_lat || !data.ubicacion_lng) {
                return null;
            }

            return {
                latitude: data.ubicacion_lat,
                longitude: data.ubicacion_lng,
                city: data.city || undefined,
                state: data.state || undefined,
                // district: data.sub_city_zone || undefined, // Columna no existe
                district: undefined,
                zipCode: undefined, // No usar postal_code si no está disponible
            };
        } catch (error) {
            console.error('[LocationService] Error getting saved location:', error);
            return null;
        }
    }

    /**
     * Formatear ubicación para mostrar en UI
     */
    static formatLocationForDisplay(location: LocationData | null): string {
        if (!location) {
            return 'Ubicación no disponible';
        }

        // Prioridad: district > city > state
        if (location.district) {
            return `${location.district}, ${location.city || location.state || 'CDMX'}`;
        }

        if (location.city) {
            return `${location.city}, ${location.state || 'CDMX'}`;
        }

        if (location.address) {
            return location.address;
        }

        return 'Ubicación actual';
    }

    /**
     * Obtener y guardar ubicación actual
     */
    static async getAndSaveLocation(userId: string): Promise<LocationData | null> {
        try {
            const location = await this.getCurrentLocation();
            if (!location) {
                return null;
            }

            // Guardar en perfil
            await this.saveLocationToProfile(userId, location);

            return location;
        } catch (error) {
            console.error('[LocationService] Error getting and saving location:', error);
            return null;
        }
    }
}

