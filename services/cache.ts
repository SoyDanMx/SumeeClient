/**
 * Cache Service
 * Sistema de cache en memoria para optimizar performance
 * Alineado con TulBoxPros
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

class CacheService {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private defaultTTL: number = 5 * 60 * 1000; // 5 minutos por defecto

    /**
     * Obtener datos del cache
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        // Verificar si expiró
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Guardar datos en cache
     */
    set<T>(key: string, data: T, ttl?: number): void {
        const now = Date.now();
        const expiresAt = now + (ttl || this.defaultTTL);

        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt,
        });
    }

    /**
     * Invalidar entrada del cache
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Invalidar todas las entradas que coincidan con un patrón
     */
    invalidatePattern(pattern: string | RegExp): void {
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Limpiar todo el cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Limpiar entradas expiradas
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Obtener o calcular (con función)
     */
    async getOrSet<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const data = await fetcher();
        this.set(key, data, ttl);
        return data;
    }

    /**
     * Obtener estadísticas del cache
     */
    getStats(): {
        size: number;
        keys: string[];
        entries: Array<{ key: string; age: number; expiresIn: number }>;
    } {
        const now = Date.now();
        const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
            key,
            age: now - entry.timestamp,
            expiresIn: entry.expiresAt - now,
        }));

        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            entries,
        };
    }
}

// Singleton instance
export const cache = new CacheService();

// Limpiar cache expirado cada 5 minutos
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        cache.cleanup();
    }, 5 * 60 * 1000);
}

// Helper functions para keys comunes
export const CacheKeys = {
    leads: (userId?: string) => userId ? `leads:${userId}` : 'leads:all',
    lead: (leadId: string) => `lead:${leadId}`,
    quotes: (leadId?: string) => leadId ? `quotes:${leadId}` : 'quotes:all',
    quote: (quoteId: string) => `quote:${quoteId}`,
    professionals: (serviceId?: string) => serviceId ? `professionals:${serviceId}` : 'professionals:all',
    professional: (professionalId: string) => `professional:${professionalId}`,
    categories: () => 'categories:all',
    services: (categoryId?: string) => categoryId ? `services:${categoryId}` : 'services:all',
    profile: (userId: string) => `profile:${userId}`,
    messages: (conversationId: string) => `messages:${conversationId}`,
};
