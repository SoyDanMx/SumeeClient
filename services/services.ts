import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { CategoryService, CATEGORY_ORDER } from '@/services/categories';

export interface ServiceItem {
    id: string;
    service_name: string;
    discipline: string;
    service_type?: 'express' | 'pro';
    min_price: number;
    max_price?: number;
    price_type: 'fixed' | 'range' | 'starting_at';
    description?: string;
    is_popular?: boolean;
    category_group?: string;
    completed_count?: number;
    badge_tags?: string[];
    hero_image_url?: string;
    display_order?: number;
    unit?: string;
    includes_materials?: boolean;
    is_active?: boolean;
}

export interface CategoryGroup {
    id: string;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    services: ServiceItem[];
}

const CATEGORY_GROUPS: Record<string, { name: string; icon: keyof typeof Ionicons.glyphMap }> = {
    'mantenimiento': {
        name: 'Mantenimiento',
        icon: 'hammer',
    },
    'tecnologia': {
        name: 'Tecnología',
        icon: 'laptop',
    },
    'especializado': {
        name: 'Especializado',
        icon: 'star',
    },
    'construccion': {
        name: 'Construcción',
        icon: 'construct',
    },
};

export class ServicesService {
    /**
     * Obtener proyectos populares con precio fijo (para sección "Proyectos Populares")
     * Elimina duplicados por nombre de servicio
     */
    static async getPopularProjects(): Promise<ServiceItem[]> {
        try {
            console.log('[ServicesService] 🚀 Fetching popular projects (fixed price)...');
            const startTime = Date.now();
            
            // Obtener servicios con precio fijo y que sean populares
            // Optimización: seleccionar solo campos necesarios y reducir límite
            let { data, error } = await supabase
                .from('service_catalog')
                .select('id, service_name, discipline, min_price, max_price, price_type, is_popular, completed_count, display_order, description')
                .eq('is_active', true)
                .eq('price_type', 'fixed')
                .eq('is_popular', true)
                .order('completed_count', { ascending: false, nullsFirst: false })
                .order('display_order', { ascending: true, nullsFirst: false })
                .limit(12); // Reducido de 15 a 12 para mejor performance

            if (error) {
                console.error('[ServicesService] ❌ Error fetching popular projects:', error);
                // Fallback: obtener servicios con precio fijo sin filtro is_popular
                const { data: data2, error: error2 } = await supabase
                    .from('service_catalog')
                    .select('*')
                    .eq('is_active', true)
                    .eq('price_type', 'fixed')
                    .order('completed_count', { ascending: false, nullsFirst: false })
                    .limit(20);
                
                if (error2) {
                    console.error('[ServicesService] ❌ Error fetching fixed price services:', error2);
                    return [];
                }
                
                data = data2;
            }

            if (!data || data.length === 0) {
                console.log('[ServicesService] ⚠️ No popular projects found');
                return [];
            }

            // Eliminar duplicados: mantener solo el primero por nombre de servicio + disciplina
            // Priorizar el que tiene mayor completed_count
            const seen = new Map<string, ServiceItem>();
            
            for (const item of data) {
                const key = `${item.service_name?.toLowerCase().trim()}_${item.discipline?.toLowerCase().trim()}`;
                const existing = seen.get(key);
                
                if (!existing) {
                    // Primera vez que vemos este servicio
                    seen.set(key, item);
                } else {
                    // Ya existe, comparar completed_count
                    const currentCount = item.completed_count || 0;
                    const existingCount = existing.completed_count || 0;
                    
                    if (currentCount > existingCount) {
                        // Este tiene más completados, reemplazar
                        console.log('[ServicesService] 🔄 Replacing duplicate (higher count):', item.service_name, item.discipline);
                        seen.set(key, item);
                    } else {
                        // Mantener el existente
                        console.log('[ServicesService] ⚠️ Duplicate removed:', item.service_name, item.discipline);
                    }
                }
            }

            // Convertir a array y ordenar por completed_count
            const unique = Array.from(seen.values());
            unique.sort((a, b) => {
                const countA = a.completed_count || 0;
                const countB = b.completed_count || 0;
                if (countB !== countA) return countB - countA;
                // Si tienen el mismo count, ordenar por precio
                return (a.min_price || 0) - (b.min_price || 0);
            });

            // Limitar a 10 después de eliminar duplicados
            const result = unique.slice(0, 10);
            
            const loadTime = Date.now() - startTime;
            console.log('[ServicesService] 📦 Popular projects found:', data.length, '→ unique:', result.length, `(${loadTime}ms)`);
            return result;
        } catch (error) {
            console.error('[ServicesService] 💥 Exception getting popular projects:', error);
            return [];
        }
    }

