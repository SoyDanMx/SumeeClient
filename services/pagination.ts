/**
 * Pagination Utilities
 * Utilidades para paginación de listas
 * Alineado con TulBoxPros
 */

export interface PaginationOptions {
    page: number;
    pageSize: number;
}

export interface PaginatedResult<T> {
    data: T[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

/**
 * Paginar array local
 */
export function paginateArray<T>(
    array: T[],
    options: PaginationOptions
): PaginatedResult<T> {
    const { page, pageSize } = options;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const total = array.length;
    const totalPages = Math.ceil(total / pageSize);

    return {
        data: array.slice(startIndex, endIndex),
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
    };
}

/**
 * Crear query paginado para Supabase
 */
export function createPaginationQuery(
    query: any,
    options: PaginationOptions
) {
    const { page, pageSize } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    return query.range(from, to);
}

/**
 * Helper para obtener siguiente página
 */
export function getNextPage(currentPage: number, totalPages: number): number | null {
    return currentPage < totalPages ? currentPage + 1 : null;
}

/**
 * Helper para obtener página anterior
 */
export function getPreviousPage(currentPage: number): number | null {
    return currentPage > 1 ? currentPage - 1 : null;
}
