import { supabase } from '@/lib/supabase';
import { ServiceItem } from './services';
import { findServiceByMapping, findServiceBySynonyms, ServiceMapping } from './serviceMapping';

export interface AISearchResult {
    detected_service: ServiceItem | null;
    alternatives: ServiceItem[];
    confidence: number;
    reasoning: string;
    pre_filled_data: {
        servicio?: string;
        disciplina?: string;
        descripcion?: string;
        urgencia?: 'baja' | 'media' | 'alta';
        precio_estimado?: { min: number; max: number };
    };
}

// URL de la API de Sumeeapp-B (interfaz web) - Fallback si no hay API key local
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://sumeeapp.com';

// API Key de Gemini (para llamadas directas a la API REST)
// Usar process.env directamente para evitar problemas de scope
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Función helper para obtener la API key
function getGeminiApiKey(): string | null {
    return process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || null;
}

/**
 * Palabras clave por disciplina para matching inteligente
 */
const DISCIPLINE_KEYWORDS: Record<string, string[]> = {
    'plomeria': [
        'fuga', 'agua', 'plomero', 'tubería', 'tuberia', 'baño', 'cocina', 'lavabo', 'inodoro',
        'regadera', 'llave', 'válvula', 'valvula', 'drenaje', 'desagüe', 'desague', 'calentador',
        'boiler', 'grifo', 'llave de agua', 'gotera', 'goteo', 'inundación', 'inundacion'
    ],
    'electricidad': [
        'electricista', 'luz', 'lámpara', 'lampara', 'apagador', 'interruptor', 'cable', 'cortocircuito',
        'fusible', 'breaker', 'contacto', 'enchufe', 'tomacorriente', 'instalación eléctrica',
        'instalacion electrica', 'cableado', 'corto', 'no prende', 'se fue la luz'
    ],
    'aire-acondicionado': [
        'aire acondicionado', 'clima', 'refrigeración', 'refrigeracion', 'calefacción', 'calefaccion',
        'split', 'minisplit', 'no enfría', 'no enfría', 'mantenimiento', 'limpieza', 'capacitor',
        'gas', 'refrigerante', 'unidad exterior', 'unidad interior'
    ],
    'cctv': [
        'cámara', 'camara', 'seguridad', 'vigilancia', 'cctv', 'video', 'grabación', 'grabacion',
        'monitoreo', 'alarma', 'sistema de seguridad'
    ],
    'wifi': [
        'wifi', 'internet', 'red', 'router', 'modem', 'conexión', 'conexion', 'señal', 'señal',
        'no funciona', 'lento', 'instalación de red', 'instalacion de red'
    ],
    'pintura': [
        'pintar', 'pintura', 'pintor', 'color', 'brocha', 'rodillo', 'pared', 'techo', 'habitación',
        'habitacion', 'casa', 'interior', 'exterior', 'acabado'
    ],
    'limpieza': [
        'limpieza', 'limpiar', 'aseo', 'limpieza profunda', 'limpieza residencial', 'mantenimiento',
        'casa limpia', 'oficina limpia'
    ],
    'jardineria': [
        'jardín', 'jardin', 'jardinero', 'césped', 'cesped', 'pasto', 'podar', 'cortar', 'plantas',
        'árbol', 'arbol', 'mantenimiento de jardín', 'mantenimiento de jardin'
    ],
    'carpinteria': [
        'carpintero', 'mueble', 'madera', 'armar', 'ensamblar', 'reparar mueble', 'mueble roto',
        'estantería', 'estanteria', 'mesa', 'silla', 'cajón', 'cajon'
    ],
    'armado': [
        'armar', 'ensamblar', 'mueble', 'ikea', 'mueble nuevo', 'instrucciones', 'montaje de mueble'
    ],
    'montaje': [
        'montar', 'instalar', 'tv', 'televisión', 'television', 'pantalla', 'pared', 'soporte',
        'bracket', 'colgar'
    ],
    'tablaroca': [
        'tablaroca', 'drywall', 'muro', 'pared', 'techo', 'construcción', 'construccion', 'división',
        'division', 'panel'
    ],
    'cargadores-electricos': [
        'cargador', 'eléctrico', 'electrico', 'vehículo', 'vehiculo', 'auto', 'coche', 'carga',
        'estación de carga', 'estacion de carga'
    ],
    'paneles-solares': [
        'panel solar', 'energía solar', 'energia solar', 'fotovoltaico', 'ahorro', 'luz solar',
        'instalación solar', 'instalacion solar'
    ],
    'fumigacion': [
        'fumigación', 'fumigacion', 'plaga', 'insecto', 'cucaracha', 'rata', 'ratón', 'raton',
        'control de plagas', 'exterminar'
    ],
    'arquitectos-ingenieros': [
        'arquitecto', 'ingeniero', 'diseño', 'diseño', 'planos', 'proyecto', 'construcción',
        'construccion', 'remodelación', 'remodelacion', 'consultoría', 'consultoria'
    ],
};

