import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { LocationService, LocationData } from './location';

/**
 * Smart Location Service - Servicio mejorado de geolocalización
 * Con fallbacks inteligentes y validación de cobertura
 */

export interface SmartLocationResult {
    location: LocationData;
    source: 'gps' | 'saved' | 'default';
    accuracy: 'high' | 'medium' | 'low';
    address?: string;
}

export class SmartLocationService {
    /**
     * Obtener ubicación con fallbacks inteligentes
     * 1. Intentar GPS real
     * 2. Fallback a ubicación guardada en perfil
     * 3. Fallback a ubicación por defecto (CDMX)
     */
    static async getLocationWithFallback(userId?: string): Promise<SmartLocationResult> {
        console.log('[SmartLocationService] Obteniendo ubicación con fallbacks...');

        // 1. Intentar GPS real
        try {
            const gpsLocation = await LocationService.getCurrentLocation();
            if (gpsLocation && gpsLocation.latitude && gpsLocation.longitude) {
                console.log('[SmartLocationService] ✅ Ubicación GPS obtenida');
                
                // Hacer reverse geocoding para obtener dirección completa
                let address = gpsLocation.address;
                if (!address && gpsLocation.city) {
                    address = `${gpsLocation.city}, ${gpsLocation.state || 'México'}`;
                }

                return {
                    location: gpsLocation,
                    source: 'gps',
                    accuracy: 'high',
                    address: address || this.formatLocation(gpsLocation),
                };
            }
        } catch (error) {
            console.warn('[SmartLocationService] GPS no disponible:', error);
        }

        // 2. Fallback a ubicación guardada en perfil
        if (userId) {
            try {
                const savedLocation = await LocationService.getSavedLocation(userId);
                if (savedLocation && savedLocation.latitude && savedLocation.longitude) {
                    console.log('[SmartLocationService] ✅ Ubicación guardada obtenida');
                    
                    let address = savedLocation.address;
                    if (!address && savedLocation.city) {
                        address = `${savedLocation.city}, ${savedLocation.state || 'México'}`;
                    }

                    return {
                        location: savedLocation,
                        source: 'saved',
                        accuracy: 'medium',
                        address: address || this.formatLocation(savedLocation),
                    };
                }
            } catch (error) {
                console.warn('[SmartLocationService] Ubicación guardada no disponible:', error);
            }
        }

        // 3. Fallback a ubicación por defecto (CDMX)
        console.log('[SmartLocationService] ⚠️ Usando ubicación por defecto (CDMX)');
        const defaultLocation: LocationData = {
            latitude: 19.4326,
            longitude: -99.1332,
            city: 'Ciudad de México',
            state: 'CDMX',
            address: 'Ciudad de México, CDMX',
        };

        return {
            location: defaultLocation,
            source: 'default',
            accuracy: 'low',
            address: 'Ciudad de México, CDMX',
        };
    }

    /**
     * Solicitar permiso de ubicación con explicación clara
     */
    static async requestLocationPermission(): Promise<boolean> {
        try {
            // Verificar si ya tiene permisos
            const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
            if (currentStatus === 'granted') {
                return true;
            }

            // Solicitar permisos
            const { status } = await Location.requestForegroundPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('[SmartLocationService] Error requesting permission:', error);
            return false;
        }
    }

    /**
     * Validar si la ubicación está dentro de la zona de cobertura
     * Por ahora, validamos que esté en México (lat: 14-33, lng: -118 a -86)
     */
    static validateCoverage(location: LocationData): boolean {
        const { latitude, longitude } = location;

        // México: latitud 14-33, longitud -118 a -86
        const isInMexico = 
            latitude >= 14 && latitude <= 33 &&
            longitude >= -118 && longitude <= -86;

        if (!isInMexico) {
            console.warn('[SmartLocationService] ⚠️ Ubicación fuera de zona de cobertura');
        }

        return isInMexico;
    }

    /**
     * Hacer reverse geocoding para obtener dirección completa
     */
    static async reverseGeocode(lat: number, lng: number): Promise<string | null> {
        try {
            const [result] = await Location.reverseGeocodeAsync({
                latitude: lat,
                longitude: lng,
            });

            if (!result) {
                return null;
            }

            // Construir dirección legible
            const parts: string[] = [];
            if (result.street) parts.push(result.street);
            if (result.name && result.name !== result.street) parts.push(result.name);
            if (result.district) parts.push(result.district);
            if (result.city) parts.push(result.city);
            if (result.region) parts.push(result.region);

            return parts.length > 0 ? parts.join(', ') : null;
        } catch (error) {
            console.error('[SmartLocationService] Error in reverse geocoding:', error);
            return null;
        }
    }

    /**
     * Formatear ubicación para mostrar
     */
    static formatLocation(location: LocationData): string {
        if (location.address) {
            return location.address;
        }

        const parts: string[] = [];
        if (location.city) parts.push(location.city);
        if (location.state) parts.push(location.state);

        return parts.length > 0 ? parts.join(', ') : 'Ubicación no disponible';
    }

    /**
     * Obtener y guardar ubicación (con fallbacks)
     */
    static async getAndSaveLocation(userId: string): Promise<SmartLocationResult> {
        const result = await this.getLocationWithFallback(userId);

        // Si la ubicación es de GPS, guardarla en el perfil
        if (result.source === 'gps' && userId) {
            try {
                await LocationService.saveLocationToProfile(userId, result.location);
                console.log('[SmartLocationService] ✅ Ubicación guardada en perfil');
            } catch (error) {
                console.warn('[SmartLocationService] No se pudo guardar ubicación:', error);
            }
        }

        return result;
    }
}

