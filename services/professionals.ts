import { supabase } from '@/lib/supabase';
import { resolveAvatarUrl } from '@/utils/avatar';

/**
 * Professionals Service - Gestión de profesionales destacados
 * Alineado con sumeeapp.com/tecnicos
 * Implementa ranking inteligente y filtrado avanzado
 */

export interface FeaturedProfessional {
    user_id: string;
    full_name: string;
    avatar_url?: string | null;
    profession?: string | null;
    calificacion_promedio: number;
    review_count?: number | null;
    distance?: number; // km desde usuario
    areas_servicio?: string[] | null;
    experience?: number | null;
    disponibilidad?: 'disponible' | 'no_disponible' | 'ocupado' | null;
    whatsapp?: string | null;
    verified: boolean; // Basado en verificaciones
    relevance_score?: number; // Score calculado para ranking
    profile_completeness?: number; // Porcentaje de completitud del perfil (0-100)
    created_at?: string;
    updated_at?: string;
    // Campos adicionales para calcular completitud
    bio?: string | null;
    descripcion_perfil?: string | null;
    work_photos_urls?: string | null;
    portfolio?: any[] | null;
    certificaciones_urls?: string[] | null;
    antecedentes_no_penales_url?: string | null;
    numero_imss?: string | null;
    work_zones?: string[] | null;
}

export interface ProfessionalFilters {
    profession?: string;
    specialty?: string;
    maxDistance?: number; // km
    minRating?: number;
    onlyAvailable?: boolean;
    onlyVerified?: boolean;
    onlyComplete?: boolean; // Solo perfiles completos (>80%)
}

export type SortOption = 'hybrid' | 'distance' | 'completeness' | 'rating' | 'experience';

/**
 * Calcular distancia entre dos puntos (Haversine)
 */
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Calcular completitud del perfil (0-100%)
 * Basado en campos críticos e importantes del perfil
 */
function calculateProfileCompleteness(professional: any): number {
    let completedFields = 0;
    let totalFields = 0;

    // Campos críticos (peso 2x) - Solo los que están en el SELECT mínimo
    const criticalFields = [
        { field: 'full_name', value: professional.full_name },
        { field: 'profession', value: professional.profession },
        { field: 'whatsapp', value: professional.whatsapp },
        { field: 'ubicacion_lat', value: professional.ubicacion_lat },
        { field: 'ubicacion_lng', value: professional.ubicacion_lng },
        { field: 'areas_servicio', value: professional.areas_servicio, isArray: true },
        { field: 'work_zones', value: professional.work_zones, isArray: true },
    ];

    // Campos importantes (peso 1x) - Solo verificar si existen (pueden no estar en SELECT)
    const importantFields = [
        { field: 'avatar_url', value: professional.avatar_url },
        { field: 'bio', value: professional.bio },
        { field: 'descripcion_perfil', value: professional.descripcion_perfil },
        { field: 'experience', value: professional.experience },
        { field: 'numero_imss', value: professional.numero_imss },
        { field: 'certificaciones_urls', value: professional.certificaciones_urls, isArray: true },
        { field: 'antecedentes_no_penales_url', value: professional.antecedentes_no_penales_url },
        { field: 'work_photos_urls', value: professional.work_photos_urls },
        { field: 'portfolio', value: professional.portfolio, isArray: true },
    ].filter(field => field.value !== undefined); // Solo verificar campos que existen

    // Verificar campos críticos (peso doble)
    criticalFields.forEach(({ field, value, isArray }) => {
        totalFields += 2; // Peso doble
        if (isArray) {
            if (Array.isArray(value) && value.length > 0) {
                completedFields += 2;
            }
        } else {
            if (value && value !== '' && value !== null && value !== undefined) {
                completedFields += 2;
            }
        }
    });

    // Verificar campos importantes
    importantFields.forEach(({ field, value, isArray }) => {
        totalFields += 1;
        if (isArray) {
            if (Array.isArray(value) && value.length > 0) {
                completedFields += 1;
            }
        } else {
            if (value && value !== '' && value !== null && value !== undefined) {
                completedFields += 1;
            }
        }
    });

    // Calcular porcentaje
    const completeness = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
    return Math.round(completeness);
}

/**
 * Calcular score de cercanía (0-40 puntos)
 * Más cercano = mayor score
 */
function calculateProximityScore(distance: number | undefined): number {
    if (distance === undefined) return 20; // Score neutral si no hay distancia
    
    if (distance <= 1) return 40;      // <1km = 40pts
    if (distance <= 5) return 35;       // 1-5km = 35pts
    if (distance <= 10) return 25;     // 5-10km = 25pts
    if (distance <= 20) return 15;      // 10-20km = 15pts
    return Math.max(0, 10 - (distance / 10)); // >20km = decreciente
}