    /**
     * Obtener servicios populares (Hero Section)
     */
    static async getPopularServices(): Promise<ServiceItem[]> {
        try {
            console.log('[ServicesService] 🚀 Fetching popular services...');
            
            // Intentar primero con is_popular = true
            let { data, error } = await supabase
                .from('service_catalog')
                .select('*')
                .eq('is_active', true)
                .eq('is_popular', true)
                .order('display_order', { ascending: true, nullsFirst: false })
                .order('min_price', { ascending: true })
                .limit(10);

            if (error) {
                console.error('[ServicesService] ❌ Error fetching popular services (with is_popular):', error);
                // Intentar sin filtro is_popular
                const { data: data2, error: error2 } = await supabase
                    .from('service_catalog')
                    .select('*')
                    .eq('is_active', true)
                    .order('min_price', { ascending: true })
                    .limit(10);
                
                if (error2) {
                    console.error('[ServicesService] ❌ Error fetching all services:', error2);
                    return await this.getDefaultPopularServices();
                }
                
                data = data2;
            }

            console.log('[ServicesService] 📦 Services found:', data?.length || 0);
            
            if (!data || data.length === 0) {
                console.log('[ServicesService] ⚠️ No popular services found, using defaults');
                return await this.getDefaultPopularServices();
            }

            // Si hay servicios con is_popular, usarlos; si no, usar los primeros
            const popular = data.filter(s => s.is_popular === true);
            const result = popular.length > 0 ? popular : data.slice(0, 5);
            
            console.log('[ServicesService] ✅ Returning', result.length, 'popular services');
            return result;
        } catch (error) {
            console.error('[ServicesService] 💥 Exception getting popular services:', error);
            return await this.getDefaultPopularServices();
        }
    }

    /**
     * Obtener servicios por grupo de categoría
     */
    static async getServicesByCategoryGroup(group: string): Promise<ServiceItem[]> {
        try {
            let query = supabase
                .from('service_catalog')
                .select('*')
                .eq('is_active', true);

            // Si existe category_group, filtrar por él
            // Si no, mapear grupos a disciplinas
            if (group === 'mantenimiento') {
                query = query.in('discipline', ['carpinteria', 'pintura', 'limpieza', 'jardineria']);
            } else if (group === 'tecnologia') {
                query = query.in('discipline', ['cctv', 'wifi']);
            } else if (group === 'especializado') {
                query = query.in('discipline', ['fumigacion']);
            } else if (group === 'construccion') {
                query = query.in('discipline', ['tablaroca', 'construccion']);
            } else {
                // Si existe category_group en BD, usarlo
                query = query.eq('category_group', group);
            }

            const { data, error } = await query.order('min_price', { ascending: true });

            if (error) {
                console.error('[ServicesService] Error fetching services by group:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('[ServicesService] Error getting services by group:', error);
            return [];
        }
    }

    /**
     * Agrupa una lista plana de ítems del catálogo por `discipline` (misma lógica que el listado principal).
     */
    static groupServicesByDiscipline(services: ServiceItem[]): CategoryGroup[] {
        if (!services.length) return [];

        const byDiscipline = new Map<string, ServiceItem[]>();
        for (const row of services) {
            const raw = row.discipline?.toLowerCase().trim();
            const key = raw && raw.length > 0 ? raw : 'otros';
            if (!byDiscipline.has(key)) {
                byDiscipline.set(key, []);
            }
            byDiscipline.get(key)!.push(row);
        }

        const priority = new Map(CATEGORY_ORDER.map((id, i) => [id, i]));

        const sortKeys = (a: string, b: string) => {
            const pa = priority.has(a) ? priority.get(a)! : 1000;
            const pb = priority.has(b) ? priority.get(b)! : 1000;
            if (pa !== pb) return pa - pb;
            const na = CategoryService.getDisciplineConfig(a)?.name || a;
            const nb = CategoryService.getDisciplineConfig(b)?.name || b;
            return na.localeCompare(nb, 'es', { sensitivity: 'base' });
        };

        const keys = Array.from(byDiscipline.keys()).sort(sortKeys);

        return keys.map((discipline) => {
            const config = CategoryService.getDisciplineConfig(discipline);
            const list = byDiscipline.get(discipline)!;
            const name =
                discipline === 'otros'
                    ? 'Otros'
                    : config?.name ||
                      discipline
                          .split('-')
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(' ');
            return {
                id: discipline,
                name,
                icon: (config?.icon || 'layers-outline') as keyof typeof Ionicons.glyphMap,
                services: list,
            };
        });
    }

    /**
     * Obtener todos los servicios activos agrupados por disciplina (slug en `service_catalog.discipline`).
     * Una sola consulta; orden de secciones según prioridad de negocio, luego alfabético por nombre visible.
     */
    static async getAllServicesGrouped(): Promise<CategoryGroup[]> {
        try {
            console.log('[ServicesService] 🚀 Fetching all services grouped by discipline...');

            const { data, error } = await supabase
                .from('service_catalog')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true, nullsFirst: false })
                .order('completed_count', { ascending: false, nullsFirst: false })
                .order('min_price', { ascending: true })
                .limit(2000);

            if (error) {
                console.error('[ServicesService] ❌ Error fetching catalog for discipline groups:', error);
                return [];
            }

            if (!data?.length) {
                console.log('[ServicesService] ⚠️ No active services');
                return [];
            }

            const result = this.groupServicesByDiscipline(data);
            console.log(`[ServicesService] ✅ Discipline sections: ${result.length}`);
            return result;
        } catch (error) {
            console.error('[ServicesService] 💥 Exception getting all services grouped:', error);
            return [];
        }
    }

