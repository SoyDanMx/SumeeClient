/**
 * Servicio de Leads para Cliente
 * Maneja la obtención y gestión de solicitudes de servicios del cliente
 * Solución de vanguardia tecnológica con:
 * - Manejo dual de estado (legacy y moderno)
 * - Real-time subscriptions
 * - Logging detallado
 * - Manejo robusto de errores
 */

import { supabase } from '@/lib/supabase';

export interface ClientLead {
    id: string;
    servicio_solicitado?: string | null;
    servicio?: string | null;
    descripcion_proyecto?: string | null;
    status: string;
    estado?: string | null; // Legacy field
    price?: number | null;
    agreed_price?: number | null;
    ubicacion_direccion?: string | null;
    ubicacion_lat?: number | null;
    ubicacion_lng?: number | null;
    professional_id?: string | null;
    profesional_asignado_id?: string | null; // Campo legacy
    created_at: string;
    updated_at: string;
    // Campos adicionales
    nombre_cliente?: string | null;
    whatsapp?: string | null;
    appointment_date?: string | null;
    appointment_time?: string | null;
    appointment_status?: string | null;
}

export class LeadsService {
    /**
     * Normalizar el estado del lead
     * Maneja tanto el campo legacy 'estado' como el moderno 'status'
     */
    private static normalizeStatus(lead: any): string {
        // Si tiene status moderno, usarlo
        if (lead.status) {
            return lead.status.toLowerCase();
        }
        
        // Si no, normalizar desde estado legacy
        if (lead.estado) {
            const estado = lead.estado.toLowerCase();
            const statusMap: Record<string, string> = {
                'nuevo': 'pending',
                'asignado': 'accepted',
                'en progreso': 'accepted',
                'completado': 'completed',
                'cancelado': 'cancelled',
            };
            return statusMap[estado] || 'pending';
        }
        
        return 'pending';
    }

    /**
     * Obtener todos los leads de un cliente
     * Solución de vanguardia: maneja ambos campos de estado y filtra correctamente
     */
    static async getClientLeads(
        clientId: string,
        filter?: 'all' | 'pending' | 'accepted' | 'completed'
    ): Promise<ClientLead[]> {
        try {
            console.log('[LeadsService] Fetching leads for client:', clientId);
            console.log('[LeadsService] Filter:', filter || 'all');

            // Consulta base: obtener todos los leads del cliente
            // EXCLUIR leads cancelados (tanto en estado legacy como moderno)
            let query = supabase
                .from('leads')
                .select('*')
                .eq('cliente_id', clientId)
                // Excluir cancelados: ni 'cancelado' en estado legacy ni 'cancelled' en status moderno
                .neq('estado', 'cancelado')
                .neq('status', 'cancelled')
                .order('updated_at', { ascending: false });

            const { data, error } = await query;

            if (error) {
                console.error('[LeadsService] Error fetching leads:', error);
                throw error;
            }

            console.log('[LeadsService] Raw leads from DB (excluding cancelled):', data?.length || 0);

            if (!data || data.length === 0) {
                console.log('[LeadsService] No leads found for client:', clientId);
                return [];
            }

            // Normalizar estados y filtrar
            let normalizedLeads = data.map(lead => ({
                ...lead,
                status: this.normalizeStatus(lead),
            })) as ClientLead[];

            // Filtrar nuevamente por si acaso (doble verificación)
            normalizedLeads = normalizedLeads.filter(lead => {
                const status = lead.status.toLowerCase();
                return status !== 'cancelled' && lead.estado?.toLowerCase() !== 'cancelado';
            });

            // Aplicar filtro adicional si es necesario
            if (filter && filter !== 'all') {
                normalizedLeads = normalizedLeads.filter(lead => lead.status === filter);
            }

            console.log('[LeadsService] Normalized leads:', normalizedLeads.length);
            console.log('[LeadsService] Leads by status:', {
                pending: normalizedLeads.filter(l => l.status === 'pending').length,
                accepted: normalizedLeads.filter(l => l.status === 'accepted').length,
                completed: normalizedLeads.filter(l => l.status === 'completed').length,
            });

            return normalizedLeads;
        } catch (error: any) {
            console.error('[LeadsService] Error in getClientLeads:', error);
            throw error;
        }
    }

