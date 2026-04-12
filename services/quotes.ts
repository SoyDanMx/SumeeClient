import { supabase } from '@/lib/supabase';
import { validateUUID, validateCoordinates, validatePrice, withTimeout } from './validation';
import { cache, CacheKeys } from './cache';

/**
 * Service Quote System - Alineado con TulBoxPros
 * Sistema de cotizaciones dinámicas similar a AORA
 */

export interface ServiceQuoteFormData {
    [key: string]: any; // Respuestas del formulario dinámico
}

export interface ServiceQuote {
    id?: string;
    lead_id?: string;
    service_category_id?: string;
    service_catalog_id?: string;
    form_data: ServiceQuoteFormData;
    base_price: number;
    immediate_service_fee: number;
    additional_services: AdditionalService[];
    discounts: Discount[];
    subtotal: number;
    total: number;
    total_with_tax: number;
    tax_rate: number;
    created_at?: string;
    updated_at?: string;
}

export interface AdditionalService {
    id: string;
    name: string;
    description?: string;
    price: number;
    selected: boolean;
}

export interface Discount {
    id: string;
    name: string;
    amount: number;
    type: 'fixed' | 'percentage';
}

export interface ServiceMaterial {
    id?: string;
    lead_id?: string;
    professional_id?: string;
    material_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total_price: number;
    purchase_service_fee: number;
    status?: 'pending' | 'approved' | 'purchased';
    client_approved?: boolean;
}

export class QuoteService {
    /**
     * Calcular precio basado en respuestas del formulario
     */
    static calculatePrice(
        basePrice: number,
        formData: ServiceQuoteFormData,
        immediateService: boolean = false
    ): ServiceQuote {
        const immediateFee = immediateService ? 100 : 0;
        const additionalServices: AdditionalService[] = [];
        const discounts: Discount[] = [];

        // Calcular servicios adicionales basados en respuestas
        // Ejemplo: si necesita desinstalar A/C actual, agregar $30
        if (formData.needs_uninstall === true) {
            additionalServices.push({
                id: 'uninstall',
                name: 'Desinstalación de equipo actual',
                price: 30,
                selected: true,
            });
        }

        // Calcular subtotal
        const additionalTotal = additionalServices
            .filter(s => s.selected)
            .reduce((sum, s) => sum + s.price, 0);

        const subtotal = basePrice + immediateFee + additionalTotal;

        // Descuentos eliminados - precio transparente sin descuentos promocionales
        // Los descuentos pueden agregarse en el futuro mediante lógica de negocio específica
        // (ej: descuentos por lealtad, referidos, etc.)

        const total = subtotal;
        const taxRate = 0.16; // IVA 16%
        const totalWithTax = total * (1 + taxRate);

        return {
            form_data: formData,
            base_price: basePrice,
            immediate_service_fee: immediateFee,
            additional_services: additionalServices,
            discounts,
            subtotal,
            total,
            total_with_tax: totalWithTax,
            tax_rate: taxRate,
        };
    }

    /**
     * Crear cotización y lead
     */
    /**
     * Crear cotización y lead con datos pre-llenados de IA
     */
    static async createQuoteAndLeadWithAI(
        userId: string,
        serviceId: string,
        quote: ServiceQuote,
        aiPreFilledData?: {
            descripcion?: string;
            urgencia?: 'baja' | 'media' | 'alta';
            precio_estimado?: { min: number; max: number };
        }
    ) {
        const description =
            aiPreFilledData?.descripcion ||
            quote.form_data.description ||
            quote.form_data.additionalInfo ||
            '';
        const mergedQuote: ServiceQuote = {
            ...quote,
            form_data: {
                ...quote.form_data,
                description: description || quote.form_data.description,
                problem_description: description || quote.form_data.problem_description,
            },
        };
        return this.createQuoteAndLead(userId, serviceId, mergedQuote, undefined, undefined);
    }

