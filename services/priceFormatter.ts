/**
 * 🌐 Servicio Universal de Formateo de Precios - TulBoxClient
 * 
 * Este servicio proporciona un formato consistente de precios
 * que funciona en todas las plataformas: React Native, Next.js, y Web.
 * 
 * ESTÁNDAR DE PRECIOS TULBOX:
 * - Formato: $1,234.56 (con separador de miles y 2 decimales)
 * - Locale: es-MX (México)
 * - Símbolo: $ (peso mexicano)
 * - Decimales: Siempre 2 (mínimo y máximo)
 * - Sin precio: "Precio a cotizar"
 */

export interface UniversalPriceFormat {
  value: number | null;
  formatted: string;
  display: string;
  isEstimated: boolean;
  source: 'agreed_price' | 'price' | 'ai_suggested_price' | 'extracted' | 'none';
  rawValue?: any;
}

export interface PriceRange {
  min: number;
  max: number;
}

/**
 * Formatea un precio numérico a string con formato mexicano estándar
 */
export function formatPrice(price: number | null | undefined): string {
  if (price == null || price === undefined || isNaN(price) || price <= 0) {
    return 'Precio a cotizar';
  }

  return `$${price.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formatea un precio sin decimales (para casos especiales)
 */
export function formatPriceNoDecimals(price: number | null | undefined): string {
  if (price == null || price === undefined || isNaN(price) || price <= 0) {
    return 'Precio a cotizar';
  }

  return `$${price.toLocaleString('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Formatea un rango de precios
 */
export function formatPriceRange(
  min: number | null | undefined,
  max?: number | null | undefined
): string {
  if (min == null || min === undefined || isNaN(min) || min <= 0) {
    return 'Precio a cotizar';
  }

  const formattedMin = formatPrice(min);

  if (max != null && max !== undefined && !isNaN(max) && max > min) {
    const formattedMax = formatPrice(max);
    return `${formattedMin} - ${formattedMax}`;
  }

  return formattedMin;
}

/**
 * Parsea un valor de precio desde cualquier formato
 */
export function parsePriceValue(value: any): number | null {
  if (value == null || value === '' || value === '-') return null;

  if (typeof value === 'number') {
    return isNaN(value) || value <= 0 ? null : value;
  }

  if (typeof value === 'string') {
    let cleaned = value.trim().replace(/[$€£¥]/g, '');
    cleaned = cleaned.replace(/,/g, '');
    cleaned = cleaned.replace(/[^\d.-]/g, '');

    if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) || parsed <= 0 ? null : parsed;
  }

  return null;
}

/**
 * Obtiene el precio de un objeto lead/job de manera segura
 */
export function getLeadPrice(lead: any): number | null {
  if (!lead) return null;

  let finalPrice: number | null = null;
  let source = '';

  if (lead.agreed_price != null && lead.agreed_price !== '') {
    const parsed = parsePriceValue(lead.agreed_price);
    if (parsed != null && parsed > 0) {
      finalPrice = parsed;
      source = 'agreed_price';
    }
  }

  if (finalPrice == null && lead.price != null && lead.price !== '') {
    const parsed = parsePriceValue(lead.price);
    if (parsed != null && parsed > 0) {
      finalPrice = parsed;
      source = 'price';
    }
  }

  if (finalPrice != null) {
    // 🚨 HOTFIX TULBOX: Corrección visual para bug de Contactos en $5000
    // Detectar leads afectados y corregir precio mostrado
    if (finalPrice === 5000) {
      const textContent = [
        lead.descripcion_proyecto || '',
        lead.servicio || '',
        lead.servicio_solicitado || ''
      ].join(' ').toLowerCase();

      if (textContent.includes('contacto')) {
        console.warn(`[PriceFormatter] 🚨 HOTFIX Cliente: Corrigiendo precio de ${source} ($5000 -> $350) para servicio de Contactos`);
        return 350;
      }
    }
    return finalPrice;
  }

  return null;
}

/**
 * Obtiene el precio formateado de un lead/job
 */
export function getLeadPriceFormatted(lead: any): string {
  const price = getLeadPrice(lead);
  return formatPrice(price);
}

/**
 * Obtiene información completa del precio de un lead/job
 */
export function getLeadPriceInfo(lead: any): UniversalPriceFormat {
  if (!lead) {
    return {
      value: null,
      formatted: 'Precio a cotizar',
      display: 'Precio a cotizar',
      isEstimated: true,
      source: 'none',
    };
  }

  let price: number | null = null;
  let source: UniversalPriceFormat['source'] = 'none';
  let isEstimated = true;

  if (lead.agreed_price != null && lead.agreed_price !== '') {
    const parsed = parsePriceValue(lead.agreed_price);
    if (parsed != null && parsed > 0) {
      price = parsed;
      source = 'agreed_price';
      isEstimated = false;
    }
  }

  if (price == null && lead.price != null && lead.price !== '') {
    const parsed = parsePriceValue(lead.price);
    if (parsed != null && parsed > 0) {
      price = parsed;
      source = 'price';
      isEstimated = true;
    }
  }

  const formatted = formatPrice(price);
  const display = isEstimated && price
    ? `${formatted} (estimado)`
    : formatted;

  return {
    value: price,
    formatted,
    display,
    isEstimated,
    source,
    rawValue: {
      agreed_price: lead.agreed_price,
      price: lead.price,
    },
  };
}

export const PriceFormatter = {
  format: formatPrice,
  formatNoDecimals: formatPriceNoDecimals,
  formatRange: formatPriceRange,
  parse: parsePriceValue,
  getLeadPrice,
  getLeadPriceFormatted,
  getLeadPriceInfo,
};
