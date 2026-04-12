import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { withTimeout } from './validation';
import { cache, CacheKeys } from './cache';

export interface Category {
    id: string;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    iconColor: string;
    image?: any; // Thumbnail image
    minPrice?: number;
    serviceCount?: number;
}

// Configuración de disciplinas (debe coincidir con Supabase)
const DISCIPLINE_CONFIG: Record<string, Omit<Category, 'id' | 'minPrice' | 'serviceCount'>> = {
    'electricidad': {
        name: 'Electricidad',
        icon: 'flash',
        color: '#FEF3C7',
        iconColor: '#D97706',
        image: require('@/assets/images/services/electricidad.jpg'),
    },
    'plomeria': {
        name: 'Plomería',
        icon: 'water',
        color: '#DBEAFE',
        iconColor: '#2563EB',
        image: require('@/assets/images/services/plomeria.jpg'),
    },
    'aire-acondicionado': {
        name: 'Climatización',
        icon: 'snow',
        color: '#E0F2FE',
        iconColor: '#0891B2',
        image: require('@/assets/images/services/aire-acondicionado.jpg'),
    },
    'pintura': {
        name: 'Pintura',
        icon: 'color-palette',
        color: '#F3E8FF',
        iconColor: '#9333EA',
        image: require('@/assets/images/services/pintura.jpg'),
    },
    'limpieza': {
        name: 'Limpieza',
        icon: 'sparkles',
        color: '#DCFCE7',
        iconColor: '#16A34A',
        image: require('@/assets/images/services/limpieza.jpg'),
    },
    'jardineria': {
        name: 'Jardinería',
        icon: 'leaf',
        color: '#ECFDF5',
        iconColor: '#047857',
        image: require('@/assets/images/services/jardineria.jpg'),
    },
    'carpinteria': {
        name: 'Carpintería',
        icon: 'hammer',
        color: '#FFF7ED',
        iconColor: '#C2410C',
        image: require('@/assets/images/services/carpinteria.jpg'),
    },
    'construccion': {
        name: 'Construcción',
        icon: 'construct',
        color: '#EFF6FF',
        iconColor: '#1E40AF',
        image: require('@/assets/images/services/construccion.jpg'),
    },
    'tablaroca': {
        name: 'Tablaroca',
        icon: 'cube',
        color: '#FFF7ED',
        iconColor: '#EA580C',
        image: require('@/assets/images/services/tablaroca.jpg'),
    },
    'cctv': {
        name: 'CCTV',
        icon: 'videocam',
        color: '#FEF2F2',
        iconColor: '#DC2626',
        image: require('@/assets/images/services/cctv.jpg'),
    },
    'wifi': {
        name: 'WiFi',
        icon: 'wifi',
        color: '#FDF2F8',
        iconColor: '#DB2777',
        image: require('@/assets/images/services/wifi.jpg'),
    },
    'fumigacion': {
        name: 'Fumigación',
        icon: 'bug',
        color: '#ECFDF5',
        iconColor: '#059669',
        image: require('@/assets/images/services/fumigacion.jpg'),
    },
    'montaje-armado': {
        name: 'Misceláneos',
        icon: 'build',
        color: '#EEF2FF',
        iconColor: '#4F46E5',
        image: require('@/assets/images/services/montaje-armado.jpg'),
    },
    'armado': {
        name: 'Armado',
        icon: 'construct',
        color: '#FEF3C7',
        iconColor: '#D97706',
        image: require('@/assets/images/services/montaje-armado.jpg'),
    },
    'montaje': {
        name: 'Montaje',
        icon: 'build',
        color: '#DBEAFE',
        iconColor: '#2563EB',
        image: require('@/assets/images/services/montaje-armado.jpg'),
    },
    'cargadores-electricos': {
        name: 'Cargadores Eléctricos',
        icon: 'battery-charging',
        color: '#FEF3C7',
        iconColor: '#D97706',
        image: require('@/assets/images/services/cargadores-electricos.jpg'),
    },
    'paneles-solares': {
        name: 'Paneles Solares',
        icon: 'sunny',
        color: '#FEF3C7',
        iconColor: '#F59E0B',
        image: require('@/assets/images/services/paneles-solares.jpg'),
    },
    'arquitectos-ingenieros': {
        name: 'Arquitectos e Ingenieros',
        icon: 'business',
        color: '#EFF6FF',
        iconColor: '#1E40AF',
        image: require('@/assets/images/services/arquitectos.jpg'),
    },
};

