import { supabase } from '@/lib/supabase';
import { validateUUID } from './validation';
import { cache, CacheKeys } from './cache';

export interface Review {
    id: string;
    lead_id: string;
    client_id: string;
    professional_id: string;
    rating: number;
    comment: string;
    created_at: string;
    // Joined fields
    client_name?: string;
    professional_name?: string;
}

export class ReviewsService {
    /**
     * Get reviews for a professional
     */
    static async getProfessionalReviews(professionalId: string): Promise<Review[]> {
        try {
            const validation = validateUUID(professionalId);
            if (!validation.valid) throw new Error('ID de profesional inválido');

            // Cache check
            const cacheKey = `reviews:professional:${professionalId}`;
            const cached = cache.get<Review[]>(cacheKey);
            if (cached) return cached;

            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    *,
                    client:profiles!client_id(full_name)
                `)
                .eq('professional_id', professionalId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const reviews = (data || []).map(r => ({
                ...r,
                client_name: r.client?.full_name || 'Cliente de TulBox'
            }));

            cache.set(cacheKey, reviews, 10 * 60 * 1000); // 10 min cache
            return reviews;
        } catch (error) {
            console.error('[ReviewsService] Error fetching reviews:', error);
            return [];
        }
    }

    /**
     * Create a review for a service
     */
    static async createReview(reviewData: {
        lead_id: string;
        client_id: string;
        professional_id: string;
        rating: number;
        comment: string;
    }): Promise<{ success: boolean; data?: Review; error?: any }> {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .insert([reviewData])
                .select()
                .single();

            if (error) throw error;

            // Invalidate caches
            cache.invalidate(`reviews:professional:${reviewData.professional_id}`);

            return { success: true, data };
        } catch (error: any) {
            console.error('[ReviewsService] Error creating review:', error);
            console.error('[ReviewsService] Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            return { success: false, error: error.message || 'Error desconocido' };
        }
    }

    /**
     * Get review for a specific lead
     */
    static async getReviewByLeadId(leadId: string): Promise<Review | null> {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('lead_id', leadId)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('[ReviewsService] Error fetching review by leadId:', error);
            return null;
        }
    }

    /**
     * Update an existing review
     */
    static async updateReview(reviewId: string, updateData: {
        rating: number;
        comment: string;
    }): Promise<{ success: boolean; data?: Review; error?: any }> {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .update(updateData)
                .eq('id', reviewId)
                .select()
                .single();

            if (error) throw error;

            // Invalidate caches if we have professional_id
            if (data?.professional_id) {
                cache.invalidate(`reviews:professional:${data.professional_id}`);
            }

            return { success: true, data };
        } catch (error: any) {
            console.error('[ReviewsService] Error updating review:', error);
            return { success: false, error: error.message || 'Error al actualizar la reseña' };
        }
    }

    /**
     * Get average rating for a professional
     */
    static async getProfessionalAverageRating(professionalId: string): Promise<number> {
        try {
            const reviews = await this.getProfessionalReviews(professionalId);
            if (reviews.length === 0) return 0;

            const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
            return parseFloat((sum / reviews.length).toFixed(1));
        } catch (error) {
            console.error('[ReviewsService] Error calculating avg rating:', error);
            return 0;
        }
    }
}