/**
 * Calcular score de completitud (0-35 puntos)
 */
function calculateCompletenessScore(completeness: number): number {
    return (completeness / 100) * 35;
}

/**
 * Calcular score de calificación (0-15 puntos)
 */
function calculateRatingScore(rating: number): number {
    return (rating / 5) * 15;
}

/**
 * Calcular score de experiencia (0-10 puntos)
 */
function calculateExperienceScore(years: number | null | undefined): number {
    if (!years || years === 0) return 0;
    return Math.min(10, (years / 20) * 10); // 20 años = 10pts
}

/**
 * Calcular score híbrido para ordenamiento
 * Score = (Cercanía × 0.40) + (Completitud × 0.35) + (Calificación × 0.15) + (Experiencia × 0.10)
 */
function calculateHybridScore(professional: FeaturedProfessional): number {
    const proximity = calculateProximityScore(professional.distance);
    const completeness = calculateCompletenessScore(professional.profile_completeness || 0);
    const rating = calculateRatingScore(professional.calificacion_promedio || 0);
    const experience = calculateExperienceScore(professional.experience);
    
    return proximity + completeness + rating + experience;
}

/**
 * Calcular score de relevancia para ranking inteligente (versión legacy)
 * Score = (Completitud × 0.35) + (Calificación × 0.25) + (Proximidad × 0.20) + (Experiencia × 0.05)
 */
function calculateRelevanceScore(
    professional: FeaturedProfessional,
    userLat?: number,
    userLng?: number
): number {
    let score = 0;

    // 1. COMPLETITUD DEL PERFIL (35% - máximo 3.5 puntos)
    const completeness = professional.profile_completeness || 0;
    score += (completeness / 100) * 3.5;

    // 2. Calificación (25% - máximo 2.5 puntos)
    const rating = professional.calificacion_promedio || 0;
    score += (rating / 5) * 2.5;

    // 3. Proximidad (20% - máximo 2.0 puntos)
    if (userLat && userLng && professional.distance !== undefined) {
        const distanceScore = Math.max(0, 2 - (professional.distance / 10));
        score += distanceScore;
    } else {
        score += 1.0;
    }

    // 4. Experiencia (5% - máximo 0.5 puntos)
    const experience = professional.experience || 0;
    const experienceScore = Math.min(0.5, experience / 20);
    score += experienceScore;

    return score;
}

/**
 * Obtener profesionales destacados (versión mejorada con ordenamiento híbrido)
 */
export async function getFeaturedProfessionals(
    userLat?: number,
    userLng?: number,
    limit: number = 10,
    sortBy: SortOption = 'hybrid'
): Promise<FeaturedProfessional[]> {
    try {
        console.log('[ProfessionalsService] 🚀 Fetching featured professionals...');
        console.log('[ProfessionalsService] 📍 User location:', { userLat, userLng });
        console.log('[ProfessionalsService] 🎯 Sort by:', sortBy);

        const minimalSelect = `
            user_id,
            full_name,
            avatar_url,
            profession,
            calificacion_promedio,
            ubicacion_lat,
            ubicacion_lng,
            areas_servicio,
            experience,
            whatsapp,
            role,
            user_type,
            updated_at,
            bio,
            descripcion_perfil,
            work_photos_urls,
            portfolio,
            certificaciones_urls,
            antecedentes_no_penales_url,
            numero_imss,
            work_zones
        `;

        // Query optimizada
        const { data, error } = await supabase
            .from('profiles')
            .select(minimalSelect)
            .eq('role', 'profesional')
            .not('profession', 'is', null)
            .not('profession', 'eq', '')
            .neq('user_type', 'client')
            .limit(100); // Obtener más para ordenar después

        if (error) {
            console.error('[ProfessionalsService] ❌ Error:', error);
            return [];
        }

        if (!data || data.length === 0) {
            console.warn('[ProfessionalsService] ⚠️ No professionals found');
            return [];
        }

        console.log(`[ProfessionalsService] ✅ Found ${data.length} professionals`);

        // Procesar y ordenar
        const professionals = processProfessionalsData(data, userLat, userLng, limit, sortBy);
        
        console.log(`[ProfessionalsService] 🎯 Processed ${professionals.length} professionals`);
        
        return professionals;
    } catch (error) {
        console.error('[ProfessionalsService] 💥 Exception:', error);
        return [];
    }
}

/**
 * Obtener todos los profesionales con ordenamiento avanzado
 * Para la pantalla "Ver todos"
 */
