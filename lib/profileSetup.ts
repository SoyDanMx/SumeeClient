/**
 * Indica si el perfil de cliente aún no tiene zona de servicio guardada
 * (coordenadas o ciudad+estado).
 */
export function profileNeedsServiceArea(profile: Record<string, unknown> | null | undefined): boolean {
    if (!profile) return false;

    const lat = profile.ubicacion_lat;
    const lng = profile.ubicacion_lng;
    const hasCoords =
        lat != null &&
        lng != null &&
        !Number.isNaN(Number(lat)) &&
        !Number.isNaN(Number(lng));

    const hasCityState =
        String(profile.city ?? '').trim().length > 0 && String(profile.state ?? '').trim().length > 0;

    return !hasCoords && !hasCityState;
}

/** Normaliza teléfono MX a E.164 (+52...) si el usuario escribe 10 dígitos */
export function normalizeMexicoPhone(input: string): string | null {
    const digits = input.replace(/\D/g, '');
    if (digits.length === 10) {
        return `+52${digits}`;
    }
    if (digits.length === 12 && digits.startsWith('52')) {
        return `+${digits}`;
    }
    if (input.trim().startsWith('+') && digits.length >= 10) {
        return `+${digits}`;
    }
    return null;
}
