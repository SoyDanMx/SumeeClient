import {
    Zap, // Electricidad
    Droplet, // Plomería
    Wind, // Aire acondicionado
    Wifi, // Redes WiFi
    Shield, // CCTV y Alarmas
    Hammer, // Carpintería
    Paintbrush, // Pintura
    Wrench, // Mantenimiento general
    Home, // Instalación general
    Tv, // Montaje/Armado
    Car, // Automotriz
    Smartphone, // Electrónica
    Camera, // Fotografía
    Scissors, // Jardinería
    UtensilsCrossed, // Cocina
    Briefcase, // Servicios generales
    MapPin, // Default
} from 'lucide-react-native';

export interface JobIconConfig {
    icon: any; // Lucide icon component
    color: string;
    backgroundColor: string;
    name: string;
}

/**
 * Mapeo de disciplinas/servicios a iconos y colores
 * Basado en los servicios más comunes en TulBox
 */
export const JOB_DISCIPLINE_ICONS: Record<string, JobIconConfig> = {
    // Electricidad
    'electricidad': {
        icon: Zap,
        color: '#FCD34D', // Amarillo eléctrico
        backgroundColor: '#FEF3C7',
        name: 'Electricidad',
    },
    'electricista': {
        icon: Zap,
        color: '#FCD34D',
        backgroundColor: '#FEF3C7',
        name: 'Electricidad',
    },
    'instalacion-electrica': {
        icon: Zap,
        color: '#FCD34D',
        backgroundColor: '#FEF3C7',
        name: 'Electricidad',
    },
    'reparacion-electrica': {
        icon: Zap,
        color: '#FCD34D',
        backgroundColor: '#FEF3C7',
        name: 'Electricidad',
    },

    // Plomería
    'plomeria': {
        icon: Droplet,
        color: '#3B82F6', // Azul agua
        backgroundColor: '#DBEAFE',
        name: 'Plomería',
    },
    'plomero': {
        icon: Droplet,
        color: '#3B82F6',
        backgroundColor: '#DBEAFE',
        name: 'Plomería',
    },
    'instalacion-plomeria': {
        icon: Droplet,
        color: '#3B82F6',
        backgroundColor: '#DBEAFE',
        name: 'Plomería',
    },
    'reparacion-plomeria': {
        icon: Droplet,
        color: '#3B82F6',
        backgroundColor: '#DBEAFE',
        name: 'Plomería',
    },

    // Aire Acondicionado
    'aire-acondicionado': {
        icon: Wind,
        color: '#06B6D4', // Cyan
        backgroundColor: '#CFFAFE',
        name: 'Aire Acondicionado',
    },
    'clima': {
        icon: Wind,
        color: '#06B6D4',
        backgroundColor: '#CFFAFE',
        name: 'Aire Acondicionado',
    },
    'instalacion-clima': {
        icon: Wind,
        color: '#06B6D4',
        backgroundColor: '#CFFAFE',
        name: 'Aire Acondicionado',
    },
    'mantenimiento-clima': {
        icon: Wind,
        color: '#06B6D4',
        backgroundColor: '#CFFAFE',
        name: 'Aire Acondicionado',
    },

    // Redes WiFi
    'redes-wifi': {
        icon: Wifi,
        color: '#8B5CF6', // Púrpura
        backgroundColor: '#EDE9FE',
        name: 'Redes WiFi',
    },
    'wifi': {
        icon: Wifi,
        color: '#8B5CF6',
        backgroundColor: '#EDE9FE',
        name: 'Redes WiFi',
    },
    'instalacion-redes': {
        icon: Wifi,
        color: '#8B5CF6',
        backgroundColor: '#EDE9FE',
        name: 'Redes WiFi',
    },
    'configuracion-redes': {
        icon: Wifi,
        color: '#8B5CF6',
        backgroundColor: '#EDE9FE',
        name: 'Redes WiFi',
    },

    // CCTV y Alarmas
    'cctv': {
        icon: Shield,
        color: '#EF4444', // Rojo seguridad
        backgroundColor: '#FEE2E2',
        name: 'CCTV y Alarmas',
    },
    'alarmas': {
        icon: Shield,
        color: '#EF4444',
        backgroundColor: '#FEE2E2',
        name: 'CCTV y Alarmas',
    },
    'seguridad': {
        icon: Shield,
        color: '#EF4444',
        backgroundColor: '#FEE2E2',
        name: 'CCTV y Alarmas',
    },
    'instalacion-cctv': {
        icon: Shield,
        color: '#EF4444',
        backgroundColor: '#FEE2E2',
        name: 'CCTV y Alarmas',
    },

    // Carpintería
    'carpinteria': {
        icon: Hammer,
        color: '#D97706', // Naranja madera
        backgroundColor: '#FEF3C7',
        name: 'Carpintería',
    },
    'carpintero': {
        icon: Hammer,
        color: '#D97706',
        backgroundColor: '#FEF3C7',
        name: 'Carpintería',
    },
    'muebles': {
        icon: Hammer,
        color: '#D97706',
        backgroundColor: '#FEF3C7',
        name: 'Carpintería',
    },

    // Pintura
    'pintura': {
        icon: Paintbrush,
        color: '#EC4899', // Rosa
        backgroundColor: '#FCE7F3',
        name: 'Pintura',
    },
    'pintor': {
        icon: Paintbrush,
        color: '#EC4899',
        backgroundColor: '#FCE7F3',
        name: 'Pintura',
    },

    // Mantenimiento General
    'mantenimiento': {
        icon: Wrench,
        color: '#6B7280', // Gris
        backgroundColor: '#F3F4F6',
        name: 'Mantenimiento',
    },
    'reparacion': {
        icon: Wrench,
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
        name: 'Mantenimiento',
    },

    // Montaje/Armado
    'montaje': {
        icon: Tv,
        color: '#10B981', // Verde
        backgroundColor: '#D1FAE5',
        name: 'Montaje',
    },
    'armado': {
        icon: Tv,
        color: '#10B981',
        backgroundColor: '#D1FAE5',
        name: 'Montaje',
    },
    'montaje-armado': {
        icon: Tv,
        color: '#10B981',
        backgroundColor: '#D1FAE5',
        name: 'Montaje',
    },
    'instalacion-tv': {
        icon: Tv,
        color: '#10B981',
        backgroundColor: '#D1FAE5',
        name: 'Montaje',
    },

    // Automotriz
    'automotriz': {
        icon: Car,
        color: '#6366F1', // Índigo
        backgroundColor: '#E0E7FF',
        name: 'Automotriz',
    },
    'mecanico': {
        icon: Car,
        color: '#6366F1',
        backgroundColor: '#E0E7FF',
        name: 'Automotriz',
    },

    // Electrónica
    'electronica': {
        icon: Smartphone,
        color: '#F59E0B', // Ámbar
        backgroundColor: '#FEF3C7',
        name: 'Electrónica',
    },
    'reparacion-electronica': {
        icon: Smartphone,
        color: '#F59E0B',
        backgroundColor: '#FEF3C7',
        name: 'Electrónica',
    },

    // Jardinería
    'jardineria': {
        icon: Scissors,
        color: '#059669', // Verde esmeralda
        backgroundColor: '#D1FAE5',
        name: 'Jardinería',
    },
    'jardinero': {
        icon: Scissors,
        color: '#059669',
        backgroundColor: '#D1FAE5',
        name: 'Jardinería',
    },

    // Cocina
    'cocina': {
        icon: UtensilsCrossed,
        color: '#DC2626', // Rojo
        backgroundColor: '#FEE2E2',
        name: 'Cocina',
    },
    'instalacion-cocina': {
        icon: UtensilsCrossed,
        color: '#DC2626',
        backgroundColor: '#FEE2E2',
        name: 'Cocina',
    },
};

