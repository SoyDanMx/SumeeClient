import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export interface Category {
    id: string;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    iconColor: string;
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
    },
    'plomeria': {
        name: 'Plomería',
        icon: 'water',
        color: '#DBEAFE',
        iconColor: '#2563EB',
    },
    'aire-acondicionado': {
        name: 'Climatización',
        icon: 'snow',
        color: '#E0F2FE',
        iconColor: '#0891B2',
    },
    'cerrajeria': {
        name: 'Cerrajería',
        icon: 'key',
        color: '#F3F4F6',
        iconColor: '#4B5563',
    },
    'pintura': {
        name: 'Pintura',
        icon: 'color-palette',
        color: '#F3E8FF',
        iconColor: '#9333EA',
    },
    'limpieza': {
        name: 'Limpieza',
        icon: 'sparkles',
        color: '#DCFCE7',
        iconColor: '#16A34A',
    },
    'jardineria': {
        name: 'Jardinería',
        icon: 'leaf',
        color: '#ECFDF5',
        iconColor: '#047857',
    },
    'carpinteria': {
        name: 'Carpintería',
        icon: 'hammer',
        color: '#FFF7ED',
        iconColor: '#C2410C',
    },
    'construccion': {
        name: 'Construcción',
        icon: 'construct',
        color: '#EFF6FF',
        iconColor: '#1E40AF',
    },
    'tablaroca': {
        name: 'Tablaroca',
        icon: 'cube',
        color: '#FFF7ED',
        iconColor: '#EA580C',
    },
    'cctv': {
        name: 'CCTV',
        icon: 'videocam',
        color: '#FEF2F2',
        iconColor: '#DC2626',
    },
    'wifi': {
        name: 'WiFi',
        icon: 'wifi',
        color: '#FDF2F8',
        iconColor: '#DB2777',
    },
    'fumigacion': {
        name: 'Fumigación',
        icon: 'bug',
        color: '#ECFDF5',
        iconColor: '#059669',
    },
    'montaje-armado': {
        name: 'Misceláneos',
        icon: 'build',
        color: '#EEF2FF',
        iconColor: '#4F46E5',
    },
    'armado': {
        name: 'Armado',
        icon: 'construct',
        color: '#FEF3C7',
        iconColor: '#D97706',
    },
    'montaje': {
        name: 'Montaje',
        icon: 'build',
        color: '#DBEAFE',
        iconColor: '#2563EB',
    },
    'cargadores-electricos': {
        name: 'Cargadores Eléctricos',
        icon: 'battery-charging',
        color: '#FEF3C7',
        iconColor: '#D97706',
    },
    'paneles-solares': {
        name: 'Paneles Solares',
        icon: 'sunny',
        color: '#FEF3C7',
        iconColor: '#F59E0B',
    },
    'arquitectos-ingenieros': {
        name: 'Arquitectos e Ingenieros',
        icon: 'business',
        color: '#EFF6FF',
        iconColor: '#1E40AF',
    },
};

// Orden de prioridad para las categorías (según solicitud del usuario)
// NOTA: Todas las disciplinas están disponibles en la BD ✅
const CATEGORY_ORDER: string[] = [
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
            // Obtener disciplinas con precio mínimo y conteo de servicios
            const { data, error } = await supabase
                .from('service_catalog')
                .select('discipline, min_price')
                .eq('is_active', true);

            if (error) {
                console.error('[CategoryService] Error fetching categories:', error);
                // Retornar categorías por defecto si hay error
                return this.getDefaultCategories();
            }

            if (!data || data.length === 0) {
                return this.getDefaultCategories();
            }

            // Agrupar por disciplina
            const grouped = data.reduce((acc: any, item) => {
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
                const config = DISCIPLINE_CONFIG[disciplineKey];
                
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
            
            console.log('[CategoryService] 📊 Resumen:', {
                totalEnBD: sorted.length,
                totalEsperadas: CATEGORY_ORDER.length,
                faltantes: missingDisciplines.length,
                ordenadas: sorted.filter(c => CATEGORY_ORDER.includes(c.id.toLowerCase())).length,
            });
            
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
     * Obtener configuración de una disciplina
     */
    static getDisciplineConfig(discipline: string): Omit<Category, 'id' | 'minPrice' | 'serviceCount'> | null {
        return DISCIPLINE_CONFIG[discipline] || null;
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

