/**
 * Validation Utilities
 * Utilidades para validación de datos de entrada
 * Alineado con TulBoxPros
 */

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ValidationResult {
    valid: boolean;
    error?: {
        code: string;
        message: string;
    };
}

/**
 * Valida formato UUID
 */
export function validateUUID(id: string | null | undefined): ValidationResult {
    if (!id) {
        return {
            valid: false,
            error: {
                code: 'MISSING_ID',
                message: 'ID requerido',
            },
        };
    }

    if (typeof id !== 'string') {
        return {
            valid: false,
            error: {
                code: 'INVALID_ID_TYPE',
                message: 'ID debe ser una cadena de texto',
            },
        };
    }

    if (!UUID_REGEX.test(id)) {
        return {
            valid: false,
            error: {
                code: 'INVALID_UUID_FORMAT',
                message: 'Formato de ID inválido',
            },
        };
    }

    return { valid: true };
}

/**
 * Valida coordenadas de ubicación
 */
export function validateCoordinates(
    latitude: number | null | undefined,
    longitude: number | null | undefined
): ValidationResult {
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
        return {
            valid: false,
            error: {
                code: 'MISSING_COORDINATES',
                message: 'Coordenadas requeridas',
            },
        };
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return {
            valid: false,
            error: {
                code: 'INVALID_COORDINATE_TYPE',
                message: 'Coordenadas deben ser números',
            },
        };
    }

    if (isNaN(latitude) || isNaN(longitude)) {
        return {
            valid: false,
            error: {
                code: 'NAN_COORDINATES',
                message: 'Coordenadas inválidas (NaN)',
            },
        };
    }

    if (latitude < -90 || latitude > 90) {
        return {
            valid: false,
            error: {
                code: 'INVALID_LATITUDE',
                message: 'Latitud debe estar entre -90 y 90',
            },
        };
    }

    if (longitude < -180 || longitude > 180) {
        return {
            valid: false,
            error: {
                code: 'INVALID_LONGITUDE',
                message: 'Longitud debe estar entre -180 y 180',
            },
        };
    }

    return { valid: true };
}

/**
 * Valida estado de trabajo/lead
 */
export function validateJobStatus(
    status: string | null | undefined,
    validStatuses: string[] = ['pending', 'accepted', 'en_camino', 'en_sitio', 'en_progreso', 'completed', 'cancelled']
): ValidationResult {
    if (!status) {
        return {
            valid: false,
            error: {
                code: 'MISSING_STATUS',
                message: 'Estado requerido',
            },
        };
    }

    if (!validStatuses.includes(status)) {
        return {
            valid: false,
            error: {
                code: 'INVALID_STATUS',
                message: `Estado inválido. Estados válidos: ${validStatuses.join(', ')}`,
            },
        };
    }

    return { valid: true };
}

/**
 * Valida número de teléfono
 */
export function validatePhoneNumber(phone: string | null | undefined): ValidationResult {
    if (!phone) {
        return {
            valid: false,
            error: {
                code: 'MISSING_PHONE',
                message: 'Número de teléfono requerido',
            },
        };
    }

    // Remover espacios y caracteres especiales
    const cleanPhone = phone.replace(/\s/g, '').replace(/[^\d+]/g, '');

    // Validar que tenga al menos 10 dígitos
    const digits = cleanPhone.replace(/\D/g, '');
    if (digits.length < 10) {
        return {
            valid: false,
            error: {
                code: 'INVALID_PHONE_LENGTH',
                message: 'Número de teléfono debe tener al menos 10 dígitos',
            },
        };
    }

    return { valid: true };
}

/**
 * Valida precio
 */
export function validatePrice(price: number | null | undefined): ValidationResult {
    if (price === null || price === undefined) {
        return {
            valid: false,
            error: {
                code: 'MISSING_PRICE',
                message: 'Precio requerido',
            },
        };
    }

    if (typeof price !== 'number') {
        return {
            valid: false,
            error: {
                code: 'INVALID_PRICE_TYPE',
                message: 'Precio debe ser un número',
            },
        };
    }

    if (isNaN(price)) {
        return {
            valid: false,
            error: {
                code: 'NAN_PRICE',
                message: 'Precio inválido (NaN)',
            },
        };
    }

    if (price < 0) {
        return {
            valid: false,
            error: {
                code: 'NEGATIVE_PRICE',
                message: 'Precio no puede ser negativo',
            },
        };
    }

    return { valid: true };
}

/**
 * Helper para crear timeout promise
 */
export function createTimeoutPromise(timeoutMs: number, errorMessage: string = 'Operación excedió el tiempo límite'): Promise<never> {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(errorMessage));
        }, timeoutMs);
    });
}

/**
 * Wrapper para agregar timeout a promesas
 * IMPORTANTE: Esta función preserva el formato de respuesta de Supabase { data, error }
 */
export async function withTimeout<T extends { data: any; error: any }>(
    promise: any,
    timeoutMs: number,
    errorMessage?: string
): Promise<T> {
    try {
        return await Promise.race([
            promise,
            createTimeoutPromise(timeoutMs, errorMessage).then(() => {
                // Si el timeout gana, devolver formato Supabase con error
                return {
                    data: null,
                    error: {
                        message: errorMessage || 'Operación excedió el tiempo límite',
                        code: 'TIMEOUT',
                    },
                } as T;
            }),
        ]);
    } catch (error: any) {
        // Si hay un error, devolver formato Supabase
        return {
            data: null,
            error: {
                message: error.message || errorMessage || 'Error en la operación',
                code: error.code || 'UNKNOWN_ERROR',
            },
        } as T;
    }
}
