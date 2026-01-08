/**
 * Service Mapping Database
 * Mapeo de queries comunes a servicios específicos para navegación directa
 * y precisión del 100% en casos conocidos
 */

export interface ServiceMapping {
    query_pattern: RegExp | string; // Regex o frase exacta
    service_name: string;            // Nombre exacto del servicio en BD
    discipline: string;               // Disciplina del servicio
    synonyms: string[];               // Sinónimos y variaciones
    confidence: number;               // Confianza del mapeo (0-1)
    keywords: string[];              // Palabras clave que deben aparecer
}

/**
 * Mapeo de queries comunes a servicios específicos
 * Ordenado por frecuencia de uso
 */
export const SERVICE_MAPPINGS: ServiceMapping[] = [
    // ELECTRICIDAD
    {
        query_pattern: /(necesito|quiero|deseo|requiero).*(instalar|poner|colocar).*(lámpara|lampara|luz|iluminación|foco|bombilla)/i,
        service_name: 'Instalación de Lámpara',
        discipline: 'electricidad',
        synonyms: ['lámpara', 'lampara', 'luz', 'iluminación', 'foco', 'bombilla', 'luminaria'],
        confidence: 0.98,
        keywords: ['instalar', 'lámpara', 'luz']
    },
    {
        query_pattern: /(instalar|poner|colocar).*(lámpara|lampara|luz|iluminación)/i,
        service_name: 'Instalación de Lámpara',
        discipline: 'electricidad',
        synonyms: ['lámpara', 'lampara', 'luz', 'iluminación'],
        confidence: 0.95,
        keywords: ['instalar', 'lámpara']
    },
    {
        query_pattern: /(instalar|poner|colocar).*(luminaria|led)/i,
        service_name: 'Instalación de Luminaria LED',
        discipline: 'electricidad',
        synonyms: ['luminaria', 'led', 'luz led'],
        confidence: 0.95,
        keywords: ['instalar', 'luminaria', 'led']
    },
    {
        query_pattern: /(instalar|poner|colocar).*(ventilador|fan).*(techo)/i,
        service_name: 'Instalación de Ventilador de Techo',
        discipline: 'electricidad',
        synonyms: ['ventilador', 'fan', 'techo'],
        confidence: 0.95,
        keywords: ['instalar', 'ventilador', 'techo']
    },
    {
        query_pattern: /(corto|circuito|cortocircuito|se fue la luz|no hay luz)/i,
        service_name: 'Reparación de Corto Circuito',
        discipline: 'electricidad',
        synonyms: ['corto', 'circuito', 'cortocircuito'],
        confidence: 0.90,
        keywords: ['corto', 'circuito']
    },
    {
        query_pattern: /(cambiar|reemplazar|arreglar).*(breaker|fusible)/i,
        service_name: 'Cambio de Breaker',
        discipline: 'electricidad',
        synonyms: ['breaker', 'fusible', 'interruptor'],
        confidence: 0.90,
        keywords: ['breaker', 'fusible']
    },
    {
        query_pattern: /(instalar|poner|colocar).*(contacto|enchufe|tomacorriente)/i,
        service_name: 'Instalación de Contacto',
        discipline: 'electricidad',
        synonyms: ['contacto', 'enchufe', 'tomacorriente'],
        confidence: 0.90,
        keywords: ['instalar', 'contacto', 'enchufe']
    },
    {
        query_pattern: /(instalar|poner|colocar).*(apagador|interruptor)/i,
        service_name: 'Instalación de Apagador',
        discipline: 'electricidad',
        synonyms: ['apagador', 'interruptor'],
        confidence: 0.90,
        keywords: ['instalar', 'apagador', 'interruptor']
    },
    {
        query_pattern: /(actualizar|arreglar|reparar).*(tablero|tablero eléctrico)/i,
        service_name: 'Actualización de Tablero Eléctrico',
        discipline: 'electricidad',
        synonyms: ['tablero', 'tablero eléctrico'],
        confidence: 0.90,
        keywords: ['tablero', 'eléctrico']
    },
    
    // PLOMERÍA
    {
        query_pattern: /(tengo|hay|tiene).*(fuga|goteo|escape|pérdida).*(agua|llave|grifo|tubería)/i,
        service_name: 'Reparación de Fuga',
        discipline: 'plomeria',
        synonyms: ['fuga', 'goteo', 'escape', 'pérdida'],
        confidence: 0.95,
        keywords: ['fuga', 'agua']
    },
    {
        query_pattern: /(fuga|goteo|escape).*(agua)/i,
        service_name: 'Reparación de Fuga',
        discipline: 'plomeria',
        synonyms: ['fuga', 'goteo'],
        confidence: 0.90,
        keywords: ['fuga']
    },
    {
        query_pattern: /(instalar|poner|colocar).*(tinaco)/i,
        service_name: 'Instalación de Tinaco (Azotea)',
        discipline: 'plomeria',
        synonyms: ['tinaco'],
        confidence: 0.90,
        keywords: ['instalar', 'tinaco']
    },
    {
        query_pattern: /(instalar|poner|colocar).*(boiler|calentador)/i,
        service_name: 'Instalación de Boiler (Paso/Depósito)',
        discipline: 'plomeria',
        synonyms: ['boiler', 'calentador'],
        confidence: 0.90,
        keywords: ['instalar', 'boiler']
    },
    
    // AIRE ACONDICIONADO
    {
        query_pattern: /(aire|clima).*(no enfría|no funciona|no prende|está roto)/i,
        service_name: 'Reparación de Aire Acondicionado',
        discipline: 'aire-acondicionado',
        synonyms: ['aire', 'clima', 'no enfría'],
        confidence: 0.90,
        keywords: ['aire', 'no enfría']
    },
    {
        query_pattern: /(instalar|poner|colocar).*(aire|clima|split|minisplit)/i,
        service_name: 'Instalación de Aire Acondicionado',
        discipline: 'aire-acondicionado',
        synonyms: ['aire', 'clima', 'split'],
        confidence: 0.90,
        keywords: ['instalar', 'aire']
    },
    {
        query_pattern: /(mantenimiento|limpieza).*(aire|clima)/i,
        service_name: 'Mantenimiento Preventivo (Limpieza)',
        discipline: 'aire-acondicionado',
        synonyms: ['mantenimiento', 'limpieza'],
        confidence: 0.90,
        keywords: ['mantenimiento', 'aire']
    },
    
    // PINTURA
    {
        query_pattern: /(pintar|pintura).*(habitación|cuarto|sala|casa|interior)/i,
        service_name: 'Pintura de interiores',
        discipline: 'pintura',
        synonyms: ['pintar', 'pintura', 'interior'],
        confidence: 0.90,
        keywords: ['pintar', 'interior']
    },
    
    // JARDINERÍA
    {
        query_pattern: /(cortar|mantenimiento|jardín|jardin|pasto|cesped)/i,
        service_name: 'Mantenimiento de jardín',
        discipline: 'jardineria',
        synonyms: ['jardín', 'pasto', 'césped'],
        confidence: 0.90,
        keywords: ['jardín', 'pasto']
    },
];

