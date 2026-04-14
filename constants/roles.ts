/**
 * Valores canónicos para `profiles.role` y `profiles.user_type` (misma convención que TulBoxapp-B).
 * DB: siempre inglés `client` | `professional`.
 * Las funciones de normalización aceptan legado (p. ej. "profesional", "cliente") en lecturas.
 */

export enum UserRole {
  CLIENT = "client",
  PROFESSIONAL = "professional",
}

export enum RegistrationType {
  CLIENT = "client",
  PROFESSIONAL = "professional",
}

const PROFESSIONAL_ALIASES = new Set([
  UserRole.PROFESSIONAL,
  "profesional",
  "pro",
  "technician",
]);

const CLIENT_ALIASES = new Set([
  UserRole.CLIENT,
  "cliente",
  "customer",
  "user",
]);

export function normalizeProfileRole(raw: unknown): UserRole {
  if (raw === null || raw === undefined || raw === "") {
    return UserRole.CLIENT;
  }
  const s = String(raw).trim().toLowerCase();
  if (CLIENT_ALIASES.has(s)) return UserRole.CLIENT;
  if (PROFESSIONAL_ALIASES.has(s)) return UserRole.PROFESSIONAL;
  if (s.includes("profession") || s.includes("profesion")) {
    return UserRole.PROFESSIONAL;
  }
  return UserRole.CLIENT;
}

export function isProfessionalRole(role: unknown): boolean {
  return normalizeProfileRole(role) === UserRole.PROFESSIONAL;
}

export function normalizeUserType(raw: unknown): UserRole {
  return normalizeProfileRole(raw);
}

export function isProfessionalUserType(raw: unknown): boolean {
  return normalizeUserType(raw) === UserRole.PROFESSIONAL;
}

/** Fila `profiles`: considera `role` y `user_type` (cualquiera puede indicar profesional). */
export function isProfessionalProfileRow(row: {
  role?: unknown;
  user_type?: unknown;
}): boolean {
  return isProfessionalRole(row.role) || isProfessionalUserType(row.user_type);
}

/**
 * Cliente si alguna columna definida indica client (no tratar null/vacío como client).
 */
export function isClientProfileEitherField(row: {
  role?: unknown;
  user_type?: unknown;
}): boolean {
  const columnSaysClient = (v: unknown) => {
    if (v === null || v === undefined || v === "") return false;
    return normalizeProfileRole(v) === UserRole.CLIENT;
  };
  return columnSaysClient(row.role) || columnSaysClient(row.user_type);
}

const isUnset = (v: unknown) =>
  v === null || v === undefined || String(v).trim() === "";

/**
 * App cliente: filas legacy sin role/user_type rellenados no deben tratarse como “no cliente”
 * (evita signOut inmediato y sensación de login congelado).
 */
export function isClientProfileForClientApp(row: {
  role?: unknown;
  user_type?: unknown;
} | null): boolean {
  if (!row) return false;
  if (isClientProfileEitherField(row)) return true;
  if (isUnset(row.role) && isUnset(row.user_type)) return true;
  return false;
}

/** Valor explícito de cliente (ignora null/vacío). */
function isSetClientValue(raw: unknown): boolean {
  if (raw === null || raw === undefined || raw === "") return false;
  return normalizeProfileRole(raw) === UserRole.CLIENT;
}

/** Fila no es “solo cliente” en ambas columnas cuando están definidas como client. */
function rowNotExplicitDoubleClient(row: {
  role?: unknown;
  user_type?: unknown;
}): boolean {
  return !isSetClientValue(row.role) && !isSetClientValue(row.user_type);
}

/** Listados de profesionales: rol/tipo pro + profesión + sin cliente explícito en ambos campos. */
export function isProfessionalListingRow(row: {
  role?: unknown;
  user_type?: unknown;
  profession?: unknown;
}): boolean {
  const hasProfession =
    row.profession != null && String(row.profession).trim() !== "";
  return (
    isProfessionalProfileRow(row) &&
    hasProfession &&
    rowNotExplicitDoubleClient(row)
  );
}

export function toDbRole(role: unknown): UserRole {
  return normalizeProfileRole(role);
}

/** Valores posibles en DB por migraciones antiguas (queries `.in('role', …)`). */
export const DB_ROLE_VALUES_PROFESSIONAL: string[] = [
  UserRole.PROFESSIONAL,
  "profesional",
];
