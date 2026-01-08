import { Ionicons } from '@expo/vector-icons';

/**
 * Mapear disciplina a icono y colores para proyectos populares
 */
export function getServiceIconConfig(discipline: string): {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    backgroundColor: string;
} {
    const config: Record<string, { icon: keyof typeof Ionicons.glyphMap; iconColor: string; backgroundColor: string }> = {
        'electricidad': {
            icon: 'flash',
            iconColor: '#D97706',
            backgroundColor: '#FEF3C7',
        },
        'plomeria': {
            icon: 'water',
            iconColor: '#2563EB',
            backgroundColor: '#DBEAFE',
        },
        'aire-acondicionado': {
            icon: 'snow',
            iconColor: '#0891B2',
            backgroundColor: '#E0F2FE',
        },
        'cctv': {
            icon: 'videocam',
            iconColor: '#DC2626',
            backgroundColor: '#FEF2F2',
        },
        'wifi': {
            icon: 'wifi',
            iconColor: '#DB2777',
            backgroundColor: '#FDF2F8',
        },
        'limpieza': {
            icon: 'sparkles',
            iconColor: '#16A34A',
            backgroundColor: '#DCFCE7',
        },
        'pintura': {
            icon: 'color-palette',
            iconColor: '#9333EA',
            backgroundColor: '#F3E8FF',
        },
        'jardineria': {
            icon: 'leaf',
            iconColor: '#047857',
            backgroundColor: '#ECFDF5',
        },
        'carpinteria': {
            icon: 'hammer',
            iconColor: '#C2410C',
            backgroundColor: '#FFF7ED',
        },
        'montaje-armado': {
            icon: 'build',
            iconColor: '#4F46E5',
            backgroundColor: '#EEF2FF',
        },
        'armado': {
            icon: 'construct',
            iconColor: '#D97706',
            backgroundColor: '#FEF3C7',
        },
        'montaje': {
            icon: 'build',
            iconColor: '#2563EB',
            backgroundColor: '#DBEAFE',
        },
        'tablaroca': {
            icon: 'cube',
            iconColor: '#EA580C',
            backgroundColor: '#FFF7ED',
        },
        'cargadores-electricos': {
            icon: 'battery-charging',
            iconColor: '#D97706',
            backgroundColor: '#FEF3C7',
        },
        'paneles-solares': {
            icon: 'sunny',
            iconColor: '#F59E0B',
            backgroundColor: '#FEF3C7',
        },
        'fumigacion': {
            icon: 'bug',
            iconColor: '#059669',
            backgroundColor: '#ECFDF5',
        },
    };

    return config[discipline] || {
        icon: 'construct',
        iconColor: '#6B7280',
        backgroundColor: '#F3F4F6',
    };
}

/**
 * Extraer detalles del servicio desde el nombre o descripción
 */
export function extractServiceDetails(serviceName: string, description?: string): string | undefined {
    // Buscar patrones comunes en el nombre
    const patterns = [
        { pattern: /hasta\s+(\d+)\s*(pulgadas|m²|m2|metros)/i, extract: (match: RegExpMatchArray) => `Hasta ${match[1]} ${match[2]}` },
        { pattern: /(\d+)\s*(pulgadas|m²|m2|metros)/i, extract: (match: RegExpMatchArray) => `Hasta ${match[1]} ${match[2]}` },
        { pattern: /(simple|estándar|básico|básica)/i, extract: (match: RegExpMatchArray) => match[1].charAt(0).toUpperCase() + match[1].slice(1) },
        { pattern: /(colgante|empotrada|empotrado)/i, extract: (match: RegExpMatchArray) => match[1].charAt(0).toUpperCase() + match[1].slice(1) },
        { pattern: /(wifi|cctv)/i, extract: (match: RegExpMatchArray) => match[1].charAt(0).toUpperCase() + match[1].slice(1) },
    ];

    // Buscar en el nombre primero
    for (const { pattern, extract } of patterns) {
        const match = serviceName.match(pattern);
        if (match) {
            return extract(match);
        }
    }

    // Si hay descripción, buscar ahí
    if (description) {
        for (const { pattern, extract } of patterns) {
            const match = description.match(pattern);
            if (match) {
                return extract(match);
            }
        }
    }

    return undefined;
}