    static async createQuoteAndLead(
        clientId: string,
        serviceId: string,
        quote: ServiceQuote,
        appointmentAt?: Date,
        location?: { lat: number; lng: number; address: string }
    ) {
        try {
            console.log('[QuoteService] 🚀 Starting createQuoteAndLead:', {
                clientId,
                serviceId,
                hasQuote: !!quote,
                hasAppointment: !!appointmentAt,
                hasLocation: !!location,
            });
            
            // ✅ Validar IDs de entrada
            const clientIdValidation = validateUUID(clientId);
            if (!clientIdValidation.valid) {
                throw new Error(clientIdValidation.error?.message || 'ID de cliente inválido');
            }

            const serviceIdValidation = validateUUID(serviceId);
            if (!serviceIdValidation.valid) {
                throw new Error(serviceIdValidation.error?.message || 'ID de servicio inválido');
            }

            // ✅ Validar precio
            const priceValidation = validatePrice(quote.total_with_tax ?? quote.base_price ?? 0);
            if (!priceValidation.valid) {
                throw new Error(priceValidation.error?.message || 'Precio inválido');
            }

            // ✅ Validar coordenadas si están presentes
            if (location) {
                const coordValidation = validateCoordinates(location.lat, location.lng);
                if (!coordValidation.valid) {
                    throw new Error(coordValidation.error?.message || 'Coordenadas inválidas');
                }
            }

            // Obtener información del servicio (con cache)
            const serviceCacheKey = CacheKeys.services(serviceId);
            const cachedService = cache.get<any>(serviceCacheKey);
            
            let serviceData = cachedService;
            let serviceError = null;

            if (!serviceData) {
                const result = await withTimeout(
                    supabase
                        .from('service_catalog')
                        .select('*')
                        .eq('id', serviceId)
                        .single(),
                    10000, // 10 segundos timeout
                    'Timeout al obtener información del servicio'
                );
                serviceData = result.data;
                serviceError = result.error;
                
                // Guardar en cache (TTL: 10 minutos para catálogo de servicios)
                if (serviceData && !serviceError) {
                    cache.set(serviceCacheKey, serviceData, 10 * 60 * 1000);
                }
            }

            if (serviceError || !serviceData) {
                console.error('[QuoteService] ❌ Service not found:', {
                    serviceId,
                    error: serviceError,
                });
                throw new Error('Servicio no encontrado');
            }

            console.log('[QuoteService] ✅ Service found:', {
                id: serviceData.id,
                name: serviceData.service_name,
                discipline: serviceData.discipline,
            });

            // Obtener información del cliente (nombre y WhatsApp) - con cache
            const profileCacheKey = CacheKeys.profile(clientId);
            const cachedProfile = cache.get<any>(profileCacheKey);
            
            let clientProfile = cachedProfile;
            let profileError = null;

            if (!clientProfile) {
                const result = await withTimeout(
                    supabase
                        .from('profiles')
                        .select('full_name, whatsapp, phone')
                        .eq('user_id', clientId)
                        .single(),
                    10000, // 10 segundos timeout
                    'Timeout al obtener perfil del cliente'
                );
                clientProfile = result.data;
                profileError = result.error;
                
                // Guardar en cache (TTL: 5 minutos para perfiles)
                if (clientProfile && !profileError) {
                    cache.set(profileCacheKey, clientProfile, 5 * 60 * 1000);
                }
            }
            
            if (profileError) {
                console.warn('[QuoteService] ⚠️ Profile error (non-critical):', profileError);
            } else {
                console.log('[QuoteService] ✅ Client profile found:', {
                    full_name: clientProfile?.full_name,
                    hasWhatsApp: !!clientProfile?.whatsapp,
                });
            }

            // Extraer descripción del problema (puede venir de IA o del formulario)
            // Intentar múltiples campos y usar nombre del servicio como fallback
            let problemDescription = 
                quote.form_data.problem_description || 
                quote.form_data.description || 
                quote.form_data.additionalInfo || 
                quote.form_data.service_description ||
                '';
            
            // Si no hay descripción o es muy corta, usar nombre del servicio
            if (!problemDescription || problemDescription.trim().length < 10) {
                problemDescription = serviceData.service_name || 
                                   serviceData.description || 
                                   `Servicio: ${serviceData.service_name}`;
                console.log('[QuoteService] Using service name as description fallback:', problemDescription);
            }
            
            // Si aún no hay descripción, usar JSON del form_data como último recurso
            if (!problemDescription || problemDescription.trim().length < 5) {
                problemDescription = JSON.stringify(quote.form_data);
                console.log('[QuoteService] Using form_data JSON as description fallback');
            }
            
            console.log('[QuoteService] Final problem description:', {
                length: problemDescription.length,
                preview: problemDescription.substring(0, 100),
            });
            
            // Preparar fecha de cita si está disponible
            let appointmentDate: string | null = null;
            let appointmentTime: string | null = null;
            let appointmentStatus: string | null = null;
            
            if (appointmentAt) {
                try {
                    // Formatear fecha como YYYY-MM-DD
                    const year = appointmentAt.getFullYear();
                    const month = String(appointmentAt.getMonth() + 1).padStart(2, '0');
                    const day = String(appointmentAt.getDate()).padStart(2, '0');
                    appointmentDate = `${year}-${month}-${day}`;
                    
                    // Formatear hora como HH:MM:SS (formato TIME de PostgreSQL)
                    const hours = String(appointmentAt.getHours()).padStart(2, '0');
                    const minutes = String(appointmentAt.getMinutes()).padStart(2, '0');
                    const seconds = String(appointmentAt.getSeconds()).padStart(2, '0');
                    appointmentTime = `${hours}:${minutes}:${seconds}`;
                    
                    appointmentStatus = 'scheduled';
                    
                    console.log('[QuoteService] Appointment formatted:', {
                        original: appointmentAt.toISOString(),
                        date: appointmentDate,
                        time: appointmentTime,
                    });
                } catch (error) {
                    console.error('[QuoteService] Error formatting appointment:', error);
                }
            }
            
            console.log('[QuoteService] Creating lead with data:', {
                clientId,
                serviceId,
                hasLocation: !!location,
                hasAppointment: !!appointmentAt,
                appointmentDate,
                appointmentTime,
            });
            
            // Crear lead con toda la información
            // Asegurar que todos los valores sean válidos (no undefined)
            const leadInsertData: any = {
                cliente_id: clientId,
                nombre_cliente: clientProfile?.full_name || null,
                whatsapp: clientProfile?.whatsapp || clientProfile?.phone || null,
                servicio: serviceData.discipline || null,
                servicio_solicitado: serviceData.service_name || null,
                descripcion_proyecto: typeof problemDescription === 'string' && problemDescription.trim().length > 0
                    ? problemDescription.trim()
                    : (serviceData.service_name || 'Servicio solicitado'),
                ubicacion_lat: location?.lat ?? null,
                ubicacion_lng: location?.lng ?? null,
                ubicacion_direccion: location?.address || null,
                estado: 'Nuevo',
                status: 'pending',
                price: quote.base_price ?? 0,
                agreed_price: quote.total_with_tax ?? quote.base_price ?? 0,
                ai_suggested_price_min: quote.base_price ?? 0,
                ai_suggested_price_max: quote.total_with_tax ?? quote.base_price ?? 0,
                disciplina_ia: serviceData.discipline || null,
            };
            
            // Validar campos críticos antes de insertar
            if (!leadInsertData.cliente_id) {
                throw new Error('ID de cliente es requerido');
            }
            if (!leadInsertData.servicio_solicitado) {
                throw new Error('Nombre del servicio es requerido');
            }
            if (!leadInsertData.descripcion_proyecto || leadInsertData.descripcion_proyecto.trim().length === 0) {
                throw new Error('Descripción del proyecto es requerida');
            }
            
            // Agregar campos de cita si están disponibles
            // Nota: appointment_time parece ser de tipo timestamp, no time
            // Por lo tanto, no lo enviamos por separado para evitar el error
            if (appointmentDate) {
                leadInsertData.appointment_date = appointmentDate;
            }
            // No enviar appointment_time si la columna es de tipo timestamp
            // Si necesitas la hora, deberías combinarla con appointment_date o cambiar el schema
            // if (appointmentTime) {
            //     leadInsertData.appointment_time = appointmentTime; // Esto causa error si es timestamp
            // }
            if (appointmentStatus) {
                leadInsertData.appointment_status = appointmentStatus;
            }
            
            console.log('[QuoteService] Appointment data prepared:', {
                appointmentDate,
                appointmentTime, // Solo para logging
                appointmentStatus,
                note: 'appointment_time no se envía porque la columna es de tipo timestamp',
            });
            
            // Asegurar que appointment_time NO esté en el objeto (aunque esté comentado)
            // Eliminar explícitamente si existe por alguna razón
            if ('appointment_time' in leadInsertData) {
                delete leadInsertData.appointment_time;
                console.warn('[QuoteService] ⚠️ appointment_time fue removido del objeto de inserción');
            }
            
            console.log('[QuoteService] Lead insert data (final):', {
                ...leadInsertData,
                descripcion_proyecto: leadInsertData.descripcion_proyecto?.substring(0, 50) + '...',
                hasAppointmentTime: 'appointment_time' in leadInsertData,
            });
            
            // Invalidar cache de leads del cliente antes de insertar
            cache.invalidatePattern(`leads:${clientId}*`);

            const { data: leadData, error: leadError } = await withTimeout(
                supabase
                    .from('leads')
                    .insert(leadInsertData)
                    .select()
                    .single(),
                15000, // 15 segundos timeout para inserción
                'Timeout al crear lead'
            );

            if (leadError) {
                console.error('[QuoteService] ❌ Error creating lead:', {
                    message: leadError.message,
                    details: leadError.details,
                    hint: leadError.hint,
                    code: leadError.code,
                    insertData: {
                        ...leadInsertData,
                        descripcion_proyecto: leadInsertData.descripcion_proyecto?.substring(0, 100),
                    },
                });
                
                // Mejorar el mensaje de error para el usuario
                const enhancedError = new Error(leadError.message);
                (enhancedError as any).code = leadError.code;
                (enhancedError as any).details = leadError.details;
                (enhancedError as any).hint = leadError.hint;
                throw enhancedError;
            }
            
            console.log('[QuoteService] ✅ Lead created successfully:', {
                leadId: leadData.id,
                status: leadData.status,
                servicio: leadData.servicio_solicitado,
            });

            // Guardar cotización en JSONB (o crear tabla service_quotes si existe)
            const { error: updateError } = await supabase
                .from('leads')
                .update({
                    // Guardar datos de cotización en un campo JSONB si existe
                    // O crear tabla service_quotes separada
                })
                .eq('id', leadData.id);

            return {
                lead: leadData,
                quote,
            };
        } catch (error) {
            console.error('[QuoteService] Error creating quote and lead:', error);
            throw error;
        }
    }

    /**
     * Obtener cotizaciones de un cliente
     */
    static async getClientQuotes(clientId: string) {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('cliente_id', clientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('[QuoteService] Error fetching quotes:', error);
            return [];
        }
    }

    /**
     * Aprobar o rechazar cotización
     */
    static async respondToQuote(
        leadId: string,
        accepted: boolean,
        professionalId?: string
    ) {
        try {
            const updateData: any = {
                status: accepted ? 'accepted' : 'rejected',
            };

            if (accepted && professionalId) {
                updateData.professional_id = professionalId;
            }

            const { data, error } = await supabase
                .from('leads')
                .update(updateData)
                .eq('id', leadId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('[QuoteService] Error responding to quote:', error);
            throw error;
        }
    }
}