/**
 * Palabras clave de urgencia
 */
const URGENCY_KEYWORDS = {
    alta: ['urgente', 'emergencia', 'inmediato', 'ya', 'ahora', 'rápido', 'rapido', 'goteando', 'inundación', 'inundacion', 'no funciona', 'roto'],
    media: ['pronto', 'cuando puedas', 'esta semana', 'próximos días', 'proximos dias'],
    baja: ['cuando tengas tiempo', 'sin prisa', 'planificar', 'futuro'],
};

/**
 * Analizar problema del cliente y detectar servicio usando Google Gemini
 */
export class AISearchService {
    /**
     * Analizar descripción del problema usando Gemini API directamente o vía API route
     * Con integración de Service Mapping para precisión máxima
     */
    static async analyzeProblem(problemDescription: string): Promise<AISearchResult> {
        if (!problemDescription || problemDescription.trim().length < 5) {
            return {
                detected_service: null,
                alternatives: [],
                confidence: 0,
                reasoning: 'La descripción es muy corta. Por favor, describe tu problema con más detalle.',
                pre_filled_data: {},
            };
        }

        // CAPA 1: Verificar Service Mapping Database (navegación directa)
        const mapping = findServiceByMapping(problemDescription) || findServiceBySynonyms(problemDescription);
        
        if (mapping && mapping.confidence >= 0.9) {
            console.log('[AISearchService] Service mapping encontrado:', mapping.service_name);
            
            // Buscar el servicio en la BD
            const { data: mappedServices, error } = await supabase
                .from('service_catalog')
                .select('*')
                .eq('service_name', mapping.service_name)
                .eq('discipline', mapping.discipline)
                .eq('is_active', true)
                .limit(1);

            if (!error && mappedServices && mappedServices.length > 0) {
                const mappedService = mappedServices[0] as ServiceItem;
                
                // Obtener alternativas de la misma disciplina
                const { data: alternatives } = await supabase
                    .from('service_catalog')
                    .select('*')
                    .eq('discipline', mapping.discipline)
                    .eq('is_active', true)
                    .neq('id', mappedService.id)
                    .order('completed_count', { ascending: false })
                    .limit(3);

                return {
                    detected_service: mappedService,
                    alternatives: (alternatives || []) as ServiceItem[],
                    confidence: mapping.confidence,
                    reasoning: `Detecté que necesitas "${mapping.service_name}" basado en tu descripción.`,
                    pre_filled_data: {
                        servicio: mappedService.service_name,
                        disciplina: mapping.discipline,
                        descripcion: problemDescription,
                        urgencia: 'media' as const,
                        precio_estimado: {
                            min: mappedService.min_price || 0,
                            max: mappedService.max_price || mappedService.min_price * 1.5 || 0,
                        },
                    },
                };
            }
        }

        // CAPA 2: Si tenemos API key local, usar Gemini directamente
        const apiKey = getGeminiApiKey();
        if (apiKey) {
            try {
                return await this.analyzeWithGeminiDirect(problemDescription, apiKey);
            } catch (error) {
                console.warn('[AISearchService] Error con Gemini directo, usando fallback local:', error);
                // Si falla Gemini directo, usar fallback local (más confiable que API route)
                return await this.fallbackAnalysis(problemDescription);
            }
        }

        // CAPA 3: Si no hay API key local, intentar API route de Sumeeapp-B (solo si está disponible)
        // Si falla, usar fallback local inmediatamente
        try {
            const apiResult = await this.analyzeWithAPIRoute(problemDescription);
            // Verificar que el resultado sea válido antes de retornarlo
            if (apiResult && apiResult.detected_service) {
                return apiResult;
            }
            // Si el resultado no es válido, usar fallback
            console.warn('[AISearchService] API route retornó resultado inválido, usando fallback local');
            return await this.fallbackAnalysis(problemDescription);
        } catch (error: any) {
            // Si la API route no existe (404) o hay otro error, usar fallback local silenciosamente
            if (error.message?.includes('404') || error.message?.includes('API error: 404')) {
                console.log('[AISearchService] API route no disponible (404), usando análisis local');
            } else {
                console.warn('[AISearchService] Error con API route, usando fallback local:', error.message || error);
            }
            // Fallback final a análisis local (siempre funciona)
            return await this.fallbackAnalysis(problemDescription);
        }
    }

