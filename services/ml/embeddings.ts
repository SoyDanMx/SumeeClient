/**
 * EmbeddingService
 * Servicio para generar y gestionar embeddings vectoriales
 * Usa Supabase Edge Function para generar embeddings con Hugging Face
 */

import { supabase } from '@/lib/supabase';

const EMBEDDING_API_URL = process.env.EXPO_PUBLIC_SUPABASE_URL 
    ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-embedding`
    : 'https://sumeeapp.com/api/generate-embedding';

export interface EmbeddingResult {
    embedding: number[];
    dimensions: number;
    text: string;
    model: string;
}

export class EmbeddingService {
    /**
     * Generar embedding para un texto
     */
    static async generateEmbedding(text: string): Promise<number[]> {
        if (!text || text.trim().length === 0) {
            throw new Error('Text is required to generate embedding');
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            const response = await fetch(EMBEDDING_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
                    ...(session?.access_token && {
                        'Authorization': `Bearer ${session.access_token}`,
                    }),
                },
                body: JSON.stringify({ 
                    text: text.trim(),
                    type: 'query',
                }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('[EmbeddingService] API error:', error);
                throw new Error(`Embedding API error: ${response.status} - ${error.error || 'Unknown error'}`);
            }

            const result: EmbeddingResult = await response.json();
            
            if (!result.embedding || !Array.isArray(result.embedding)) {
                throw new Error('Invalid embedding format received');
            }

            if (result.embedding.length !== 384) {
                console.warn(`[EmbeddingService] Warning: Expected 384 dimensions, got ${result.embedding.length}`);
            }

            return result.embedding;
        } catch (error) {
            console.error('[EmbeddingService] Error generating embedding:', error);
            throw error;
        }
    }

    /**
     * Generar y guardar embedding para un servicio
     */
    static async generateAndSaveServiceEmbedding(
        serviceId: string,
        serviceName: string,
        discipline: string,
        description?: string
    ): Promise<void> {
        try {
            // Generar embedding del nombre, disciplina y descripción del servicio
            const text = [serviceName, discipline, description || '']
                .filter(Boolean)
                .join(' ');
            const embedding = await this.generateEmbedding(text);

            // Supabase con pgvector espera el embedding como array de números directamente
            // El cliente de Supabase lo convertirá automáticamente al tipo vector
            
            // Estructura real de service_embeddings:
            // - id (uuid, auto)
            // - service_id (uuid)
            // - service_name (text)
            // - discipline (text)
            // - embedding (vector(384))
            // - created_at (timestamp, auto)
            // NOTA: No hay updated_at en la tabla

            // Verificar si ya existe
            const { data: existing } = await supabase
                .from('service_embeddings')
                .select('service_id')
                .eq('service_id', serviceId)
                .single();

            const dataToSave = {
                service_id: serviceId,
                service_name: serviceName,
                discipline,
                embedding: embedding, // Array de números directamente
            };

            // Guardar en Supabase (insert o update según exista)
            let error = null;
            if (existing) {
                const { error: updateError } = await supabase
                    .from('service_embeddings')
                    .update(dataToSave)
                    .eq('service_id', serviceId);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('service_embeddings')
                    .insert(dataToSave);
                error = insertError;
            }

            if (error) {
                throw error;
            }

            console.log(`[EmbeddingService] ✅ Embedding saved for service: ${serviceName}`);
        } catch (error) {
            console.error('[EmbeddingService] Error saving service embedding:', error);
            throw error;
        }
    }

    /**
     * Buscar servicios similares usando embeddings
     */
    static async findSimilarServices(
        query: string,
        limit: number = 10,
        discipline?: string
    ): Promise<Array<{
        service_id: string;
        service_name: string;
        discipline: string;
        similarity: number;
        min_price: number;
    }>> {
        try {
            // Generar embedding del query
            const queryEmbedding = await this.generateEmbedding(query);

            // Llamar a función SQL de búsqueda semántica
            // Supabase convertirá automáticamente el array a tipo vector
            const { data, error } = await supabase.rpc('find_similar_services', {
                query_embedding: queryEmbedding, // Array de números directamente
                limit_count: limit,
                discipline_filter: discipline || null,
            });

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('[EmbeddingService] Error finding similar services:', error);
            throw error;
        }
    }

    /**
     * Generar embedding para un usuario (basado en historial)
     */
    static async generateUserEmbedding(userId: string): Promise<number[] | null> {
        try {
            // Obtener historial de servicios del usuario
            const { data: leads, error } = await supabase
                .from('leads')
                .select('servicio_solicitado, servicio, descripcion_proyecto')
                .eq('cliente_id', userId)
                .eq('status', 'completed')
                .limit(20);

            if (error) {
                throw error;
            }

            if (!leads || leads.length === 0) {
                // Usuario nuevo, retornar null
                return null;
            }

            // Construir texto del historial
            const historyText = leads
                .map(lead => `${lead.servicio_solicitado || lead.servicio || ''} ${lead.descripcion_proyecto || ''}`)
                .filter(Boolean)
                .join(' ');

            if (!historyText.trim()) {
                return null;
            }

            // Generar embedding del historial
            const embedding = await this.generateEmbedding(historyText);

            // Guardar en user_features
            await supabase
                .from('user_features')
                .upsert({
                    user_id: userId,
                    embedding: embedding, // Array de números directamente
                    last_updated: new Date().toISOString(),
                }, {
                    onConflict: 'user_id',
                });

            return embedding;
        } catch (error) {
            console.error('[EmbeddingService] Error generating user embedding:', error);
            return null;
        }
    }
}

