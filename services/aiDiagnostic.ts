/**
 * Diagnóstico asistido por IA (TulBox) — el cliente solo envía el texto del usuario.
 * La API key de Gemini debe vivir en el backend; este módulo llama a un endpoint HTTP.
 */

const API_BASE =
    process.env.EXPO_PUBLIC_AI_DIAGNOSTIC_URL ||
    (process.env.EXPO_PUBLIC_API_URL || 'https://tulbox.pro').replace(/\/$/, '') + '/api/ai-diagnostico';

export type ProfesionalCategoria =
    | 'plomero'
    | 'electricista'
    | 'cerrajero'
    | 'pintor'
    | 'cctv'
    | 'general';

export type NivelUrgencia = 'bajo' | 'medio' | 'alto';
export type NivelUrgenciaExtendido = NivelUrgencia | 'critico';

export interface AIDiagnosticCTA {
    type: 'normal' | 'urgente' | 'emergencia';
    label: string;
    action: 'abrir_checkout_tecnico' | 'llamar_tecnico' | 'agendar_visita';
    prioridad: 'baja' | 'media' | 'alta' | 'inmediata';
    estimated_range?: {
        currency: 'MXN' | 'USD';
        min: number;
        max: number;
    } | null;
}

export interface AIDiagnosticResult {
    diagnostico: string;
    categoria_profesional: ProfesionalCategoria;
    nivel_urgencia: NivelUrgenciaExtendido;
    advertencia_seguridad: string | null;
    causas_probables: string[];
    que_hara_el_tecnico: string;
    confidence: number;
    preguntas_siguientes: string[];
    disclaimer: string;
    cta: AIDiagnosticCTA;
}

const CATEGORIAS: ProfesionalCategoria[] = [
    'plomero',
    'electricista',
    'cerrajero',
    'pintor',
    'cctv',
    'general',
];

const URGENCIAS: NivelUrgenciaExtendido[] = ['bajo', 'medio', 'alto', 'critico'];

/*
 * ---------------------------------------------------------------------------
 * SYSTEM PROMPT (referencia para el backend con Gemini)
 * ---------------------------------------------------------------------------
 * Configurar Gemini con response_mime_type: "application/json" y usar exactamente:
 *
 * 'Eres el experto de diagnóstico de mantenimiento de TulBox. Tu objetivo es leer el problema del usuario, darle una breve explicación técnica pero fácil de entender, y categorizar el tipo de profesional que necesita. NUNCA des instrucciones de cómo arreglar el problema paso a paso por motivos de responsabilidad legal y seguridad. Responde ÚNICAMENTE con un objeto JSON válido con esta estructura:
 * {
 * "diagnostico": "Explicación breve y empática de qué pudo haber pasado.",
 * "categoria_profesional": "electricista", // Solo opciones: plomero, electricista, cerrajero, pintor, cctv, general
 * "nivel_urgencia": "alto", // bajo, medio, alto
 * "advertencia_seguridad": "Si el problema involucra gas, electricidad o riesgo estructural, escribe una advertencia corta de no tocar nada. Si no hay riesgo, devuelve null."
 * }'
 *
 * Payload sugerido desde el frontend al backend: POST JSON { "problem_description": "<texto del usuario>" }
 * El backend concatena el user message y aplica el system prompt anterior.
 * ---------------------------------------------------------------------------
 */

