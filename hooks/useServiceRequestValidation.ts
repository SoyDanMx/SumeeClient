import { useMemo } from 'react';
import { ServiceQuoteFormData, ServiceQuote } from '@/services/quotes';

export interface ValidationState {
    isValid: boolean;
    missingFields: string[];
    errors: Record<string, string>;
    canSubmit: boolean;
}

interface UseServiceRequestValidationProps {
    formData: ServiceQuoteFormData;
    quote: ServiceQuote | null;
    service: any;
    /** Fecha acordada: puede venir de la URL o de `formData.selected_date` (Expo Router a veces omite params). */
    selectedDate?: string | string[];
}

function normalizeRouteParam(v: string | string[] | undefined): string {
    if (v == null) return '';
    const raw = Array.isArray(v) ? v[0] : v;
    return raw != null ? String(raw).trim() : '';
}

export function useServiceRequestValidation({
    formData,
    quote,
    service,
    selectedDate,
}: UseServiceRequestValidationProps): ValidationState {
    // Usar useMemo en lugar de useState + useEffect para evitar loops infinitos
    const validation = useMemo(() => {
        const missingFields: string[] = [];
        const errors: Record<string, string> = {};

        const fromParam = normalizeRouteParam(selectedDate);
        const fromForm =
            formData.selected_date != null && String(formData.selected_date).trim().length > 0
                ? String(formData.selected_date).trim()
                : '';
        const appointmentDay = fromParam || fromForm;

        // Validar que haya un servicio seleccionado
        if (!service || !service.id) {
            missingFields.push('servicio');
            errors.servicio = 'Debes seleccionar un servicio';
        }

        // Validar que haya una cotización calculada
        if (!quote) {
            missingFields.push('cotización');
            errors.cotizacion = 'Debes completar el formulario para obtener una cotización';
        }

        // Fecha: params o cotización (misma fuente que al navegar desde detalle de servicio)
        if (!appointmentDay) {
            missingFields.push('fecha');
            errors.fecha = 'Debes seleccionar una fecha para el servicio';
        }

        // Validar descripción del problema (más flexible)
        // La descripción puede venir de múltiples campos o del nombre del servicio
        const description = 
            formData.description || 
            formData.problem_description || 
            formData.additionalInfo || 
            formData.service_description ||
            '';
        
        // Si no hay descripción en formData, usar nombre del servicio como fallback
        const hasDescription = description && description.trim().length >= 5;
        const hasServiceName = service?.service_name && service.service_name.length >= 5;
        
        // La descripción es válida si:
        // 1. Tiene al menos 5 caracteres en algún campo, O
        // 2. El nombre del servicio tiene al menos 5 caracteres (se usará como fallback)
        if (!hasDescription && !hasServiceName) {
            missingFields.push('descripción');
            errors.descripcion = 'Completa la descripción del servicio';
        }

        // Validar tipo de servicio (si aplica)
        if (formData.service_type && !['Instalar', 'Mantenimiento', 'Reparar'].includes(formData.service_type)) {
            errors.service_type = 'Tipo de servicio inválido';
        }

        const isValid = missingFields.length === 0 && Object.keys(errors).length === 0;
        const canSubmit = isValid && !!quote && !!service && !!appointmentDay;

        return {
            isValid,
            missingFields,
            errors,
            canSubmit,
        };
    }, [
        // Dependencias: usar JSON.stringify para objetos o valores primitivos
        // Esto asegura que solo se recalcule cuando los valores realmente cambian
        JSON.stringify(formData),
        quote?.id || null,
        service?.id || null,
        service?.service_name || null,
        typeof selectedDate === 'string' ? selectedDate : Array.isArray(selectedDate) ? selectedDate.join(',') : '',
    ]);

    return validation;
}

