import { supabase } from '@/lib/supabase';
import { EmbeddingService } from './ml/embeddings';

export interface SearchResult {
    id: string;
    type: 'service' | 'professional';
    title: string;
    description?: string;
    image?: string;
    price?: string;
    rating?: number;
    similarity?: number; // Score de similitud semántica (0-1)
    data: any;
}

export class SearchService {
    /**
     * Búsqueda híbrida: combina búsqueda tradicional y semántica
     */
    static async search(query: string, useSemantic: boolean = true): Promise<SearchResult[]> {
        if (!query || query.trim().length === 0) {
            return [];
        }

        const searchTerm = query.trim().toLowerCase();
        const results: SearchResult[] = [];
        const seenIds = new Set<string>();

        try {
            // 1. BÚSQUEDA SEMÁNTICA (si está habilitada y el query es suficientemente largo)
            if (useSemantic && query.trim().length >= 10) {
                try {
                    const semanticResults = await EmbeddingService.findSimilarServices(query, 10);
                    
                    // Obtener detalles completos de los servicios encontrados
                    for (const semantic of semanticResults) {
                        if (semantic.similarity >= 0.3) { // Filtrar similitudes muy bajas
                            const { data: serviceData } = await supabase
                                .from('service_catalog')
                                .select('id, service_name, description, discipline, min_price, is_active')
                                .eq('id', semantic.service_id)
                                .eq('is_active', true)
                                .single();

                            if (serviceData && !seenIds.has(serviceData.id)) {
                                seenIds.add(serviceData.id);
                                results.push({
                                    id: serviceData.id,
                                    type: 'service',
                                    title: serviceData.service_name,
                                    description: serviceData.description || `Servicio de ${serviceData.discipline}`,
                                    price: semantic.min_price?.toString() || serviceData.min_price?.toString(),
                                    similarity: semantic.similarity,
                                    data: {
                                        ...serviceData,
                                        semantic_match: true,
                                    },
                                });
                            }
                        }
                    }
                } catch (semanticError) {
                    console.warn('[SearchService] Semantic search failed, falling back to traditional:', semanticError);
                }
            }

            // 2. BÚSQUEDA TRADICIONAL (solo si no hay suficientes resultados semánticos)
            if (results.length < 5) {
                // Search in services (service_catalog)
                const { data: services, error: servicesError } = await supabase
                    .from('service_catalog')
                    .select('id, service_name, description, discipline, min_price')
                    .eq('is_active', true)
                    .ilike('service_name', `%${searchTerm}%`)
                    .limit(10);

                if (!servicesError && services) {
                    services.forEach((service) => {
                        if (!seenIds.has(service.id)) {
                            seenIds.add(service.id);
                            results.push({
                                id: service.id,
                                type: 'service',
                                title: service.service_name,
                                description: service.description || `Servicio de ${service.discipline}`,
                                price: service.min_price?.toString(),
                                data: {
                                    ...service,
                                    semantic_match: false,
                                },
                            });
                        }
                    });
                }

                // Search in professionals
                const { data: professionals, error: professionalsError } = await supabase
                    .from('profiles')
                    .select(`
                        user_id,
                        full_name,
                        avatar_url,
                        specialties,
                        rating,
                        completed_jobs
                    `)
                    .eq('user_type', 'professional')
                    .or(`full_name.ilike.%${searchTerm}%,specialties.ilike.%${searchTerm}%`)
                    .limit(10);

                if (!professionalsError && professionals) {
                    professionals.forEach((prof) => {
                        if (!seenIds.has(prof.user_id)) {
                            seenIds.add(prof.user_id);
                            results.push({
                                id: prof.user_id,
                                type: 'professional',
                                title: prof.full_name,
                                description: prof.specialties,
                                image: prof.avatar_url,
                                rating: prof.rating,
                                data: prof,
                            });
                        }
                    });
                }
            }

            // 3. Ordenar resultados: semánticos primero (por similitud), luego tradicionales
            results.sort((a, b) => {
                if (a.similarity && b.similarity) {
                    return b.similarity - a.similarity; // Mayor similitud primero
                }
                if (a.similarity) return -1; // Semánticos primero
                if (b.similarity) return 1;
                return 0; // Mantener orden original para tradicionales
            });

            return results.slice(0, 20); // Limitar a 20 resultados
        } catch (error) {
            console.error('[SearchService] Error searching:', error);
            return [];
        }
    }

    /**
     * Get popular searches
     */
    static async getPopularSearches(): Promise<string[]> {
        try {
            const { data, error } = await supabase
                .from('service_categories')
                .select('name')
                .order('popularity', { ascending: false })
                .limit(6);

            if (error) {
                return ['Electricista', 'Plomero', 'Carpintero', 'Pintor', 'Limpieza', 'Climatización'];
            }

            return data.map(item => item.name);
        } catch (error) {
            return ['Electricista', 'Plomero', 'Carpintero', 'Pintor', 'Limpieza', 'Climatización'];
        }
    }
}