function normalizeResult(raw: unknown): AIDiagnosticResult | null {
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    const diagnostico =
        typeof o.diagnostico_breve === 'string'
            ? o.diagnostico_breve.trim()
            : typeof o.diagnostico === 'string'
              ? o.diagnostico.trim()
              : '';
    const catRaw =
        typeof o.categoria_profesional === 'string'
            ? o.categoria_profesional
            : typeof o.categoria === 'string'
              ? o.categoria
              : '';
    const cat = catRaw.trim().toLowerCase();
    const urg = typeof o.nivel_urgencia === 'string' ? o.nivel_urgencia.trim().toLowerCase() : '';
    let advertencia: string | null = null;
    const warningSource = o.advertencia_seguridad ?? o.mensaje_seguridad;
    if (warningSource === null || warningSource === undefined) {
        advertencia = null;
    } else if (typeof warningSource === 'string' && warningSource.trim()) {
        advertencia = warningSource.trim();
    }

    const categoria_profesional = CATEGORIAS.includes(cat as ProfesionalCategoria)
        ? (cat as ProfesionalCategoria)
        : 'general';
    const nivel_urgencia = URGENCIAS.includes(urg as NivelUrgenciaExtendido)
        ? (urg as NivelUrgenciaExtendido)
        : 'medio';

    const causesSource = Array.isArray(o.causas_probables) ? o.causas_probables : [];
    const causas_probables = causesSource
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
        .slice(0, 4);

    const que_hara_el_tecnico =
        typeof o.que_hara_el_tecnico === 'string' && o.que_hara_el_tecnico.trim().length > 0
            ? o.que_hara_el_tecnico.trim()
            : `Un ${categoria_profesional} certificado de TulBox revisará el problema en sitio y aplicará la corrección segura correspondiente.`;

    const confidenceRaw = typeof o.confidence === 'number' ? o.confidence : 0.7;
    const confidence = Math.max(0, Math.min(1, confidenceRaw));

    const preguntasSource = Array.isArray(o.preguntas_siguientes) ? o.preguntas_siguientes : [];
    const preguntas_siguientes = preguntasSource
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
        .slice(0, 3);

    const disclaimer =
        typeof o.disclaimer === 'string' && o.disclaimer.trim().length > 0
            ? o.disclaimer.trim()
            : 'Este prediagnóstico es informativo y no sustituye una revisión técnica en sitio.';

    const rawCta = o.cta && typeof o.cta === 'object' ? (o.cta as Record<string, unknown>) : null;
    const ctaType =
        rawCta && typeof rawCta.type === 'string' && ['normal', 'urgente', 'emergencia'].includes(rawCta.type)
            ? (rawCta.type as AIDiagnosticCTA['type'])
            : nivel_urgencia === 'critico'
              ? 'emergencia'
              : nivel_urgencia === 'alto'
                ? 'urgente'
                : 'normal';
    const ctaAction =
        rawCta &&
        typeof rawCta.action === 'string' &&
        ['abrir_checkout_tecnico', 'llamar_tecnico', 'agendar_visita'].includes(rawCta.action)
            ? (rawCta.action as AIDiagnosticCTA['action'])
            : ctaType === 'emergencia'
              ? 'llamar_tecnico'
              : 'abrir_checkout_tecnico';
    const ctaPriority =
        rawCta &&
        typeof rawCta.prioridad === 'string' &&
        ['baja', 'media', 'alta', 'inmediata'].includes(rawCta.prioridad)
            ? (rawCta.prioridad as AIDiagnosticCTA['prioridad'])
            : ctaType === 'emergencia'
              ? 'inmediata'
              : ctaType === 'urgente'
                ? 'alta'
                : 'media';
    const ctaLabel =
        rawCta && typeof rawCta.label === 'string' && rawCta.label.trim().length > 0
            ? rawCta.label.trim()
            : ctaType === 'emergencia'
              ? 'Llamar técnico de emergencia'
              : 'Solicitar técnico ahora';

    let estimatedRange: AIDiagnosticCTA['estimated_range'] = null;
    if (rawCta && rawCta.estimated_range && typeof rawCta.estimated_range === 'object') {
        const er = rawCta.estimated_range as Record<string, unknown>;
        const currency = er.currency === 'USD' ? 'USD' : 'MXN';
        const min = typeof er.min === 'number' ? er.min : 0;
        const max = typeof er.max === 'number' ? er.max : min;
        estimatedRange = { currency, min, max };
    }

    if (!diagnostico) return null;

    return {
        diagnostico,
        categoria_profesional,
        nivel_urgencia,
        advertencia_seguridad: advertencia,
        causas_probables,
        que_hara_el_tecnico,
        confidence,
        preguntas_siguientes,
        disclaimer,
        cta: {
            type: ctaType,
            label: ctaLabel,
            action: ctaAction,
            prioridad: ctaPriority,
            estimated_range: estimatedRange,
        },
    };
}

function parseJsonFromResponse(text: string): unknown {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
}