/**
 * Buscar servicio por query usando mapeo
 */
export function findServiceByMapping(userQuery: string): ServiceMapping | null {
    const normalizedQuery = userQuery.toLowerCase().trim();
    
    // Buscar por orden de confianza (mayor primero)
    const sortedMappings = [...SERVICE_MAPPINGS].sort((a, b) => b.confidence - a.confidence);
    
    for (const mapping of sortedMappings) {
        // Verificar patrón regex o string exacto
        let matches = false;
        
        if (mapping.query_pattern instanceof RegExp) {
            matches = mapping.query_pattern.test(normalizedQuery);
        } else {
            matches = normalizedQuery.includes(mapping.query_pattern.toLowerCase());
        }
        
        // Verificar que todas las keywords estén presentes
        if (matches) {
            const hasAllKeywords = mapping.keywords.every(keyword =>
                normalizedQuery.includes(keyword.toLowerCase())
            );
            
            if (hasAllKeywords) {
                return mapping;
            }
        }
    }
    
    return null;
}

/**
 * Buscar servicio por sinónimos
 */
export function findServiceBySynonyms(userQuery: string): ServiceMapping | null {
    const normalizedQuery = userQuery.toLowerCase().trim();
    
    for (const mapping of SERVICE_MAPPINGS) {
        const hasSynonym = mapping.synonyms.some(synonym =>
            normalizedQuery.includes(synonym.toLowerCase())
        );
        
        if (hasSynonym) {
            // Verificar que al menos una keyword principal esté presente
            const hasMainKeyword = mapping.keywords.some(keyword =>
                normalizedQuery.includes(keyword.toLowerCase())
            );
            
            if (hasMainKeyword) {
                return mapping;
            }
        }
    }
    
    return null;
}