// Orden de prioridad para las categorías (según solicitud del usuario)
// NOTA: Todas las disciplinas están disponibles en la BD ✅
/** Orden de disciplinas en listados (catálogo, home). */
export const CATEGORY_ORDER: string[] = [
    'electricidad',           // 1. Electricidad ✅
    'plomeria',              // 2. Plomería ✅
    'cctv',                  // 3. CCTV (tercer lugar) ✅
    'wifi',                  // 4. WiFi ✅
    'aire-acondicionado',    // 5. Climatización ✅
    'armado',                // 6. Armado ✅
    'montaje',               // 7. Montaje ✅
    'tablaroca',             // 8. Tablaroca ✅
    'cargadores-electricos', // 9. Cargadores Eléctricos ✅
    'paneles-solares',       // 10. Paneles Solares ✅
    'limpieza',              // 11. Limpieza ✅
    'pintura',               // 12. Pintura ✅
    'jardineria',            // 13. Jardinería ✅
    'carpinteria',           // 14. Carpintería ✅
    'arquitectos-ingenieros', // 15. Arquitectos e Ingenieros ✅
    'fumigacion',            // 16. Fumigadores ✅
];

export class CategoryService {
    /**
     * Obtener todas las disciplinas activas con información agregada
     */
    static async getCategories(): Promise<Category[]> {
        try {
            console.log('[CategoryService] 🚀 Fetching categories...');
            const startTime = Date.now();

            // ✅ Intentar obtener del cache primero
            const cacheKey = CacheKeys.categories();
            const cached = cache.get<Category[]>(cacheKey);
            if (cached) {
                console.log('[CategoryService] Using cached categories');
                return cached;
            }

            // Optimización: Query más eficiente - solo campos necesarios y límite razonable
            // Traer solo un registro por disciplina para obtener el precio mínimo
            const { data, error } = await withTimeout(
                Promise.resolve(supabase
                    .from('service_catalog')
                    .select('discipline, min_price')
                    .eq('is_active', true)
                    .order('min_price', { ascending: true })
                    .limit(200)), // Reducido de 1000 a 200 - suficiente para todas las disciplinas
                15000, // 15 segundos timeout
                'Timeout al obtener categorías'
            );

            if (error) {
                console.warn('[CategoryService] ⚠️ Warning fetching categories (using fallback):', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                });
                // Retornar categorías por defecto si hay error
                console.log('[CategoryService] ⚠️ Returning default categories due to error');
                return this.getDefaultCategories();
            }

            console.log('[CategoryService] 📊 Raw data received:', {
                count: data?.length || 0,
                sample: data?.slice(0, 3),
            });

            if (!data || data.length === 0) {
                console.warn('[CategoryService] ⚠️ No data returned, using default categories');
                return this.getDefaultCategories();
            }

            // Agrupar por disciplina
            const grouped = (data as any[]).reduce((acc: any, item: any) => {
                const discipline = item.discipline?.toLowerCase().trim();
                if (!discipline) return acc; // Saltar si no hay disciplina

                if (!acc[discipline]) {
                    acc[discipline] = {
                        discipline: discipline,
                        minPrice: item.min_price,
                        serviceCount: 1,
                    };
                } else {
                    acc[discipline].serviceCount++;
                    if (item.min_price < acc[discipline].minPrice) {
                        acc[discipline].minPrice = item.min_price;
                    }
                }
                return acc;
            }, {});

            console.log('[CategoryService] 📦 Disciplines found:', Object.keys(grouped));

            // Mapear a formato de categorías
            const categories = Object.values(grouped).map((item: any) => {
                const disciplineKey = item.discipline?.toLowerCase().trim();
                const config = this.getDisciplineConfig(disciplineKey);

                if (!config) {
                    console.warn('[CategoryService] ⚠️ No config for discipline:', disciplineKey);
                    // Si no hay configuración, usar valores por defecto
                    return {
                        id: disciplineKey,
                        name: disciplineKey.charAt(0).toUpperCase() + disciplineKey.slice(1),
                        icon: 'construct' as keyof typeof Ionicons.glyphMap,
                        color: '#F3F4F6',
                        iconColor: '#6B7280',
                        minPrice: item.minPrice,
                        serviceCount: item.serviceCount,
                    };
                }

                return {
                    id: disciplineKey,
                    name: config.name,
                    icon: config.icon,
                    color: config.color,
                    iconColor: config.iconColor,
                    image: config.image,
                    minPrice: item.minPrice,
                    serviceCount: item.serviceCount,
                };
            });

            // Ordenar según el orden de prioridad
            const sorted = categories.sort((a, b) => {
                const indexA = CATEGORY_ORDER.indexOf(a.id.toLowerCase());
                const indexB = CATEGORY_ORDER.indexOf(b.id.toLowerCase());

                // Si ambas están en el orden, ordenar por índice
                if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB;
                }

                // Si solo una está en el orden, la que está va primero
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;

                // Si ninguna está en el orden, ordenar alfabéticamente
                return a.name.localeCompare(b.name);
            });

            console.log('[CategoryService] ✅ Categories sorted:', sorted.map(c => `${c.name} (${c.id})`).join(', '));

            // Log detallado de qué falta
            const missingDisciplines = CATEGORY_ORDER.filter(
                orderId => !sorted.some(c => c.id.toLowerCase() === orderId.toLowerCase())
            );

