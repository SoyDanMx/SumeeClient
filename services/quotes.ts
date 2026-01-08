import { supabase } from '@/lib/supabase';

/**
 * Service Quote System - Alineado con SumeePros
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
        const immediateFee = immediateService ? 10 : 0;
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

        // Aplicar descuentos (ejemplo: descuento de $16)
        const discountAmount = 16;
        discounts.push({
            id: 'promo',
            name: 'Descuento Promocional',
            amount: discountAmount,
            type: 'fixed',
        });

        const total = subtotal - discountAmount;
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
        // Usar descripción de IA si está disponible
        const description = aiPreFilledData?.descripcion || quote.form_data.description || quote.form_data.additionalInfo || '';
        
        return this.createQuoteAndLead(userId, serviceId, quote, description);
    }

    static async createQuoteAndLead(
        clientId: string,
        serviceId: string,
        quote: ServiceQuote,
        appointmentAt?: Date,
        location?: { lat: number; lng: number; address: string }
    ) {
        try {
            // Obtener información del servicio
            const { data: serviceData, error: serviceError } = await supabase
                .from('service_catalog')
                .select('*')
                .eq('id', serviceId)
                .single();

            if (serviceError || !serviceData) {
                throw new Error('Servicio no encontrado');
            }

            // Obtener información del cliente (nombre y WhatsApp)
            const { data: clientProfile, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, whatsapp, phone')
                .eq('user_id', clientId)
                .single();

            // Extraer descripción del problema (puede venir de IA o del formulario)
            const problemDescription = 
                quote.form_data.problem_description || 
                quote.form_data.description || 
                quote.form_data.additionalInfo || 
                JSON.stringify(quote.form_data);
            
            // Crear lead con toda la información
            const { data: leadData, error: leadError } = await supabase
                .from('leads')
                .insert({
                    cliente_id: clientId,
                    nombre_cliente: clientProfile?.full_name || null,
                    whatsapp: clientProfile?.whatsapp || clientProfile?.phone || null, // Incluir WhatsApp del cliente
                    servicio: serviceData.discipline,
                    servicio_solicitado: serviceData.service_name,
                    descripcion_proyecto: typeof problemDescription === 'string' 
                        ? problemDescription 
                        : JSON.stringify(quote.form_data),
                    ubicacion_lat: location?.lat || null,
                    ubicacion_lng: location?.lng || null,
                    ubicacion_direccion: location?.address || null,
                    estado: 'Nuevo',
                    status: 'pending',
                    price: quote.base_price,
                    agreed_price: quote.total_with_tax,
                    ai_suggested_price_min: quote.base_price,
                    ai_suggested_price_max: quote.total_with_tax,
                    disciplina_ia: serviceData.discipline,
                })
                .select()
                .single();

            if (leadError) {
                throw leadError;
            }

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