export async function getAllProfessionals(
    userLat?: number,
    userLng?: number,
    filters?: ProfessionalFilters,
    sortBy: SortOption = 'hybrid',
    limit: number = 50
): Promise<FeaturedProfessional[]> {
    try {
        console.log('[ProfessionalsService] 🚀 Fetching all professionals...');
        console.log('[ProfessionalsService] 📍 User location:', { userLat, userLng });
        console.log('[ProfessionalsService] 🔍 Filters:', filters);
        console.log('[ProfessionalsService] 🎯 Sort by:', sortBy);

        let query = supabase
            .from('profiles')
            .select(`
                user_id,
                full_name,
                avatar_url,
                profession,
                calificacion_promedio,
                ubicacion_lat,
                ubicacion_lng,
                areas_servicio,
                experience,
                whatsapp,
                role,
                user_type,
                updated_at,
                bio,
                descripcion_perfil,
                work_photos_urls,
                portfolio,
                certificaciones_urls,
                antecedentes_no_penales_url,
                numero_imss,
                work_zones
            `)
            .eq('role', 'profesional')
            .not('profession', 'is', null)
            .not('profession', 'eq', '')
            .neq('user_type', 'client');

        // Aplicar filtros
        if (filters?.profession) {
            query = query.ilike('profession', `%${filters.profession}%`);
        }

        if (filters?.minRating) {
            query = query.gte('calificacion_promedio', filters.minRating);
        }

        const { data, error } = await query.limit(200); // Más resultados para filtrar/ordenar

        if (error) {
            console.error('[ProfessionalsService] ❌ Error:', error);
            return [];
        }

        if (!data || data.length === 0) {
            console.warn('[ProfessionalsService] ⚠️ No professionals found');
            return [];
        }

        console.log(`[ProfessionalsService] ✅ Found ${data.length} professionals`);

        // Procesar datos
        let professionals = processProfessionalsData(data, userLat, userLng, 200, sortBy);

        // Aplicar filtros adicionales en memoria
        if (filters?.maxDistance && userLat && userLng) {
            professionals = professionals.filter(p => 
                p.distance !== undefined && p.distance <= filters.maxDistance!
            );
        }

        if (filters?.onlyComplete) {
            professionals = professionals.filter(p => 
                (p.profile_completeness || 0) >= 80
            );
        }

        if (filters?.onlyVerified) {
            professionals = professionals.filter(p => p.verified);
        }

        // Limitar resultados finales
        professionals = professionals.slice(0, limit);

        console.log(`[ProfessionalsService] 🎯 Final result: ${professionals.length} professionals`);
        
        return professionals;
    } catch (error) {
        console.error('[ProfessionalsService] 💥 Exception:', error);
        return [];
    }
}

/**
 * Procesar datos de profesionales y calcular scores
 */
