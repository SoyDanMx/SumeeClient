/**
 * Servicio de Autocompletado de Direcciones
 * Usa OpenStreetMap Nominatim (gratuito) para autocompletado de direcciones
 * Similar a Google Maps pero sin necesidad de API key
 */

export interface AddressSuggestion {
    display_name: string;
    lat: string;
    lon: string;
    address?: {
        road?: string;
        house_number?: string;
        suburb?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
    };
}

/**
 * Obtiene sugerencias de direcciones usando OpenStreetMap Nominatim
 * @param query - Texto de búsqueda (mínimo 3 caracteres)
 * @param limit - Número máximo de sugerencias (default: 5)
 * @param options.preferAddresses - Prioriza resultados tipo calle/número (capa `address`)
 * @returns Array de sugerencias de direcciones
 */
export async function getAddressSuggestions(
    query: string,
    limit: number = 5,
    options?: { preferAddresses?: boolean }
): Promise<AddressSuggestion[]> {
    if (!query || query.length < 3) {
        return [];
    }

    const preferAddresses = options?.preferAddresses !== false;

    try {
        console.log('[AddressAutocomplete] Buscando sugerencias para:', query);

        const layer = preferAddresses ? '&layer=address' : '';
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query
        )}&format=json&limit=${limit}&addressdetails=1&countrycodes=mx&accept-language=es&dedupe=1${layer}`;

        console.log('[AddressAutocomplete] URL:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'TulBoxApp/1.0',
                'Accept': 'application/json',
                'Accept-Language': 'es-MX,es;q=0.9',
            },
        });

        console.log('[AddressAutocomplete] Response status:', response.status);

        if (!response.ok) {
            console.warn('[AddressAutocomplete] Nominatim response status:', response.status);
            const errorText = await response.text();
            console.warn('[AddressAutocomplete] Error response:', errorText);
            return [];
        }

        let data: AddressSuggestion[] = await response.json();
        console.log('[AddressAutocomplete] Sugerencias encontradas:', data.length);
        console.log('[AddressAutocomplete] Primera sugerencia:', data[0]?.display_name);

        // Si la capa `address` no devuelve nada (consulta muy corta o zona rural), reintentar sin capa
        if (preferAddresses && (!data || data.length === 0)) {
            const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                query
            )}&format=json&limit=${limit}&addressdetails=1&countrycodes=mx&accept-language=es&dedupe=1`;
            const r2 = await fetch(fallbackUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'TulBoxApp/1.0',
                    Accept: 'application/json',
                    'Accept-Language': 'es-MX,es;q=0.9',
                },
            });
            if (r2.ok) {
                data = await r2.json();
            }
        }

        return data || [];
    } catch (error: any) {
        console.error('[AddressAutocomplete] Error al obtener sugerencias de dirección:', error);
        console.error('[AddressAutocomplete] Error message:', error.message);
        console.error('[AddressAutocomplete] Error stack:', error.stack);
        return [];
    }
}

/**
 * Formatea una sugerencia de dirección para mostrar
 */
export function formatAddressSuggestion(suggestion: AddressSuggestion): string {
    if (suggestion.address) {
        const parts: string[] = [];
        if (suggestion.address.road) {
            if (suggestion.address.house_number) {
                parts.push(`${suggestion.address.road} #${suggestion.address.house_number}`);
            } else {
                parts.push(suggestion.address.road);
            }
        }
        if (suggestion.address.suburb) parts.push(suggestion.address.suburb);
        if (suggestion.address.postcode) parts.push(`C.P. ${suggestion.address.postcode}`);
        if (suggestion.address.city) parts.push(suggestion.address.city);
        if (suggestion.address.state) parts.push(suggestion.address.state);

        if (parts.length > 0) {
            return parts.join(', ');
        }
    }

    return suggestion.display_name;
}

