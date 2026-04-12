import { supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';

export type PaymentMethod = 'cash' | 'debit' | 'credit';

export interface PaymentPreference {
    userId: string;
    preferredMethod: PaymentMethod;
    lastUsed: string;
    usageCount: Record<PaymentMethod, number>;
}

const PREFERENCE_STORAGE_KEY = 'sumee_payment_preference';
const PREFERENCE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días

/**
 * Servicio para manejar preferencias de pago del usuario
 */
export class PaymentPreferenceService {
    /**
     * Obtener método de pago preferido del usuario
     */
    static async getPreferredPaymentMethod(userId: string): Promise<PaymentMethod | null> {
        try {
            // Intentar obtener de cache local primero
            const cached = await this.getCachedPreference(userId);
            if (cached) {
                console.log('[PaymentPreference] ✅ Using cached preference:', cached.preferredMethod);
                return cached.preferredMethod;
            }

            // Obtener de base de datos (tabla profiles o user_preferences)
            // Manejar el caso donde la columna no existe aún
            const { data, error } = await supabase
                .from('profiles')
                .select('payment_preference')
                .eq('user_id', userId)
                .single();

            if (error) {
                // Si la columna no existe, no es crítico - solo usar cache local
                if (error.code === '42703' || error.message?.includes('does not exist')) {
                    console.log('[PaymentPreference] ℹ️ Column payment_preference does not exist yet. Run SCHEMA_PAYMENT_PREFERENCE.sql');
                    return null;
                }
                console.warn('[PaymentPreference] ⚠️ Error fetching preference:', error);
                return null;
            }

            if (data?.payment_preference) {
                const method = data.payment_preference as PaymentMethod;
                // Guardar en cache
                await this.saveCachedPreference(userId, method);
                return method;
            }

            return null;
        } catch (error) {
            console.error('[PaymentPreference] Error getting preference:', error);
            return null;
        }
    }

    /**
     * Guardar método de pago preferido
     */
    static async savePreferredPaymentMethod(
        userId: string,
        method: PaymentMethod
    ): Promise<boolean> {
        try {
            // Guardar en base de datos (si la columna existe)
            const { error } = await supabase
                .from('profiles')
                .update({
                    payment_preference: method,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId);

            if (error) {
                // Si la columna no existe, solo guardar en cache local
                if (error.code === '42703' || error.message?.includes('does not exist')) {
                    console.log('[PaymentPreference] ℹ️ Column does not exist, saving only to cache. Run SCHEMA_PAYMENT_PREFERENCE.sql');
                    // Continuar para guardar en cache
                } else {
                    console.error('[PaymentPreference] Error saving preference:', error);
                    // Aún así guardar en cache local
                }
            } else {
                console.log('[PaymentPreference] ✅ Preference saved to database:', method);
            }

            // Siempre guardar en cache local (funciona aunque la columna no exista)
            await this.saveCachedPreference(userId, method);

            return true;
        } catch (error) {
            console.error('[PaymentPreference] Error saving preference:', error);
            // Intentar guardar en cache local como fallback
            try {
                await this.saveCachedPreference(userId, method);
                return true;
            } catch (cacheError) {
                console.error('[PaymentPreference] Error saving to cache:', cacheError);
                return false;
            }
        }
    }

    /**
     * Obtener preferencia desde cache local
     */
    private static async getCachedPreference(userId: string): Promise<PaymentPreference | null> {
        try {
            // Sanitizar userId para SecureStore (solo alfanuméricos, puntos, guiones y guiones bajos)
            const sanitizedUserId = userId.replace(/[^a-zA-Z0-9._-]/g, '_');
            const key = `${PREFERENCE_STORAGE_KEY}_${sanitizedUserId}`;
            const cached = await SecureStore.getItemAsync(key);
            if (!cached) return null;

            const preference: PaymentPreference = JSON.parse(cached);
            const now = Date.now();
            const cachedTime = new Date(preference.lastUsed).getTime();

            // Verificar si el cache es válido (menos de 7 días)
            if (now - cachedTime > PREFERENCE_CACHE_DURATION) {
                try {
                    await SecureStore.deleteItemAsync(key);
                } catch (deleteError) {
                    // Ignorar errores al eliminar
                }
                return null;
            }

            return preference;
        } catch (error) {
            console.error('[PaymentPreference] Error reading cache:', error);
            return null;
        }
    }

    /**
     * Guardar preferencia en cache local
     */
    private static async saveCachedPreference(
        userId: string,
        method: PaymentMethod
    ): Promise<void> {
        try {
            // Sanitizar userId para SecureStore
            const sanitizedUserId = userId.replace(/[^a-zA-Z0-9._-]/g, '_');
            const key = `${PREFERENCE_STORAGE_KEY}_${sanitizedUserId}`;
            const existing = await this.getCachedPreference(userId);

            const prev = existing?.usageCount;
            const usageCount: Record<PaymentMethod, number> = {
                cash: prev?.cash ?? 0,
                debit: prev?.debit ?? 0,
                credit: prev?.credit ?? 0,
            };
            usageCount[method] = usageCount[method] + 1;

            const preference: PaymentPreference = {
                userId,
                preferredMethod: method,
                lastUsed: new Date().toISOString(),
                usageCount,
            };

            await SecureStore.setItemAsync(key, JSON.stringify(preference));
        } catch (error) {
            console.error('[PaymentPreference] Error saving cache:', error);
        }
    }

    /**
     * Sugerir método de pago contextual según servicio y urgencia
     */
    static suggestPaymentMethod(
        servicePrice: number,
        isUrgent: boolean,
        preferredMethod?: PaymentMethod | null
    ): PaymentMethod {
        // Si hay método preferido y es válido, usarlo
        if (preferredMethod) {
            console.log('[PaymentPreference] Using preferred method:', preferredMethod);
            return preferredMethod;
        }

        // Lógica contextual
        if (isUrgent) {
            // Urgencia → tarjeta (pago inmediato)
            console.log('[PaymentPreference] Urgent service → suggesting credit card');
            return 'credit';
        }

        if (servicePrice > 5000) {
            // Alto valor → tarjeta (seguridad)
            console.log('[PaymentPreference] High value service → suggesting credit card');
            return 'credit';
        }

        if (servicePrice > 2000) {
            // Valor medio → débito (balance)
            console.log('[PaymentPreference] Medium value service → suggesting debit card');
            return 'debit';
        }

        // Default → efectivo
        console.log('[PaymentPreference] Default → suggesting cash');
        return 'cash';
    }

    /**
     * Obtener estadísticas de uso de métodos de pago
     */
    static async getPaymentMethodStats(userId: string): Promise<Record<PaymentMethod, number>> {
        try {
            const cached = await this.getCachedPreference(userId);
            return cached?.usageCount || {
                cash: 0,
                debit: 0,
                credit: 0,
            };
        } catch (error) {
            console.error('[PaymentPreference] Error getting stats:', error);
            // Retornar valores por defecto en caso de error
            return {
                cash: 0,
                debit: 0,
                credit: 0,
            };
        }
    }
}