            if (missingDisciplines.length > 0) {
                console.warn('[CategoryService] ⚠️ Disciplinas faltantes en BD:', missingDisciplines.join(', '));
                console.warn('[CategoryService] 💡 Ejecuta CREAR_SERVICIOS_DISCIPLINAS_FALTANTES.sql para agregarlas');
            }

            const loadTime = Date.now() - startTime;
            console.log('[CategoryService] 📊 Resumen:', {
                totalEnBD: sorted.length,
                totalEsperadas: CATEGORY_ORDER.length,
                faltantes: missingDisciplines.length,
                ordenadas: sorted.filter(c => CATEGORY_ORDER.includes(c.id.toLowerCase())).length,
                loadTime: `${loadTime}ms`,
            });

            // ✅ Guardar en cache (TTL: 10 minutos para categorías)
            cache.set(cacheKey, sorted, 10 * 60 * 1000);

            return sorted;
        } catch (error) {
            console.error('[CategoryService] Error getting categories:', error);
            return this.getDefaultCategories();
        }
    }

    /**
     * Obtener servicios de una disciplina específica
     */
    static async getServicesByDiscipline(discipline: string) {
        try {
            const { data, error } = await supabase
                .from('service_catalog')
                .select('*')
                .eq('discipline', discipline)
                .eq('is_active', true)
                .order('service_name');

            if (error) {
                console.error('[CategoryService] Error fetching services:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('[CategoryService] Error getting services:', error);
            return [];
        }
    }

    /**
     * Obtener precio mínimo de una disciplina
     */
    static async getMinPrice(discipline: string): Promise<number | null> {
        try {
            const { data, error } = await supabase
                .from('service_catalog')
                .select('min_price')
                .eq('discipline', discipline)
                .eq('is_active', true)
                .order('min_price', { ascending: true })
                .limit(1)
                .single();

            if (error || !data) return null;
            return data.min_price;
        } catch (error) {
            console.error('[CategoryService] Error getting min price:', error);
            return null;
        }
    }

    /**
     * Obtener configuración de una disciplina con búsqueda resiliente
     */
    static getDisciplineConfig(discipline: string): Omit<Category, 'id' | 'minPrice' | 'serviceCount'> | null {
        if (!discipline) return null;
        
        const d = discipline.toLowerCase().trim();
        
        // Intento 1: Coincidencia exacta
        if (DISCIPLINE_CONFIG[d]) return DISCIPLINE_CONFIG[d];
        
        // Intento 2: Búsqueda por palabras clave (resiliencia)
        if (d.includes('plomeria')) return DISCIPLINE_CONFIG['plomeria'];
        if (d.includes('electrica') || d.includes('electricidad')) return DISCIPLINE_CONFIG['electricidad'];
        if (d.includes('aire') || d.includes('clima') || d.includes('ac')) return DISCIPLINE_CONFIG['aire-acondicionado'];
        if (d.includes('cctv')) return DISCIPLINE_CONFIG['cctv'];
        if (d.includes('wifi')) return DISCIPLINE_CONFIG['wifi'];
        if (d.includes('carpinte')) return DISCIPLINE_CONFIG['carpinteria'];
        if (d.includes('pintura')) return DISCIPLINE_CONFIG['pintura'];
        if (d.includes('limpieza')) return DISCIPLINE_CONFIG['limpieza'];
        if (d.includes('jardi')) return DISCIPLINE_CONFIG['jardineria'];
        if (d.includes('tablaroca')) return DISCIPLINE_CONFIG['tablaroca'];
        if (d.includes('fumiga')) return DISCIPLINE_CONFIG['fumigacion'];
        if (d.includes('arquitect') || d.includes('ingeni')) return DISCIPLINE_CONFIG['arquitectos-ingenieros'];
        if (d.includes('construc')) return DISCIPLINE_CONFIG['construccion'];
        if (d.includes('solar') || d.includes('panel')) return DISCIPLINE_CONFIG['paneles-solares'];
        if (d.includes('cargador') || d.includes('ev')) return DISCIPLINE_CONFIG['cargadores-electricos'];
        if (d.includes('montaje') || d.includes('armado') || d.includes('mueble') || d.includes('soporte')) return DISCIPLINE_CONFIG['montaje-armado'];
        
        return null;
    }

    /**
     * Categorías por defecto (fallback)
     */
    private static getDefaultCategories(): Category[] {
        const categories = Object.entries(DISCIPLINE_CONFIG).map(([id, config]) => ({
            id,
            ...config,
        }));

        // Ordenar según CATEGORY_ORDER
        return categories.sort((a, b) => {
            const indexA = CATEGORY_ORDER.indexOf(a.id);
            const indexB = CATEGORY_ORDER.indexOf(b.id);

            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }

            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;

            return a.name.localeCompare(b.name);
        });
    }
}

