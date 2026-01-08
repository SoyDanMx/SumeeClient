import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { CategoryService } from '@/services/categories';

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
            
            // Obtener servicios con precio fijo y que sean populares
            let { data, error } = await supabase
                .from('service_catalog')
                .select('*')
                .eq('is_active', true)
                .eq('price_type', 'fixed')
                .eq('is_popular', true)
                .order('completed_count', { ascending: false, nullsFirst: false })
                .order('display_order', { ascending: true, nullsFirst: false })
                .limit(20); // Obtener más para filtrar duplicados

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
            
            console.log('[ServicesService] 📦 Popular projects found:', data.length, '→ unique:', result.length);
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
     * Obtener todos los servicios organizados por grupos
     * Primero muestra servicios populares de disciplinas prioritarias, luego todos los demás
     */
    static async getAllServicesGrouped(): Promise<CategoryGroup[]> {
        try {
            console.log('[ServicesService] 🚀 Fetching all services grouped...');
            
            const result: CategoryGroup[] = [];
            
            // Disciplinas prioritarias con servicios populares primero
            const priorityDisciplines = [
                'electricidad',
                'plomeria',
                'cctv',
                'cargadores-electricos',
                'paneles-solares'
            ];
            
            // 1. PRIMERO: Servicios populares de disciplinas prioritarias
            for (const discipline of priorityDisciplines) {
                try {
                    // Obtener servicios populares de esta disciplina
                    const { data, error } = await supabase
                        .from('service_catalog')
                        .select('*')
                        .eq('is_active', true)
                        .eq('discipline', discipline)
                        .eq('is_popular', true)
                        .order('completed_count', { ascending: false, nullsFirst: false })
                        .order('min_price', { ascending: true });
                    
                    if (error) {
                        console.warn(`[ServicesService] ⚠️ Error fetching popular services for ${discipline}:`, error);
                        continue;
                    }
                    
                    if (data && data.length > 0) {
                        // Obtener configuración de la disciplina
                        const config = CategoryService.getDisciplineConfig(discipline);
                        
                        result.push({
                            id: `popular-${discipline}`,
                            name: config?.name || discipline,
                            icon: config?.icon || 'star',
                            services: data,
                        });
                        
                        console.log(`[ServicesService] ✅ Added ${data.length} popular services for ${discipline}`);
                    }
                } catch (error) {
                    console.error(`[ServicesService] 💥 Exception fetching popular services for ${discipline}:`, error);
                }
            }
            
            // 2. SEGUNDO: Todos los demás servicios agrupados por categoría
            const groups = ['mantenimiento', 'tecnologia', 'especializado', 'construccion'];
            
            for (const groupId of groups) {
                const services = await this.getServicesByCategoryGroup(groupId);
                if (services.length > 0) {
                    // Filtrar servicios que ya están en los grupos prioritarios
                    const priorityDisciplineSet = new Set(priorityDisciplines);
                    const filteredServices = services.filter(service => {
                        const discipline = service.discipline?.toLowerCase();
                        // Si es una disciplina prioritaria y es popular, ya está en los grupos prioritarios
                        if (priorityDisciplineSet.has(discipline) && service.is_popular) {
                            return false;
                        }
                        return true;
                    });
                    
                    if (filteredServices.length > 0) {
                        const groupConfig = CATEGORY_GROUPS[groupId];
                        result.push({
                            id: groupId,
                            name: groupConfig.name,
                            icon: groupConfig.icon,
                            services: filteredServices,
                        });
                        
                        console.log(`[ServicesService] ✅ Added ${filteredServices.length} services for group ${groupId}`);
                    }
                }
            }
            
            console.log(`[ServicesService] ✅ Total groups: ${result.length}`);
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