    /**
     * Búsqueda inteligente con filtros
     */
    static async searchServices(
        query?: string,
        filters?: {
            service_type?: 'express' | 'pro';
            category_group?: string;
            discipline?: string;
            max_price?: number;
            price_type?: 'fixed' | 'range' | 'starting_at';
        }
    ): Promise<ServiceItem[]> {
        try {
            let queryBuilder = supabase
                .from('service_catalog')
                .select('*')
                .eq('is_active', true);

            // Búsqueda por texto
            if (query && query.trim().length > 0) {
                queryBuilder = queryBuilder.or(
                    `service_name.ilike.%${query}%,description.ilike.%${query}%,discipline.ilike.%${query}%`
                );
            }

            // Filtros
            if (filters?.service_type) {
                queryBuilder = queryBuilder.eq('service_type', filters.service_type);
            }
            if (filters?.category_group) {
                queryBuilder = queryBuilder.eq('category_group', filters.category_group);
            }
            if (filters?.discipline) {
                queryBuilder = queryBuilder.eq('discipline', filters.discipline);
            }
            if (filters?.max_price) {
                queryBuilder = queryBuilder.lte('min_price', filters.max_price);
            }
            if (filters?.price_type) {
                queryBuilder = queryBuilder.eq('price_type', filters.price_type);
            }

            const { data, error } = await queryBuilder.order('min_price', { ascending: true });

            if (error) {
                console.error('[ServicesService] Error searching services:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('[ServicesService] Error searching services:', error);
            return [];
        }
    }

    /**
     * Obtener servicios por disciplina
     */
    static async getServicesByDiscipline(discipline: string): Promise<ServiceItem[]> {
        try {
            const { data, error } = await supabase
                .from('service_catalog')
                .select('*')
                .eq('discipline', discipline)
                .eq('is_active', true)
                .order('min_price', { ascending: true });

            if (error) {
                console.error('[ServicesService] Error fetching services by discipline:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('[ServicesService] Error getting services by discipline:', error);
            return [];
        }
    }

    /**
     * Obtener servicios con precio fijo
     */
    static async getFixedPriceServices(): Promise<ServiceItem[]> {
        try {
            const { data, error } = await supabase
                .from('service_catalog')
                .select('*')
                .eq('price_type', 'fixed')
                .eq('is_active', true)
                .order('min_price', { ascending: true })
                .limit(10);

            if (error) {
                console.error('[ServicesService] Error fetching fixed price services:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('[ServicesService] Error getting fixed price services:', error);
            return [];
        }
    }

    /**
     * Servicios populares por defecto (fallback)
     */
    private static async getDefaultPopularServices(): Promise<ServiceItem[]> {
        const popularDisciplines = ['electricidad', 'plomeria', 'aire-acondicionado'];
        const services: ServiceItem[] = [];

        for (const discipline of popularDisciplines) {
            const disciplineServices = await this.getServicesByDiscipline(discipline);
            if (disciplineServices.length > 0) {
                services.push(disciplineServices[0]);
            }
        }

        return services.slice(0, 5);
    }

    /**
     * Formatear precio para display
     */
    static formatPrice(service: ServiceItem): string {
        if (service.price_type === 'fixed') {
            return `$${service.min_price.toLocaleString('es-MX')} MXN`;
        } else if (service.price_type === 'range' && service.max_price) {
            return `$${service.min_price.toLocaleString('es-MX')} - $${service.max_price.toLocaleString('es-MX')}`;
        } else {
            return `Desde $${service.min_price.toLocaleString('es-MX')}`;
        }
    }
}

