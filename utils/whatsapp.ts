import { Linking, Platform, Alert } from 'react-native';

/**
 * Utilidades para WhatsApp
 * Abre WhatsApp con un número y mensaje pre-cargado
 */

/**
 * Limpia un número de teléfono, dejando solo dígitos
 */
export function cleanPhoneNumber(phone: string): string {
    return phone.replace(/\D/g, '');
}

/**
 * Formatea un número de teléfono para WhatsApp
 * Asegura que tenga el código de país (52 para México)
 */
export function formatPhoneForWhatsApp(phone: string): string {
    const cleaned = cleanPhoneNumber(phone);
    
    // Si ya tiene código de país (52), lo deja así
    if (cleaned.startsWith('52')) {
        return cleaned;
    }
    
    // Si empieza con 0, lo quita
    if (cleaned.startsWith('0')) {
        return '52' + cleaned.substring(1);
    }
    
    // Si tiene 10 dígitos, asume que es México y agrega 52
    if (cleaned.length === 10) {
        return '52' + cleaned;
    }
    
    // Si tiene menos de 10 dígitos, asume que falta código de área
    // Por defecto, agrega 52
    return '52' + cleaned;
}

/**
 * Abre WhatsApp con un número y mensaje
 */
export async function openWhatsApp(phone: string, message?: string): Promise<boolean> {
    try {
        const formattedPhone = formatPhoneForWhatsApp(phone);
        const encodedMessage = message ? encodeURIComponent(message) : '';
        const url = `https://wa.me/${formattedPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
        
        const canOpen = await Linking.canOpenURL(url);
        
        if (!canOpen) {
            Alert.alert(
                'WhatsApp no disponible',
                'No se pudo abrir WhatsApp. Asegúrate de tener WhatsApp instalado.',
                [{ text: 'OK' }]
            );
            return false;
        }
        
        await Linking.openURL(url);
        return true;
    } catch (error) {
        console.error('[WhatsApp] Error opening WhatsApp:', error);
        Alert.alert(
            'Error',
            'No se pudo abrir WhatsApp. Intenta de nuevo.',
            [{ text: 'OK' }]
        );
        return false;
    }
}

/**
 * Genera un mensaje pre-cargado para contactar a un cliente sobre un servicio
 */
export function generateServiceMessage(serviceName: string, professionalName?: string): string {
    const greeting = professionalName 
        ? `Hola, soy ${professionalName}, técnico certificado de SumeeApp`
        : 'Hola, soy un técnico certificado de SumeeApp';
    
    return `${greeting} y me interesa ayudarte con tu proyecto de "${serviceName}". ¿Cuándo te viene bien que coordinemos?`;
}

/**
 * Genera un mensaje pre-cargado para que un cliente contacte a un profesional
 */
export function generateClientToProfessionalMessage(serviceName: string, clientName?: string): string {
    const greeting = clientName 
        ? `Hola ${clientName}`
        : 'Hola';
    
    return `${greeting}, tengo dudas sobre mi servicio de ${serviceName}.`;
}

/**
 * Normaliza un número de WhatsApp a formato estándar (52XXXXXXXXXX)
 * Alineado con la lógica de la interfaz web
 */
export function normalizeWhatsappNumber(input: string): { normalized: string; isValid: boolean } {
    const digits = (input || "").replace(/\D/g, "");

    if (digits.length === 0) {
        return { normalized: "", isValid: false };
    }

    if (digits.startsWith("521") && digits.length === 13) {
        return { normalized: `52${digits.slice(3)}`, isValid: true };
    }

    if (digits.startsWith("52") && digits.length === 12) {
        return { normalized: digits, isValid: true };
    }

    if (digits.length === 11 && digits.startsWith("1")) {
        const trimmed = digits.slice(1);
        return {
            normalized: trimmed.length === 10 ? `52${trimmed}` : digits,
            isValid: trimmed.length === 10,
        };
    }

    if (digits.length === 10) {
        return { normalized: `52${digits}`, isValid: true };
    }

    if (digits.length > 12 && digits.startsWith("52")) {
        const trimmed = digits.slice(0, 12);
        return { normalized: trimmed, isValid: trimmed.length === 12 };
    }

    return { normalized: digits, isValid: false };
}

/**
 * Formatea un número de WhatsApp normalizado para mostrar (XX XXXX XXXX)
 * Alineado con la lógica de la interfaz web
 */
export function formatWhatsappForDisplay(normalized: string): string {
    if (!normalized || normalized.length < 10) {
        return normalized;
    }

    // Si tiene código de país (52), formatear como XX XXXX XXXX
    if (normalized.startsWith("52") && normalized.length === 12) {
        const local = normalized.slice(2);
        return `${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`;
    }

    // Si tiene 10 dígitos, formatear como XX XXXX XXXX
    if (normalized.length === 10) {
        return `${normalized.slice(0, 2)} ${normalized.slice(2, 6)} ${normalized.slice(6)}`;
    }

    return normalized;
}

