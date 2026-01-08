import { supabase } from '@/lib/supabase';

/**
 * Sistema de Agendamiento para Clientes
 * Alineado con SumeePros - Permite ver y gestionar citas agendadas
 */

export interface Appointment {
    id?: string;
    lead_id: string;
    professional_id?: string;
    client_id: string;
    scheduled_date: string; // ISO date string
    scheduled_time: string; // ISO datetime string
    duration?: number; // minutes
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    notes?: string;
    reminder_sent_24h?: boolean;
    reminder_sent_2h?: boolean;
    confirmed_at?: string;
    cancelled_at?: string;
    created_at?: string;
    updated_at?: string;
    // Datos del lead asociado
    service_name?: string;
    professional_name?: string;
    location?: string;
    price?: number;
}

export interface TimeSlot {
    id?: string;
    startTime: string;
    endTime: string;
    duration: number;
    isAvailable: boolean;
    isBooked: boolean;
}

/**
 * Obtener citas de un cliente
 */
export async function getClientAppointments(
    clientId: string,
    startDate: Date,
    endDate: Date
): Promise<Appointment[]> {
    try {
        // Obtener leads con citas agendadas (sin join para evitar errores)
        const { data: leadsData, error: leadsError } = await supabase
            .from('leads')
            .select(`
                id,
                servicio_solicitado,
                servicio,
                ubicacion_direccion,
                agreed_price,
                price,
                appointment_date,
                appointment_time,
                appointment_status,
                professional_id,
                status,
                updated_at
            `)
            .eq('cliente_id', clientId)
            .not('appointment_date', 'is', null)
            .gte('appointment_date', startDate.toISOString().split('T')[0])
            .lte('appointment_date', endDate.toISOString().split('T')[0])
            .order('appointment_date', { ascending: true })
            .order('appointment_time', { ascending: true });

        if (leadsError) {
            console.error('[Scheduling] Error fetching appointments:', leadsError);
            return [];
        }

        if (!leadsData || leadsData.length === 0) return [];

        // Obtener perfiles de profesionales si hay alguno
        const professionalIds = leadsData
            .filter(lead => lead.professional_id)
            .map(lead => lead.professional_id)
            .filter((id, index, self) => self.indexOf(id) === index) as string[];

        let profilesMap: Record<string, { full_name: string }> = {};
        
        if (professionalIds.length > 0) {
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('user_id, full_name')
                .in('user_id', professionalIds);

            if (profilesData) {
                profilesMap = profilesData.reduce((acc, profile) => {
                    acc[profile.user_id] = { full_name: profile.full_name };
                    return acc;
                }, {} as Record<string, { full_name: string }>);
            }
        }

        // Mapear a formato Appointment
        return leadsData.map((lead: any) => {
            const appointmentDate = lead.appointment_date;
            const appointmentTime = lead.appointment_time;
            
            // Combinar fecha y hora si están separados
            let scheduledTime = '';
            if (appointmentDate && appointmentTime) {
                const dateTime = new Date(`${appointmentDate}T${appointmentTime}`);
                scheduledTime = dateTime.toISOString();
            } else if (appointmentDate) {
                scheduledTime = new Date(appointmentDate).toISOString();
            }

            const professionalName = lead.professional_id 
                ? profilesMap[lead.professional_id]?.full_name 
                : undefined;

            return {
                id: lead.id,
                lead_id: lead.id,
                professional_id: lead.professional_id,
                client_id: clientId,
                scheduled_date: appointmentDate || '',
                scheduled_time: scheduledTime,
                status: (lead.appointment_status || lead.status || 'pending') as Appointment['status'],
                service_name: lead.servicio_solicitado || lead.servicio || 'Servicio',
                professional_name: professionalName || 'Profesional',
                location: lead.ubicacion_direccion || '',
                price: lead.agreed_price ? parseFloat(String(lead.agreed_price)) : (lead.price || 0),
                created_at: lead.updated_at, // Usar updated_at como fallback ya que created_at no existe
                updated_at: lead.updated_at,
            };
        });
    } catch (error) {
        console.error('[Scheduling] Error getting appointments:', error);
        return [];
    }
}

/**
 * Obtener servicios agendados de un cliente (leads con appointment_date)
 */
export async function getClientScheduledServices(
    clientId: string,
    startDate: Date,
    endDate: Date
) {
    try {
        // Primero obtener los leads
        const { data: leadsData, error: leadsError } = await supabase
            .from('leads')
            .select(`
                id,
                servicio_solicitado,
                servicio,
                descripcion_proyecto,
                ubicacion_direccion,
                agreed_price,
                price,
                appointment_date,
                appointment_time,
                appointment_status,
                status,
                professional_id,
                updated_at
            `)
            .eq('cliente_id', clientId)
            .not('appointment_date', 'is', null)
            .gte('appointment_date', startDate.toISOString().split('T')[0])
            .lte('appointment_date', endDate.toISOString().split('T')[0])
            .order('appointment_date', { ascending: true })
            .order('appointment_time', { ascending: true });

        if (leadsError) {
            console.error('[Scheduling] Error fetching leads:', leadsError);
            return [];
        }

        if (!leadsData || leadsData.length === 0) {
            return [];
        }

        // Obtener IDs de profesionales únicos
        const professionalIds = leadsData
            .filter(lead => lead.professional_id)
            .map(lead => lead.professional_id)
            .filter((id, index, self) => self.indexOf(id) === index) as string[];

        // Obtener perfiles de profesionales si hay alguno
        let profilesMap: Record<string, { full_name: string; user_id: string }> = {};
        
        if (professionalIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('user_id, full_name')
                .in('user_id', professionalIds);

            if (!profilesError && profilesData) {
                profilesMap = profilesData.reduce((acc, profile) => {
                    acc[profile.user_id] = {
                        full_name: profile.full_name,
                        user_id: profile.user_id,
                    };
                    return acc;
                }, {} as Record<string, { full_name: string; user_id: string }>);
            }
        }

        // Combinar datos
        return leadsData.map(lead => ({
            ...lead,
            professional: lead.professional_id ? profilesMap[lead.professional_id] : undefined,
        }));
    } catch (error) {
        console.error('[Scheduling] Error getting scheduled services:', error);
        return [];
    }
}

/**
 * Formatear slot de tiempo para mostrar
 */
export function formatTimeSlot(timeString: string): string {
    try {
        const date = new Date(timeString);
        return date.toLocaleTimeString('es-MX', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch {
        return '';
    }
}

/**
 * Formatear rango de tiempo
 */
export function formatTimeRange(startTime: string, endTime?: string): string {
    try {
        const start = new Date(startTime);
        const startFormatted = start.toLocaleTimeString('es-MX', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        if (!endTime) return startFormatted;
        
        const end = new Date(endTime);
        const endFormatted = end.toLocaleTimeString('es-MX', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        return `${startFormatted} - ${endFormatted}`;
    } catch {
        return '';
    }
}

/**
 * Calcular duración en horas
 */
export function calculateDuration(startTime: string, endTime?: string): string {
    if (!endTime) return '';
    try {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end.getTime() - start.getTime();
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));
        return `${diffHours}h`;
    } catch {
        return '';
    }
}

