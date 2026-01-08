/**
 * =========================================================================
 * UTILIDADES AVANZADAS PARA RESOLUCIÓN DE AVATARES
 * =========================================================================
 * 
 * Sistema de vanguardia tecnológica para detectar y renderizar avatares
 * actualizados desde SumeePros, con normalización inteligente de URLs,
 * cache busting automático y fallbacks robustos.
 * 
 * Características:
 * - Detección automática de fotos actualizadas desde app profesional
 * - Normalización de URLs (completas, relativas, paths)
 * - Cache busting basado en timestamp de actualización
 * - Fallbacks inteligentes (default avatar, placeholder)
 * - Compatibilidad con múltiples buckets de Supabase Storage
 */

import { supabaseUrl } from '@/lib/supabase';

/**
 * Buckets públicos conocidos en Supabase Storage
 * Alineado con la configuración real de Supabase
 */
const PUBLIC_BUCKETS = [
    'professional-avatars',      // Fotos de perfil de profesionales (5 MB, imágenes)
    'sumee-expedientes',          // Expedientes completos (50 MB, cualquier tipo)
    'professional-portfolio',     // Portfolio de trabajos (10 MB, imágenes)
    'professional-certificates',  // Certificaciones (5 MB, imágenes/PDF)
    'professional-background-checks', // Antecedentes no penales (5 MB, imágenes/PDF)
    'lead-photos',                // Fotos de leads (10 MB, imágenes)
    'work-photos',                // Fotos de trabajos (50 MB, cualquier tipo)
];

/**
 * Avatar por defecto (placeholder)
 */
export const DEFAULT_AVATAR = 'https://via.placeholder.com/150/6366F1/FFFFFF?text=Sumee';

/**
 * =========================================================================
 * RESOLVER URL DE AVATAR (LÓGICA DE VANGUARDIA)
 * =========================================================================
 * 
 * Resuelve la URL del avatar de un profesional, normalizando diferentes
 * formatos y agregando cache busting para detectar fotos actualizadas.
 * 
 * @param avatarUrl - URL del avatar desde profiles.avatar_url
 * @param updatedAt - Timestamp de última actualización (para cache busting)
 * @returns URL normalizada y lista para usar en <Image>
 * 
 * Estrategia:
 * 1. Si es URL completa (http/https) → usar directamente
 * 2. Si es path relativo → construir URL completa de Supabase Storage
 * 3. Si está en bucket conocido → usar bucket público
 * 4. Si no se puede resolver → usar avatar por defecto
 * 5. Agregar cache busting si hay updatedAt
 */