    /**
     * Analizar usando Gemini directamente desde el cliente (vía API REST)
     */
    private static async analyzeWithGeminiDirect(problemDescription: string, apiKey: string): Promise<AISearchResult> {
        if (!apiKey) {
            throw new Error('Gemini API key no configurada');
        }

        // 1. Obtener servicios de Supabase
        const { data: services, error: servicesError } = await supabase
            .from('service_catalog')
            .select('id, service_name, discipline, min_price, max_price, description')
            .eq('is_active', true)
            .order('completed_count', { ascending: false })
            .limit(50);

        if (servicesError || !services || services.length === 0) {
            throw new Error('No se pudieron obtener servicios');
        }

        // 2. Construir prompt mejorado para Gemini con ejemplos específicos
        const servicesList = services
            .map((s, idx) => `${idx + 1}. ${s.service_name} (${s.discipline}) - Desde $${s.min_price}`)
            .join('\n');

        const prompt = `Eres un asistente experto de Sumee App, una plataforma mexicana que conecta clientes con técnicos verificados.

CONTEXTO:
El cliente describe: "${problemDescription}"

SERVICIOS DISPONIBLES (ORDENADOS POR RELEVANCIA):
${servicesList}

INSTRUCCIONES CRÍTICAS:
1. **PRECISIÓN MÁXIMA**: Debes seleccionar el servicio MÁS ESPECÍFICO que coincida exactamente con la necesidad del cliente.
2. **NO GENERALIZAR**: Si el cliente dice "lámpara", NO selecciones "tablero eléctrico" solo porque ambos son de electricidad.
3. **MATCHING EXACTO**: Busca palabras clave específicas en el nombre del servicio:
   - "lámpara" o "lampara" → Busca "Instalación de Lámpara" (NO "Actualización de tablero eléctrico")
   - "fuga" → Busca "Reparación de Fuga" (NO "Instalación de tubería")
   - "aire no enfría" → Busca "Reparación de Aire Acondicionado" (NO "Instalación de Aire Acondicionado")

EJEMPLOS DE MATCHING CORRECTO:
- "necesito instalar una lámpara" → "Instalación de Lámpara" ✅ (NO "Actualización de tablero eléctrico" ❌)
- "tengo una fuga de agua" → "Reparación de Fuga" ✅ (NO "Instalación de tubería" ❌)
- "mi aire no enfría" → "Reparación de Aire Acondicionado" ✅ (NO "Instalación de Aire Acondicionado" ❌)
- "quiero pintar mi habitación" → "Pintura de interiores" ✅

ANÁLISIS REQUERIDO:
1. Extrae palabras clave del problema: [objeto, acción, urgencia]
2. Busca el servicio que contenga estas palabras clave en su nombre EXACTO
3. Si no hay match exacto, busca el más similar semánticamente dentro de la misma disciplina
4. Determina urgencia: "alta" (urgente, no funciona, roto), "media" (pronto, esta semana), "baja" (sin prisa, planificar)
5. Estima precio basado en el servicio específico seleccionado

RESPONDE EN FORMATO JSON ESTRICTO (sin markdown, sin código, solo JSON):
{
  "service_name": "Nombre EXACTO del servicio de la lista (debe coincidir palabra por palabra)",
  "discipline": "disciplina del servicio",
  "confidence": 0.95,
  "reasoning": "Explicación detallada de por qué este servicio específico es el adecuado",
  "matched_keywords": ["palabra1", "palabra2"],
  "urgency": "alta|media|baja",
  "price_estimate": {
    "min": 500,
    "max": 800
  },
  "alternatives": ["Nombre servicio alternativo 1", "Nombre servicio alternativo 2"]
}`;

        // 3. Llamar a Gemini API REST (compatible con React Native)
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }],
                }],
                generationConfig: {
                    temperature: 0.3,
                    topK: 20,
                    topP: 0.8,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const result = await response.json();
        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('[AISearchService] Gemini response:', responseText);

        // 4. Parsear respuesta
        let geminiResult: any;
        try {
            const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            geminiResult = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('[AISearchService] Error parsing Gemini response:', parseError);
            throw new Error('Error parseando respuesta de Gemini');
        }

        // 5. Buscar servicio en BD con matching mejorado
        // Primero intentar match exacto por nombre
        let detectedService = services.find(
            (s) => s.service_name.toLowerCase().trim() === geminiResult.service_name?.toLowerCase().trim()
        );

        // Si no hay match exacto, buscar por similitud parcial (contiene el nombre)
        if (!detectedService) {
            const queryLower = geminiResult.service_name?.toLowerCase() || '';
            detectedService = services.find((s) => {
                const serviceNameLower = s.service_name.toLowerCase();
                // Verificar si el nombre del servicio contiene palabras clave del query
                const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
                return queryWords.some(word => serviceNameLower.includes(word)) &&
                       s.discipline === geminiResult.discipline;
            });
        }

        // Si aún no hay match, buscar por disciplina y usar el más popular
        if (!detectedService) {
            const disciplineServices = services
                .filter((s) => s.discipline === geminiResult.discipline)
                .sort((a, b) => (b.completed_count || 0) - (a.completed_count || 0));
            
            if (disciplineServices.length > 0) {
                detectedService = disciplineServices[0];
            }
        }

        if (!detectedService) {
            throw new Error('Servicio no encontrado');
        }

        const alternatives = services
            .filter((s) => s.discipline === detectedService.discipline && s.id !== detectedService.id)
            .slice(0, 3);

        return this.buildResult(detectedService, alternatives, geminiResult, problemDescription);
    }

    /**
     * Analizar usando API route de Sumeeapp-B (fallback)
     * Retorna error si la ruta no está disponible o hay problemas de conexión
     */
    private static async analyzeWithAPIRoute(problemDescription: string): Promise<AISearchResult> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    problemDescription: problemDescription.trim(),
                }),
                // Timeout de 5 segundos para evitar esperas largas
                signal: AbortSignal.timeout(5000),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

        const result = await response.json();

        const detectedService: ServiceItem | null = result.detected_service
            ? {
                  id: result.detected_service.id,
                  service_name: result.detected_service.service_name,
                  discipline: result.detected_service.discipline,
                  price_type: 'fixed' as const,
                  min_price: result.detected_service.min_price,
                  max_price: result.detected_service.max_price,
                  unit: 'servicio',
                  includes_materials: false,
                  description: null,
              }
            : null;

        const alternatives: ServiceItem[] = result.alternatives.map((alt: any) => ({
            id: alt.id,
            service_name: alt.service_name,
            discipline: alt.discipline,
            price_type: 'fixed' as const,
            min_price: alt.min_price,
            max_price: null,
            unit: 'servicio',
            includes_materials: false,
            description: null,
        }));

        return {
            detected_service: detectedService,
            alternatives,
            confidence: result.confidence || 0.7,
            reasoning: result.reasoning || 'Servicio detectado',
            pre_filled_data: result.pre_filled_data || {},
        };
        } catch (fetchError: any) {
            // Si hay error de red, timeout, o cualquier otro error, relanzar
            if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
                throw new Error('API timeout: La solicitud tardó demasiado');
            }
            throw fetchError;
        }
    }

    /**
     * Construir resultado final
     */
    private static buildResult(
        detectedService: any,
        alternatives: any[],
        geminiResult: any,
        problemDescription: string
    ): AISearchResult {
        return {
            detected_service: {
                id: detectedService.id,
                service_name: detectedService.service_name,
                discipline: detectedService.discipline,
                price_type: 'fixed' as const,
                min_price: detectedService.min_price,
                max_price: detectedService.max_price,
                unit: 'servicio',
                includes_materials: false,
                description: null,
            } as ServiceItem,
            alternatives: alternatives.map((alt) => ({
                id: alt.id,
                service_name: alt.service_name,
                discipline: alt.discipline,
                price_type: 'fixed' as const,
                min_price: alt.min_price,
                max_price: alt.max_price,
                unit: 'servicio',
                includes_materials: false,
                description: null,
            })) as ServiceItem[],
            confidence: geminiResult.confidence || 0.8,
            reasoning: geminiResult.reasoning || `Detecté que necesitas un servicio de ${detectedService.discipline}. "${detectedService.service_name}" es el más adecuado para tu problema.`,
            pre_filled_data: {
                servicio: detectedService.service_name,
                disciplina: detectedService.discipline,
                descripcion: problemDescription,
                urgencia: geminiResult.urgency || 'media',
                precio_estimado: geminiResult.price_estimate || {
                    min: detectedService.min_price,
                    max: detectedService.max_price || detectedService.min_price * 1.5,
                },
            },
        };
    }

    /**
     * Análisis de fallback usando keywords (si Gemini no está disponible)
     */
    private static async fallbackAnalysis(problemDescription: string): Promise<AISearchResult> {
        if (!problemDescription || problemDescription.trim().length < 5) {
            return {
                detected_service: null,
                alternatives: [],
                confidence: 0,
                reasoning: 'La descripción es muy corta. Por favor, describe tu problema con más detalle.',
                pre_filled_data: {},
            };
        }

        const description = problemDescription.toLowerCase().trim();
        
        // 1. Detectar disciplina usando palabras clave
        const disciplineScores: Record<string, number> = {};
        
        for (const [discipline, keywords] of Object.entries(DISCIPLINE_KEYWORDS)) {
            let score = 0;
            for (const keyword of keywords) {
                if (description.includes(keyword.toLowerCase())) {
                    score += 1;
                }
            }
            if (score > 0) {
                disciplineScores[discipline] = score;
            }
        }

        // 2. Determinar urgencia
        let urgency: 'baja' | 'media' | 'alta' = 'media';
        for (const [level, keywords] of Object.entries(URGENCY_KEYWORDS)) {
            if (keywords.some(keyword => description.includes(keyword))) {
                urgency = level as 'baja' | 'media' | 'alta';
                break;
            }
        }

        // 3. Encontrar la disciplina con mayor score
        const sortedDisciplines = Object.entries(disciplineScores)
            .sort((a, b) => b[1] - a[1]);

        if (sortedDisciplines.length === 0) {
            // No se detectó ninguna disciplina, buscar en todos los servicios
            return await this.searchInAllServices(description, urgency);
        }

        const [detectedDiscipline, score] = sortedDisciplines[0];
        const confidence = Math.min(0.95, 0.5 + (score / 10)); // Normalizar a 0.5-0.95

        // 4. Buscar servicios en la disciplina detectada
        const { data: services, error } = await supabase
            .from('service_catalog')
            .select('*')
            .eq('discipline', detectedDiscipline)
            .eq('is_active', true)
            .order('completed_count', { ascending: false })
            .limit(10);

        if (error || !services || services.length === 0) {
            return {
                detected_service: null,
                alternatives: [],
                confidence: 0,
                reasoning: `Detecté que necesitas un servicio de ${detectedDiscipline}, pero no encontré servicios disponibles en este momento.`,
                pre_filled_data: {
                    disciplina: detectedDiscipline,
                    descripcion: problemDescription,
                    urgencia: urgency,
                },
            };
        }

        // 5. Seleccionar el servicio más relevante
        const detectedService = services[0];
        const alternatives = services.slice(1, 4);

        // 6. Estimar precio
        const estimatedPrice = {
            min: detectedService.min_price || 0,
            max: detectedService.max_price || detectedService.min_price * 1.5 || 0,
        };

        // 7. Generar reasoning
        const reasoning = this.generateReasoning(
            detectedDiscipline,
            detectedService.service_name,
            score,
            description
        );

        return {
            detected_service: detectedService as ServiceItem,
            alternatives: alternatives as ServiceItem[],
            confidence,
            reasoning,
            pre_filled_data: {
                servicio: detectedService.service_name,
                disciplina: detectedDiscipline,
                descripcion: problemDescription,
                urgencia: urgency, // Usar la variable urgency definida arriba
                precio_estimado: estimatedPrice,
            },
        };
    }

    /**
     * Buscar en todos los servicios si no se detecta disciplina específica
     */
    private static async searchInAllServices(
        description: string,
        urgency: 'baja' | 'media' | 'alta'
    ): Promise<AISearchResult> {
        // Buscar servicios que coincidan con palabras clave en el nombre
        const words = description.split(/\s+/).filter(w => w.length > 3);
        
        const { data: services, error } = await supabase
            .from('service_catalog')
            .select('*')
            .eq('is_active', true)
            .order('completed_count', { ascending: false })
            .limit(20);

        if (error || !services || services.length === 0) {
            return {
                detected_service: null,
                alternatives: [],
                confidence: 0,
                reasoning: 'No pude identificar el servicio que necesitas. Por favor, intenta ser más específico o busca manualmente.',
                pre_filled_data: {
                    descripcion: description,
                    urgencia: urgency,
                },
            };
        }

        // Buscar servicios que contengan palabras clave
        const matchingServices = services.filter(service => {
            const serviceName = service.service_name?.toLowerCase() || '';
            return words.some(word => serviceName.includes(word));
        });

        if (matchingServices.length > 0) {
            return {
                detected_service: matchingServices[0] as ServiceItem,
                alternatives: matchingServices.slice(1, 4) as ServiceItem[],
                confidence: 0.6,
                reasoning: `Encontré servicios relacionados con "${words.join(', ')}". Te sugiero el más popular.`,
                pre_filled_data: {
                    servicio: matchingServices[0].service_name,
                    disciplina: matchingServices[0].discipline,
                    descripcion: description,
                    urgencia: urgency,
                    precio_estimado: {
                        min: matchingServices[0].min_price || 0,
                        max: matchingServices[0].max_price || matchingServices[0].min_price * 1.5 || 0,
                    },
                },
            };
        }

        // Si no hay coincidencias, retornar el servicio más popular
        return {
            detected_service: services[0] as ServiceItem,
            alternatives: services.slice(1, 4) as ServiceItem[],
            confidence: 0.4,
            reasoning: 'No pude identificar exactamente el servicio que necesitas. Te muestro los servicios más populares.',
            pre_filled_data: {
                servicio: services[0].service_name,
                disciplina: services[0].discipline,
                descripcion: description,
                urgencia: urgency,
                precio_estimado: {
                    min: services[0].min_price || 0,
                    max: services[0].max_price || services[0].min_price * 1.5 || 0,
                },
            },
        };
    }

    /**
     * Generar explicación de por qué se eligió este servicio
     */
    private static generateReasoning(
        discipline: string,
        serviceName: string,
        score: number,
        description: string
    ): string {
        const disciplineNames: Record<string, string> = {
            'plomeria': 'plomería',
            'electricidad': 'electricidad',
            'aire-acondicionado': 'climatización',
            'cctv': 'CCTV y seguridad',
            'wifi': 'redes WiFi',
            'pintura': 'pintura',
            'limpieza': 'limpieza',
            'jardineria': 'jardinería',
            'carpinteria': 'carpintería',
            'armado': 'armado de muebles',
            'montaje': 'montaje e instalación',
            'tablaroca': 'tablaroca',
            'cargadores-electricos': 'cargadores eléctricos',
            'paneles-solares': 'paneles solares',
            'fumigacion': 'fumigación',
            'arquitectos-ingenieros': 'arquitectura e ingeniería',
        };

        const disciplineName = disciplineNames[discipline] || discipline;
        
        if (score >= 3) {
            return `Detecté claramente que necesitas un servicio de ${disciplineName}. Basado en tu descripción, "${serviceName}" es el servicio más adecuado para resolver tu problema.`;
        } else if (score >= 2) {
            return `Parece que necesitas un servicio de ${disciplineName}. Te sugiero "${serviceName}" como la mejor opción para tu situación.`;
        } else {
            return `Basado en tu descripción, podría ser útil un servicio de ${disciplineName}. Te recomiendo "${serviceName}", pero puedes revisar otras opciones si no es exactamente lo que necesitas.`;
        }
    }
}