/** Simula respuesta del backend cuando no hay endpoint o falla la red (solo desarrollo / fallback). */
function simulateDiagnostic(problemDescription: string): AIDiagnosticResult {
    const t = problemDescription.toLowerCase();

    let categoria: ProfesionalCategoria = 'general';
    let nivel: NivelUrgenciaExtendido = 'medio';
    let advertencia: string | null = null;

    if (
        /microondas|luz|electric|enchufe|breaker|fusible|corto|apag[oó]n|cable|tablero/i.test(problemDescription)
    ) {
        categoria = 'electricista';
        if (/sin luz|chispa|olor a quemado|cortocircuito/i.test(problemDescription)) {
            nivel = 'critico';
            advertencia =
                'Si huele a quemado o ves chispas, no manipules el tablero ni enchufes. Corta la corriente solo si puedes hacerlo con seguridad y llama a un electricista.';
        }
    } else if (/fuga|agua|plomer|tuber|llave de paso|inodoro|wc|baño|drenaje/i.test(problemDescription)) {
        categoria = 'plomero';
        if (/fuga|inundaci/i.test(problemDescription)) nivel = 'alto';
    } else if (/cerradura|llave perdida|cerraj/i.test(problemDescription)) {
        categoria = 'cerrajero';
    } else if (/pintar|pintura|mancha en pared|brocha/i.test(problemDescription)) {
        categoria = 'pintor';
    } else if (/cámara|camara|cctv|vigilancia|dvr/i.test(problemDescription)) {
        categoria = 'cctv';
    }

    const diagnostico =
        categoria === 'electricista'
            ? 'Lo que describes encaja con una sobrecarga o un circuito dedicado insuficiente: al encender un aparato de mucha potencia, el interruptor puede dispararse o la tensión caer en ese tramo.'
            : categoria === 'plomero'
              ? 'Suele haber una fuga o una obstrucción en la red de agua o desagüe relacionada con lo que comentas.'
              : categoria === 'cerrajero'
                ? 'Puede tratarse de un cilindro, una chapa desalineada o una llave dañada; conviene valorarlo en sitio.'
                : categoria === 'pintor'
                  ? 'Es habitual que haya humedad, salitre o una preparación de superficie pendiente antes de repintar.'
                  : categoria === 'cctv'
                    ? 'Puede ser alimentación, cableado o configuración del grabador o cámaras.'
                    : 'Con la información disponible, lo más prudente es que un profesional revise el caso en persona y te oriente sin riesgos.';

    return {
        diagnostico,
        categoria_profesional: categoria,
        nivel_urgencia: nivel,
        advertencia_seguridad: advertencia,
        causas_probables:
            categoria === 'electricista'
                ? ['Sobrecarga del circuito', 'Interruptor termomagnético fatigado', 'Falso contacto en toma o cableado']
                : categoria === 'plomero'
                  ? ['Fuga en conexión', 'Sellado deteriorado', 'Obstrucción parcial en tubería']
                  : ['Desgaste natural del componente', 'Instalación previa deficiente', 'Falta de mantenimiento preventivo'],
        que_hara_el_tecnico:
            categoria === 'electricista'
                ? 'Inspección de circuito, medición de carga y corrección segura en puntos de falla.'
                : 'Diagnóstico en sitio, validación del origen del problema y propuesta de solución segura.',
        confidence: categoria === 'general' ? 0.62 : 0.81,
        preguntas_siguientes: [],
        disclaimer: 'Prediagnóstico informativo. La confirmación final requiere revisión técnica en sitio.',
        cta: {
            type: nivel === 'critico' ? 'emergencia' : nivel === 'alto' ? 'urgente' : 'normal',
            label: nivel === 'critico' ? 'Llamar técnico de emergencia' : 'Solicitar técnico ahora',
            action: nivel === 'critico' ? 'llamar_tecnico' : 'abrir_checkout_tecnico',
            prioridad: nivel === 'critico' ? 'inmediata' : nivel === 'alto' ? 'alta' : 'media',
            estimated_range: null,
        },
    };
}

/**
 * Envía el texto del usuario al backend (Gemini en servidor).
 * Si el endpoint no existe o la respuesta no es válida, usa simulación local coherente con el dominio.
 */
export async function analyzeProblemWithAI(problemDescription: string): Promise<AIDiagnosticResult> {
    const trimmed = problemDescription.trim();
    if (trimmed.length < 8) {
        throw new Error('Describe un poco más tu situación (al menos 8 caracteres).');
    }

    try {
        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ problem_description: trimmed }),
            signal: AbortSignal.timeout(12000),
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const contentType = res.headers.get('content-type') || '';
        let parsed: unknown;

        if (contentType.includes('application/json')) {
            parsed = await res.json();
        } else {
            const text = await res.text();
            parsed = parseJsonFromResponse(text);
        }

        const body = parsed as Record<string, unknown>;
        const payload = body.result ?? body.data ?? body;
        const normalized = normalizeResult(payload);
        if (normalized) {
            return normalized;
        }
        throw new Error('Respuesta inválida del servidor');
    } catch (e) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.warn('[aiDiagnostic] Backend no disponible o error; usando simulación local:', e);
        }
        await new Promise((r) => setTimeout(r, 900));
        return simulateDiagnostic(trimmed);
    }
}

/** Etiqueta para UI y búsqueda en pantalla de profesionales (coincide con chips rápidos donde aplica). */
export function categoriaToDisplayLabel(categoria: ProfesionalCategoria): string {
    const map: Record<ProfesionalCategoria, string> = {
        plomero: 'Plomero',
        electricista: 'Electricista',
        cerrajero: 'Cerrajero',
        pintor: 'Pintor',
        cctv: 'CCTV',
        general: 'Profesional',
    };
    return map[categoria];
}

/**
 * Disciplina del catálogo (`/service-category/[id]`, ver `CategoryService` / Supabase `discipline`).
 * null = no hay rubro fijo en catálogo; conviene enviar al listado general de servicios.
 */
export function categoriaToDisciplineId(categoria: ProfesionalCategoria): string | null {
    const map: Record<ProfesionalCategoria, string | null> = {
        electricista: 'electricidad',
        plomero: 'plomeria',
        pintor: 'pintura',
        cctv: 'cctv',
        cerrajero: null,
        general: null,
    };
    return map[categoria];
}