    /**
     * Obtener un lead específico por ID
     */
    static async getLeadById(leadId: string): Promise<ClientLead | null> {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('id', leadId)
                .single();

            if (error) {
                console.error('[LeadsService] Error fetching lead:', error);
                throw error;
            }

            if (!data) return null;

            return {
                ...data,
                status: this.normalizeStatus(data),
            } as ClientLead;
        } catch (error: any) {
            console.error('[LeadsService] Error in getLeadById:', error);
            throw error;
        }
    }

    /**
     * Suscribirse a cambios en tiempo real de leads del cliente
     * Solución de vanguardia: actualizaciones automáticas sin refresh manual
     */
    static subscribeToClientLeads(
        clientId: string,
        callback: (leads: ClientLead[]) => void
    ) {
        console.log('[LeadsService] Subscribing to real-time updates for client:', clientId);

        const channel = supabase
            .channel(`client-leads-${clientId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leads',
                    filter: `cliente_id=eq.${clientId}`,
                },
                async (payload) => {
                    console.log('[LeadsService] Real-time update received:', payload.eventType);
                    // Recargar leads cuando hay cambios
                    const leads = await this.getClientLeads(clientId);
                    callback(leads);
                }
            )
            .subscribe();

        return () => {
            console.log('[LeadsService] Unsubscribing from real-time updates');
            supabase.removeChannel(channel);
        };
    }

    /**
     * Verificar si un lead existe para un cliente
     * Útil para debugging
     */
    static async verifyLeadAccess(clientId: string, leadId: string): Promise<{
        exists: boolean;
        belongsToClient: boolean;
        lead?: ClientLead;
    }> {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('id', leadId)
                .single();

            if (error || !data) {
                return { exists: false, belongsToClient: false };
            }

            const belongsToClient = data.cliente_id === clientId;

            return {
                exists: true,
                belongsToClient,
                lead: {
                    ...data,
                    status: this.normalizeStatus(data),
                } as ClientLead,
            };
        } catch (error: any) {
            console.error('[LeadsService] Error in verifyLeadAccess:', error);
            return { exists: false, belongsToClient: false };
        }
    }

    /**
     * Actualizar un lead
     * Solución de vanguardia: fallback a RPC si RLS falla
     */
    static async updateLead(
        leadId: string,
        data: {
            service: string;
            description: string;
            whatsapp: string;
            address?: string;
            photos: string[];
        }
    ): Promise<ClientLead | null> {
        try {
            console.log('[LeadsService] Updating lead:', leadId);
            
            const updatePayload = {
                servicio_solicitado: data.service.trim() || null,
                descripcion_proyecto: data.description.trim() || null,
                ubicacion_direccion: data.address?.trim() || null,
                whatsapp: data.whatsapp || null,
                photos_urls: data.photos.length > 0 ? data.photos : null,
                updated_at: new Date().toISOString(),
            };

            // Intentar UPDATE directo
            const { data: updatedData, error } = await supabase
                .from('leads')
                .update(updatePayload)
                .eq('id', leadId)
                .select()
                .single();

            if (error) {
                console.error('[LeadsService] Direct update failed:', error);
                
                // Si falla por RLS, intentar con RPC
                if (error.code === '42501' || error.code === 'PGRST301') {
                    console.log('[LeadsService] Falling back to RPC update_lead_details');
                    
                    const { error: rpcError } = await supabase.rpc('update_lead_details', {
                        lead_id: leadId,
                        servicio_solicitado_in: updatePayload.servicio_solicitado,
                        descripcion_proyecto_in: updatePayload.descripcion_proyecto,
                        ubicacion_direccion_in: updatePayload.ubicacion_direccion,
                        whatsapp_in: updatePayload.whatsapp,
                        photos_urls_in: updatePayload.photos_urls,
                    });

                    if (rpcError) {
                        console.error('[LeadsService] RPC update failed:', rpcError);
                        throw rpcError;
                    }

                    // Si RPC tuvo éxito, recargar el lead
                    const reloaded = await this.getLeadById(leadId);
                    return reloaded;
                }

                throw error;
            }

            if (!updatedData) {
                throw new Error('No se pudo actualizar la solicitud');
            }

            return {
                ...updatedData,
                status: this.normalizeStatus(updatedData),
            } as ClientLead;
        } catch (error: any) {
            console.error('[LeadsService] Error in updateLead:', error);
            throw error;
        }
    }

    /**
     * Cancelar un lead
     * Solución de vanguardia: maneja diferentes escenarios según si hay profesional asignado
     */
    static async cancelLead(
        leadId: string,
        clientId: string,
        reason?: string
    ): Promise<void> {
        try {
            console.log('[LeadsService] Cancelling lead:', leadId);

            // Primero, obtener el lead para verificar si tiene profesional asignado
            const lead = await this.getLeadById(leadId);

            if (!lead) {
                throw new Error('Lead no encontrado');
            }

            // Verificar que el lead pertenece al cliente
            const { data: leadData } = await supabase
                .from('leads')
                .select('cliente_id, profesional_asignado_id, professional_id')
                .eq('id', leadId)
                .single();

            if (!leadData || leadData.cliente_id !== clientId) {
                throw new Error('No tienes permisos para cancelar esta solicitud');
            }

            const hasProfessional = !!(leadData.profesional_asignado_id || leadData.professional_id);

            if (hasProfessional) {
                // Si hay profesional asignado, cambiar estado a 'cancelado' (soft delete)
                console.log('[LeadsService] Lead has professional, using soft delete');
                
                const { error } = await supabase
                    .from('leads')
                    .update({
                        estado: 'cancelado',
                        status: 'cancelled',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', leadId)
                    .eq('cliente_id', clientId);

                if (error) {
                    console.error('[LeadsService] Error cancelling lead:', error);
                    throw error;
                }
            } else {
                // Si NO hay profesional asignado, eliminar completamente (hard delete)
                console.log('[LeadsService] Lead has no professional, using hard delete');
                
                const { error } = await supabase
                    .from('leads')
                    .delete()
                    .eq('id', leadId)
                    .eq('cliente_id', clientId);

                if (error) {
                    console.error('[LeadsService] Error deleting lead:', error);
                    throw error;
                }
            }

            console.log('[LeadsService] Lead cancelled successfully');
        } catch (error: any) {
            console.error('[LeadsService] Error in cancelLead:', error);
            throw error;
        }
    }
}

