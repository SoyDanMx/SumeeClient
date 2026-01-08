import { supabase } from '@/lib/supabase';

/**
 * Messages Service - Gestión de mensajes para clientes
 * Alineado con SumeePros y Web
 */

export interface Message {
    id: string;
    lead_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    // Datos del remitente
    sender_name?: string;
    sender_avatar?: string;
    sender_type?: 'professional' | 'client';
}

export interface Conversation {
    lead_id: string;
    lead_title: string;
    lead_status: string;
    professional_id?: string;
    professional_name?: string;
    professional_avatar?: string;
    last_message?: Message;
    unread_count: number;
    updated_at: string;
}

export class MessagesService {
    /**
     * Obtener conversaciones del cliente (agrupadas por lead)
     */
    static async getConversations(clientId: string): Promise<Conversation[]> {
        try {
            // Obtener todos los leads del cliente
            const { data: leadsWithMessages, error: leadsError } = await supabase
                .from('leads')
                .select(`
                    id,
                    servicio_solicitado,
                    servicio,
                    status,
                    estado,
                    professional_id,
                    updated_at
                `)
                .eq('cliente_id', clientId)
                .order('updated_at', { ascending: false });

            if (leadsError) {
                console.error('[MessagesService] Error fetching leads:', leadsError);
                throw leadsError;
            }

            if (!leadsWithMessages || leadsWithMessages.length === 0) {
                return [];
            }

            // Para cada lead, obtener el último mensaje y contar no leídos
            const conversations: Conversation[] = [];

            for (const lead of leadsWithMessages) {
                // Obtener último mensaje (sin .single() para evitar error si no hay mensajes)
                const { data: lastMessages, error: messageError } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('lead_id', lead.id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                const lastMessage = lastMessages && lastMessages.length > 0 ? lastMessages[0] : null;

                // Contar mensajes no leídos (mensajes del profesional que no ha leído el cliente)
                let unreadCount = 0;
                try {
                    // Primero intentar con read_at si existe
                    const { count: unreadWithReadAt, error: readAtError } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('lead_id', lead.id)
                        .neq('sender_id', clientId)
                        .is('read_at', null);
                    
                    if (!readAtError || readAtError.code !== '42703') {
                        // Si no hay error o el error no es "columna no existe", usar este count
                        unreadCount = unreadWithReadAt || 0;
                    } else {
                        // Si read_at no existe, contar todos los mensajes del profesional
                        const { count } = await supabase
                            .from('messages')
                            .select('*', { count: 'exact', head: true })
                            .eq('lead_id', lead.id)
                            .neq('sender_id', clientId);
                        unreadCount = count || 0;
                    }
                } catch (countError: any) {
                    console.warn('[MessagesService] Error counting unread, using fallback:', countError);
                    // Fallback: contar todos los mensajes del profesional
                    try {
                        const { count } = await supabase
                            .from('messages')
                            .select('*', { count: 'exact', head: true })
                            .eq('lead_id', lead.id)
                            .neq('sender_id', clientId);
                        unreadCount = count || 0;
                    } catch (fallbackError) {
                        console.error('[MessagesService] Fallback count also failed:', fallbackError);
                        unreadCount = 0;
                    }
                }

                // Obtener información del profesional si existe
                let professionalName: string | undefined;
                let professionalAvatar: string | undefined;
                
                if (lead.professional_id) {
                    try {
                        const { data: professionalData } = await supabase
                            .from('profiles')
                            .select('full_name, avatar_url')
                            .eq('user_id', lead.professional_id)
                            .single();
                        
                        if (professionalData) {
                            professionalName = professionalData.full_name || undefined;
                            professionalAvatar = professionalData.avatar_url || undefined;
                        }
                    } catch (profError) {
                        console.warn('[MessagesService] Error fetching professional:', profError);
                        // Continuar sin información del profesional
                    }
                }

                conversations.push({
                    lead_id: lead.id,
                    lead_title: lead.servicio_solicitado || lead.servicio || 'Servicio',
                    lead_status: lead.status || lead.estado || 'pending',
                    professional_id: lead.professional_id || undefined,
                    professional_name: professionalName,
                    professional_avatar: professionalAvatar,
                    last_message: lastMessage ? {
                        id: lastMessage.id,
                        lead_id: lastMessage.lead_id,
                        sender_id: lastMessage.sender_id,
                        content: lastMessage.content,
                        created_at: lastMessage.created_at,
                        updated_at: lastMessage.updated_at,
                    } : undefined,
                    unread_count: unreadCount || 0,
                    updated_at: lead.updated_at,
                });
            }

            // Ordenar por último mensaje o última actualización
            return conversations.sort((a, b) => {
                const aTime = a.last_message?.created_at || a.updated_at;
                const bTime = b.last_message?.created_at || b.updated_at;
                return new Date(bTime).getTime() - new Date(aTime).getTime();
            });
        } catch (error) {
            console.error('[MessagesService] Error getting conversations:', error);
            return [];
        }
    }

    /**
     * Obtener mensajes de un lead específico
     */
    static async getMessages(leadId: string, clientId: string): Promise<Message[]> {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('[MessagesService] Error fetching messages:', error);
                throw error;
            }

            if (!data || data.length === 0) return [];

            // Obtener información de los remitentes en batch
            const senderIds = [...new Set(data.map((msg: any) => msg.sender_id))];
            const { data: sendersData } = await supabase
                .from('profiles')
                .select('user_id, full_name, avatar_url, role')
                .in('user_id', senderIds);

            const sendersMap = new Map(
                (sendersData || []).map((sender: any) => [sender.user_id, sender])
            );

            // Mapear mensajes con información del remitente
            return data.map((msg: any) => {
                const sender = sendersMap.get(msg.sender_id);
                return {
                    id: msg.id,
                    lead_id: msg.lead_id,
                    sender_id: msg.sender_id,
                    content: msg.content,
                    created_at: msg.created_at,
                    updated_at: msg.updated_at,
                    sender_name: sender?.full_name || 'Usuario',
                    sender_avatar: sender?.avatar_url || undefined,
                    sender_type: sender?.role === 'profesional' || sender?.role === 'professional' 
                        ? 'professional' 
                        : 'client',
                };
            });
        } catch (error) {
            console.error('[MessagesService] Error getting messages:', error);
            return [];
        }
    }

    /**
     * Enviar mensaje
     */
    static async sendMessage(
        leadId: string,
        senderId: string,
        content: string
    ): Promise<Message | null> {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    lead_id: leadId,
                    sender_id: senderId,
                    content: content.trim(),
                })
                .select()
                .single();

            if (error) throw error;

            // Actualizar updated_at del lead
            await supabase
                .from('leads')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', leadId);

            return {
                id: data.id,
                lead_id: data.lead_id,
                sender_id: data.sender_id,
                content: data.content,
                created_at: data.created_at,
                updated_at: data.updated_at,
            };
        } catch (error) {
            console.error('[MessagesService] Error sending message:', error);
            throw error;
        }
    }

    /**
     * Marcar mensajes como leídos
     */
    static async markAsRead(leadId: string, clientId: string): Promise<boolean> {
        try {
            // Marcar todos los mensajes del lead que no son del cliente como leídos
            const { error } = await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('lead_id', leadId)
                .neq('sender_id', clientId)
                .is('read_at', null);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('[MessagesService] Error marking as read:', error);
            return false;
        }
    }

    /**
     * Suscribirse a nuevos mensajes en tiempo real
     */
    static subscribeToMessages(
        leadId: string,
        callback: (message: Message) => void
    ) {
        const channel = supabase
            .channel(`messages:${leadId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `lead_id=eq.${leadId}`,
                },
                (payload) => {
                    const newMessage = payload.new as any;
                    callback({
                        id: newMessage.id,
                        lead_id: newMessage.lead_id,
                        sender_id: newMessage.sender_id,
                        content: newMessage.content,
                        created_at: newMessage.created_at,
                        updated_at: newMessage.updated_at,
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    /**
     * Suscribirse a conversaciones (para actualizar inbox)
     */
    static subscribeToConversations(
        clientId: string,
        callback: () => void
    ) {
        const channel = supabase
            .channel(`conversations:${clientId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=neq.${clientId}`,
                },
                () => {
                    callback();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
}

