/**
 * MLTrackingService
 * Servicio para trackear interacciones de ML y feedback del usuario
 * Permite recopilar datos para entrenar y mejorar modelos ML
 */

import { supabase } from '@/lib/supabase';
import { EmbeddingService } from './embeddings';

export interface MLInteraction {
    query: string;
    predicted_service_id?: string;
    predicted_service_name?: string;
    predicted_confidence?: number;
    actual_service_id?: string;
    actual_service_name?: string;
    conversion?: boolean;
    lead_id?: string;
    features?: Record<string, any>;
    user_location?: { lat: number; lng: number };
    user_feedback?: string;
    was_correct?: boolean;
}

export class MLTrackingService {
    /**
     * Trackear una interacción (query del usuario)
     */
    static async trackInteraction(interaction: MLInteraction): Promise<string | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || null;

            // Generar embedding del query (opcional, puede fallar silenciosamente)
            let queryEmbedding: number[] | null = null;
            try {
                queryEmbedding = await EmbeddingService.generateEmbedding(interaction.query);
            } catch (error) {
                console.warn('[MLTracking] Failed to generate query embedding:', error);
                // Continuar sin embedding si falla
            }

            // Obtener contexto temporal
            const now = new Date();
            const timeOfDay = now.getHours();
            const dayOfWeek = now.getDay();

            // Insertar interacción
            const { data, error } = await supabase
                .from('ml_interactions')
                .insert({
                    user_id: userId,
                    query: interaction.query,
                    query_embedding: queryEmbedding ? `[${queryEmbedding.join(',')}]` : null,
                    predicted_service_id: interaction.predicted_service_id || null,
                    predicted_service_name: interaction.predicted_service_name || null,
                    predicted_confidence: interaction.predicted_confidence || null,
                    actual_service_id: interaction.actual_service_id || null,
                    actual_service_name: interaction.actual_service_name || null,
                    conversion: interaction.conversion || false,
                    lead_id: interaction.lead_id || null,
                    features: interaction.features || {},
                    user_location_lat: interaction.user_location?.lat || null,
                    user_location_lng: interaction.user_location?.lng || null,
                    time_of_day: timeOfDay,
                    day_of_week: dayOfWeek,
                })
                .select('id')
                .single();

            if (error) {
                console.error('[MLTracking] Database error:', error);
                throw error;
            }

            console.log('[MLTracking] ✅ Interaction tracked:', data.id);
            return data.id;
        } catch (error) {
            console.error('[MLTracking] ❌ Error tracking interaction:', error);
            // No lanzar error, solo loggear (no queremos romper el flujo del usuario)
            return null;
        }
    }

    /**
     * Actualizar interacción con resultado real (cuando usuario selecciona servicio)
     */
    static async updateInteractionWithResult(
        interactionId: string,
        actualServiceId: string,
        actualServiceName: string,
        leadId?: string
    ): Promise<void> {
        try {
            if (!interactionId) {
                console.warn('[MLTracking] No interactionId provided, skipping update');
                return;
            }

            const { error } = await supabase
                .from('ml_interactions')
                .update({
                    actual_service_id: actualServiceId,
                    actual_service_name: actualServiceName,
                    conversion: true,
                    lead_id: leadId || null,
                })
                .eq('id', interactionId);

            if (error) {
                throw error;
            }

            console.log('[MLTracking] ✅ Interaction updated with result');
        } catch (error) {
            console.error('[MLTracking] ❌ Error updating interaction:', error);
            // No lanzar error, solo loggear
        }
    }

    /**
     * Trackear feedback del usuario
     */
    static async trackFeedback(
        interactionId: string,
        wasCorrect: boolean,
        feedbackText?: string,
        rating?: number,
        correctServiceId?: string,
        correctServiceName?: string
    ): Promise<void> {
        try {
            if (!interactionId) {
                console.warn('[MLTracking] No interactionId provided, skipping feedback');
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || null;

            const { error } = await supabase
                .from('ml_feedback')
                .insert({
                    interaction_id: interactionId,
                    user_id: userId,
                    was_correct: wasCorrect,
                    feedback_text: feedbackText || null,
                    rating: rating || null,
                    correct_service_id: correctServiceId || null,
                    correct_service_name: correctServiceName || null,
                });

            if (error) {
                throw error;
            }

            // También actualizar la interacción original
            await supabase
                .from('ml_interactions')
                .update({
                    was_correct: wasCorrect,
                    user_feedback: feedbackText || null,
                })
                .eq('id', interactionId);

            console.log('[MLTracking] ✅ Feedback tracked');
        } catch (error) {
            console.error('[MLTracking] ❌ Error tracking feedback:', error);
            // No lanzar error, solo loggear
        }
    }

    /**
     * Trackear cuando un usuario hace clic en un servicio sugerido
     */
    static async trackServiceClick(
        serviceId: string,
        serviceName: string,
        query?: string,
        interactionId?: string
    ): Promise<void> {
        try {
            // Si hay una interacción previa, actualizarla
            if (interactionId) {
                await this.updateInteractionWithResult(interactionId, serviceId, serviceName);
            } else {
                // Crear nueva interacción si no existe
                await this.trackInteraction({
                    query: query || serviceName,
                    actual_service_id: serviceId,
                    actual_service_name: serviceName,
                    conversion: true,
                });
            }
        } catch (error) {
            console.error('[MLTracking] ❌ Error tracking service click:', error);
        }
    }
}

