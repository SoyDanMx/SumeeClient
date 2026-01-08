import { useState, useEffect, useMemo } from 'react';
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
    selectedDate?: string;
}

export function useServiceRequestValidation({
    formData,
    quote,
    service,
    selectedDate,
}: UseServiceRequestValidationProps): ValidationState {
    const [validation, setValidation] = useState<ValidationState>({
        isValid: false,
        missingFields: [],
        errors: {},
        canSubmit: false,
    });

    useEffect(() => {
        validateForm();
    }, [formData, quote, service, selectedDate]);

    const validateForm = () => {
        const missingFields: string[] = [];
        const errors: Record<string, string> = {};

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

        // Validar que haya una fecha seleccionada (si aplica)
        if (!selectedDate) {
            missingFields.push('fecha');
            errors.fecha = 'Debes seleccionar una fecha para el servicio';
        }

        // Validar descripción del problema (mínimo 20 caracteres)
        const description = 
            formData.description || 
            formData.problem_description || 
            formData.additionalInfo || 
            '';
        
        if (description.length < 20) {
            missingFields.push('descripción');
            errors.descripcion = 'La descripción debe tener al menos 20 caracteres';
        }

        // Validar tipo de servicio (si aplica)
        if (formData.service_type && !['Instalar', 'Mantenimiento', 'Reparar'].includes(formData.service_type)) {
            errors.service_type = 'Tipo de servicio inválido';
        }

        const isValid = missingFields.length === 0 && Object.keys(errors).length === 0;
        const canSubmit = isValid && !!quote && !!service && !!selectedDate;

        setValidation({
            isValid,
            missingFields,
            errors,
            canSubmit,
        });
    };

    return validation;
}