/**
 * Obtiene la configuración de icono para una disciplina/servicio
 */
export function getJobIconConfig(
    disciplina?: string | null,
    servicio?: string | null,
    servicioSolicitado?: string | null,
    category?: string | null
): JobIconConfig {
    // Normalizar texto para búsqueda
    const normalize = (text?: string | null): string => {
        if (!text) return '';
        return text
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    };

    // Buscar en orden de prioridad
    const searchTerms = [
        normalize(disciplina),
        normalize(servicio),
        normalize(servicioSolicitado),
        normalize(category),
    ].filter(Boolean);

    // Buscar coincidencia exacta primero
    for (const term of searchTerms) {
        if (term && JOB_DISCIPLINE_ICONS[term]) {
            return JOB_DISCIPLINE_ICONS[term];
        }
    }

    // Buscar coincidencia parcial
    for (const term of searchTerms) {
        if (term) {
            const match = Object.keys(JOB_DISCIPLINE_ICONS).find(key =>
                term.includes(key) || key.includes(term)
            );
            if (match) {
                return JOB_DISCIPLINE_ICONS[match];
            }
        }
    }

    // Default
    return {
        icon: MapPin,
        color: '#6D28D9', // TulBox Purple
        backgroundColor: '#EDE9FE',
        name: 'Servicio General',
    };
}

/**
 * Obtiene el SVG path para un icono (para uso en web/mapas)
 */
export function getIconSVGPath(iconName: string): string {
    // SVG paths para iconos comunes (simplificados)
    const svgPaths: Record<string, string> = {
        'zap': 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
        'droplet': 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
        'wind': 'M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2',
        'wifi': 'M5 12.55a11 11 0 0 1 5.17-2.39M10 18.94a5 5 0 0 0 2.16-2.16M15 12.55a11 11 0 0 0-5.17-2.39M20 12.55a16 16 0 0 0-4.83-2.39M12 2a20 20 0 0 0-4.83 2.39',
        'shield': 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
        'hammer': 'M15 2v6h-4v-2H9v2H5v-2H3v10h2v-2h4v2h2v-6h4V2z',
        'paintbrush': 'M18.37 2.63L14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l5 5 2-2a2 2 0 0 0 0-2.82L13 6l-1-1 4.37-4.37a2.12 2.12 0 0 1 3 3z',
        'wrench': 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
        'tv': 'M7 21h10M5 21H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2',
        'car': 'M5 17h14l-1-7H6l-1 7zm2-10h10M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2',
        'smartphone': 'M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z',
        'scissors': 'M6 9l6 6 6-6M6 21l6-6 6 6M6 3l6 6 6-6',
        'utensils-crossed': 'M3 3v18h18M7.5 3v18M16.5 3v18M12 3v9M12 12v9',
        'map-pin': 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    };

    return svgPaths[iconName.toLowerCase()] || svgPaths['map-pin'];
}