function processProfessionalsData(
    data: any[],
    userLat?: number,
    userLng?: number,
    limit: number = 10,
    sortBy: SortOption = 'hybrid'
): FeaturedProfessional[] {
    // Filtrar solo profesionales
    const onlyProfessionals = data.filter((prof: any) => {
        const isProfessional = prof.role === 'profesional' || prof.role === 'professional';
        const isNotClient = prof.user_type !== 'client' && prof.role !== 'client';
        const hasProfession = prof.profession && prof.profession.trim() !== '';
        
        return isProfessional && isNotClient && hasProfession;
    });

    console.log(`[ProfessionalsService] 🔍 Filtered: ${data.length} -> ${onlyProfessionals.length} professionals`);

    // Calcular distancia, completitud y scores
    const professionalsWithScore: FeaturedProfessional[] = onlyProfessionals.map((prof: any) => {
        let distance: number | undefined;

        // Calcular distancia
        if (userLat && userLng && prof.ubicacion_lat && prof.ubicacion_lng) {
            distance = calculateDistance(
                userLat,
                userLng,
                prof.ubicacion_lat,
                prof.ubicacion_lng
            );
        }

        // Calcular completitud
        const profileCompleteness = calculateProfileCompleteness(prof);

        // Resolver avatar URL
        const resolvedAvatarUrl = resolveAvatarUrl(
            prof.avatar_url,
            prof.updated_at
        );

        const professional: FeaturedProfessional = {
            user_id: prof.user_id,
            full_name: prof.full_name || 'Profesional',
            avatar_url: resolvedAvatarUrl,
            updated_at: prof.updated_at,
            profession: prof.profession,
            calificacion_promedio: prof.calificacion_promedio || 0,
            review_count: 0, // No existe en BD
            distance,
            areas_servicio: prof.areas_servicio || [],
            experience: prof.experience || 0,
            disponibilidad: null, // Columna no existe
            whatsapp: prof.whatsapp,
            verified: Boolean(prof.numero_imss || prof.certificaciones_urls?.length),
            profile_completeness: profileCompleteness,
            created_at: prof.created_at,
            bio: prof.bio,
            descripcion_perfil: prof.descripcion_perfil,
            work_photos_urls: prof.work_photos_urls,
            portfolio: prof.portfolio,
            certificaciones_urls: prof.certificaciones_urls,
            antecedentes_no_penales_url: prof.antecedentes_no_penales_url,
            numero_imss: prof.numero_imss,
            work_zones: prof.work_zones,
        };

        // Calcular scores
        professional.relevance_score = calculateRelevanceScore(professional, userLat, userLng);
        
        // Calcular score híbrido (nuevo)
        const hybridScore = calculateHybridScore(professional);
        (professional as any).hybrid_score = hybridScore;

        return professional;
    });

    // Ordenar según sortBy
    let sorted: FeaturedProfessional[];
    
    switch (sortBy) {
        case 'hybrid':
            // Ordenar por score híbrido (descendente), luego por distancia (ascendente)
            sorted = professionalsWithScore.sort((a, b) => {
                const scoreA = (a as any).hybrid_score || 0;
                const scoreB = (b as any).hybrid_score || 0;
                
                if (Math.abs(scoreA - scoreB) < 0.01) {
                    // Desempate por distancia
                    const distA = a.distance ?? Infinity;
                    const distB = b.distance ?? Infinity;
                    return distA - distB;
                }
                
                return scoreB - scoreA;
            });
            break;
            
        case 'distance':
            // Ordenar por distancia (ascendente), luego por completitud (descendente)
            sorted = professionalsWithScore.sort((a, b) => {
                const distA = a.distance ?? Infinity;
                const distB = b.distance ?? Infinity;
                
                if (Math.abs(distA - distB) < 0.1) {
                    // Desempate por completitud
                    const compA = a.profile_completeness || 0;
                    const compB = b.profile_completeness || 0;
                    return compB - compA;
                }
                
                return distA - distB;
            });
            break;
            
        case 'completeness':
            // Ordenar por completitud (descendente), luego por distancia (ascendente)
            sorted = professionalsWithScore.sort((a, b) => {
                const compA = a.profile_completeness || 0;
                const compB = b.profile_completeness || 0;
                
                if (compA === compB) {
                    // Desempate por distancia
                    const distA = a.distance ?? Infinity;
                    const distB = b.distance ?? Infinity;
                    return distA - distB;
                }
                
                return compB - compA;
            });
            break;
            
        case 'rating':
            // Ordenar por calificación (descendente), luego por distancia (ascendente)
            sorted = professionalsWithScore.sort((a, b) => {
                const ratingA = a.calificacion_promedio || 0;
                const ratingB = b.calificacion_promedio || 0;
                
                if (ratingA === ratingB) {
                    const distA = a.distance ?? Infinity;
                    const distB = b.distance ?? Infinity;
                    return distA - distB;
                }
                
                return ratingB - ratingA;
            });
            break;
            
        case 'experience':
            // Ordenar por experiencia (descendente), luego por distancia (ascendente)
            sorted = professionalsWithScore.sort((a, b) => {
                const expA = a.experience || 0;
                const expB = b.experience || 0;
                
                if (expA === expB) {
                    const distA = a.distance ?? Infinity;
                    const distB = b.distance ?? Infinity;
                    return distA - distB;
                }
                
                return expB - expA;
            });
            break;
            
        default:
            sorted = professionalsWithScore;
    }

    // Limitar resultados
    return sorted.slice(0, limit);
}

/**
 * Buscar profesionales por texto
 */
export async function searchProfessionals(
    query: string,
    userLat?: number,
    userLng?: number,
    filters?: ProfessionalFilters
): Promise<FeaturedProfessional[]> {
    try {
        let supabaseQuery = supabase
            .from('profiles')
            .select('*')
            .eq('role', 'profesional')
            .neq('user_type', 'client')
            .or(`full_name.ilike.%${query}%,profession.ilike.%${query}%`);

        const { data, error } = await supabaseQuery.limit(50);

        if (error) {
            console.error('[ProfessionalsService] Search error:', error);
            return [];
        }

        return processProfessionalsData(data || [], userLat, userLng, 50, 'hybrid');
    } catch (error) {
        console.error('[ProfessionalsService] Search exception:', error);
        return [];
    }
}

/**
 * Formatear distancia para mostrar
 */
export function formatDistance(distance?: number): string {
    if (distance === undefined || distance === null) {
        return 'Distancia no disponible';
    }
    
    if (distance < 1) {
        return `${Math.round(distance * 1000)}m`;
    } else if (distance < 10) {
        return `${distance.toFixed(1)}km`;
    } else {
        return `${Math.round(distance)}km`;
    }
}
