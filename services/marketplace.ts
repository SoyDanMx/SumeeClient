/**
 * Marketplace Service
 * Utilidades para navegación y deep linking al marketplace
 */

import { Linking } from 'react-native';
import { router } from 'expo-router';

const MARKETPLACE_BASE_URL = 'https://sumeeapp.com/marketplace';

export interface MarketplaceOptions {
    category?: string;
    productId?: string;
    search?: string;
}

/**
 * Abre el marketplace con opciones de filtrado
 */
export function openMarketplace(options?: MarketplaceOptions) {
    if (!options || Object.keys(options).length === 0) {
        // Abrir marketplace principal
        router.push('/marketplace');
        return;
    }

    // Construir parámetros para deep linking
    const params: Record<string, string> = {};
    
    if (options.category) {
        params.category = options.category;
    }
    
    if (options.search) {
        params.search = options.search;
    }
    
    if (options.productId) {
        params.productId = options.productId;
    }

    // Navegar con parámetros
    router.push({
        pathname: '/marketplace',
        params,
    });
}

/**
 * Abre el marketplace en el navegador externo
 */
export async function openMarketplaceInBrowser(options?: MarketplaceOptions): Promise<boolean> {
    try {
        let url = MARKETPLACE_BASE_URL;
        const params: string[] = [];

        if (options?.productId) {
            url = `${MARKETPLACE_BASE_URL}/product/${options.productId}`;
        } else {
            if (options?.category) {
                params.push(`category=${encodeURIComponent(options.category)}`);
            }
            if (options?.search) {
                params.push(`search=${encodeURIComponent(options.search)}`);
            }
            if (params.length > 0) {
                url += `?${params.join('&')}`;
            }
        }

        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
            console.error('[Marketplace] Cannot open URL:', url);
            return false;
        }

        await Linking.openURL(url);
        return true;
    } catch (error) {
        console.error('[Marketplace] Error opening in browser:', error);
        return false;
    }
}

/**
 * Obtiene la URL del marketplace con parámetros
 */
export function getMarketplaceUrl(options?: MarketplaceOptions): string {
    let url = MARKETPLACE_BASE_URL;
    const params: string[] = [];

    if (options?.productId) {
        return `${MARKETPLACE_BASE_URL}/product/${options.productId}`;
    }

    if (options?.category) {
        params.push(`category=${encodeURIComponent(options.category)}`);
    }
    if (options?.search) {
        params.push(`search=${encodeURIComponent(options.search)}`);
    }

    if (params.length > 0) {
        url += `?${params.join('&')}`;
    }

    return url;
}

/**
 * Categorías del marketplace disponibles
 */
export const MARKETPLACE_CATEGORIES = [
    { id: 'electricidad', name: 'Electricidad', icon: 'flash' },
    { id: 'plomeria', name: 'Plomería', icon: 'water' },
    { id: 'construccion', name: 'Construcción', icon: 'hammer' },
    { id: 'mecanica', name: 'Mecánica', icon: 'car' },
    { id: 'pintura', name: 'Pintura', icon: 'brush' },
    { id: 'jardinería', name: 'Jardinería', icon: 'leaf' },
    { id: 'sistemas', name: 'Sistemas', icon: 'hardware-chip' },
] as const;

/**
 * Tracking de eventos del marketplace
 */
export function trackMarketplaceEvent(event: string, properties?: Record<string, any>) {
    console.log(`[Marketplace Analytics] ${event}`, properties);
    // TODO: Integrar con servicio de analytics (Firebase, Amplitude, etc.)
    // analytics.track(event, properties);
}