export function resolveAvatarUrl(
    avatarUrl: string | null | undefined,
    updatedAt?: string | null
): string {
    // Si no hay avatar, usar placeholder
    if (!avatarUrl || avatarUrl.trim() === '') {
        return DEFAULT_AVATAR;
    }

    const trimmedUrl = avatarUrl.trim();

    // 1. Si ya es una URL completa (http/https), usar directamente
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        // Agregar cache busting si hay updatedAt
        if (updatedAt) {
            try {
                const url = new URL(trimmedUrl);
                // Agregar timestamp como query param para cache busting
                url.searchParams.set('t', new Date(updatedAt).getTime().toString());
                return url.toString();
            } catch {
                // Si falla el parsing, usar URL original
                return trimmedUrl;
            }
        }
        return trimmedUrl;
    }

    // 2. Si es un path relativo, normalizar y construir URL completa
    const normalizedPath = trimmedUrl.startsWith('/') 
        ? trimmedUrl.slice(1) 
        : trimmedUrl;

    // 3. Detectar bucket basado en el path
    const bucket = detectBucketFromPath(normalizedPath);
    
    // 4. Construir URL pública de Supabase Storage
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${normalizedPath}`;
    
    // 5. Agregar cache busting si hay updatedAt
    if (updatedAt) {
        try {
            const url = new URL(publicUrl);
            url.searchParams.set('t', new Date(updatedAt).getTime().toString());
            return url.toString();
        } catch {
            return publicUrl;
        }
    }

    return publicUrl;
}

/**
 * =========================================================================
 * DETECTAR BUCKET DESDE PATH
 * =========================================================================
 * 
 * Detecta el bucket de Supabase Storage basado en el path del archivo.
 * Alineado con los buckets reales de Supabase.
 * 
 * @param path - Path del archivo (ej: "user-id/avatar-123.jpg")
 * @returns Nombre del bucket
 * 
 * Estrategia de detección:
 * 1. Buscar palabras clave específicas en el path
 * 2. Verificar si el path contiene el nombre del bucket
 * 3. Por defecto, usar professional-avatars (más común para avatares)
 */
function detectBucketFromPath(path: string): string {
    const lowerPath = path.toLowerCase();
    
    // 1. Detectar professional-avatars (fotos de perfil)
    if (lowerPath.includes('avatar') || 
        lowerPath.includes('professional-avatars') ||
        lowerPath.match(/^[^/]+\/avatar-/)) { // Formato: user-id/avatar-timestamp.jpg
        return 'professional-avatars';
    }
    
    // 2. Detectar sumee-expedientes (expedientes completos)
    // IMPORTANTE: profile_photo se guarda en sumee-expedientes cuando se sube desde expediente
    if (lowerPath.includes('expediente') || 
        lowerPath.includes('sumee-expedientes') ||
        lowerPath.includes('profile_photo') || // Fotos de perfil en expedientes (CASO: Dan Nuno)
        lowerPath.includes('ine_') || // INE front/back en expedientes
        lowerPath.match(/profile_photo_\d+/)) { // Patrón: profile_photo_0_123456.jpg
        return 'sumee-expedientes';
    }
    
    // 3. Detectar professional-portfolio (portfolio de trabajos)
    if (lowerPath.includes('portfolio') || 
        lowerPath.includes('professional-portfolio')) {
        return 'professional-portfolio';
    }
    
    // 4. Detectar professional-certificates (certificaciones)
    if (lowerPath.includes('certificate') || 
        lowerPath.includes('certificacion') ||
        lowerPath.includes('professional-certificates')) {
        return 'professional-certificates';
    }
    
    // 5. Detectar professional-background-checks (antecedentes)
    if (lowerPath.includes('background') || 
        lowerPath.includes('antecedente') ||
        lowerPath.includes('professional-background-checks')) {
        return 'professional-background-checks';
    }
    
    // 6. Detectar lead-photos (fotos de leads)
    if (lowerPath.includes('lead-photo') || 
        lowerPath.includes('lead_photo')) {
        return 'lead-photos';
    }
    
    // 7. Detectar work-photos (fotos de trabajos)
    if (lowerPath.includes('work-photo') || 
        lowerPath.includes('work_photo')) {
        return 'work-photos';
    }
    
    // Por defecto, usar professional-avatars (más común para avatares)
    // Esto es seguro porque professional-avatars es público y acepta imágenes
    return 'professional-avatars';
}

/**
 * =========================================================================
 * VALIDAR URL DE AVATAR
 * =========================================================================
 * 
 * Valida si una URL de avatar es accesible y válida.
 * 
 * @param avatarUrl - URL del avatar a validar
 * @returns true si la URL parece válida
 */
export function isValidAvatarUrl(avatarUrl: string | null | undefined): boolean {
    if (!avatarUrl || avatarUrl.trim() === '') {
        return false;
    }

    const trimmed = avatarUrl.trim();
    
    // URLs completas deben ser http/https
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        try {
            new URL(trimmed);
            return true;
        } catch {
            return false;
        }
    }

    // Paths relativos deben tener al menos un carácter
    return trimmed.length > 0;
}

/**
 * =========================================================================
 * OBTENER AVATAR CON FALLBACK
 * =========================================================================
 * 
 * Obtiene el avatar de un profesional con fallbacks inteligentes.
 * 
 * @param professional - Objeto con avatar_url y updated_at
 * @returns URL del avatar o placeholder
 */
export function getProfessionalAvatar(professional: {
    avatar_url?: string | null;
    updated_at?: string | null;
}): string {
    const avatarUrl = resolveAvatarUrl(
        professional.avatar_url,
        professional.updated_at
    );

    // Si la resolución falló, usar placeholder
    if (!isValidAvatarUrl(avatarUrl) || avatarUrl === DEFAULT_AVATAR) {
        return DEFAULT_AVATAR;
    }

    return avatarUrl;
}

