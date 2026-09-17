/**
 * Tecnishop Local Cache & Deduplication Manager
 * Proporciona almacenamiento persistente en localStorage y deduplicación estricta de entidades.
 */

const CACHE_PREFIX = 'tecnishop_cache_v2_';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Guarda datos en localStorage con manejo seguro de cuotas y errores.
 */
export function saveToCache<T>(key: string, data: T): void {
  try {
    if (typeof window === 'undefined') return;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch (err) {
    // Si la cuota de localStorage se excede, limpiar entradas antiguas no críticas
    console.warn(`[CacheManager] No se pudo guardar en caché para la clave: ${key}`, err);
    try {
      pruneOldCache();
    } catch {
      // Ignorar
    }
  }
}

/**
 * Recupera datos de localStorage si existen.
 */
export function getFromCache<T>(key: string, fallback: T | null = null): T | null {
  try {
    if (typeof window === 'undefined') return fallback;
    const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!item) return fallback;
    const parsed: CacheEntry<T> = JSON.parse(item);
    return parsed?.data ?? fallback;
  } catch (err) {
    console.warn(`[CacheManager] Error al leer caché para la clave: ${key}`, err);
    return fallback;
  }
}

/**
 * Elimina una clave específica de la caché.
 */
export function removeFromCache(key: string): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch {
    // Ignorar
  }
}

/**
 * Limpia todas las claves de caché de Tecnishop.
 */
export function clearTecnishopCache(): void {
  try {
    if (typeof window === 'undefined') return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignorar
  }
}

/**
 * Limpia entradas antiguas si el espacio de almacenamiento es limitado.
 */
function pruneOldCache(): void {
  const keys: Array<{ key: string; timestamp: number }> = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      try {
        const val = JSON.parse(localStorage.getItem(key) || '{}');
        keys.push({ key, timestamp: val.timestamp || 0 });
      } catch {
        keys.push({ key, timestamp: 0 });
      }
    }
  }
  keys.sort((a, b) => a.timestamp - b.timestamp);
  // Eliminar los 3 más antiguos
  keys.slice(0, 3).forEach((item) => localStorage.removeItem(item.key));
}

/**
 * Deduplica un arreglo de objetos por un campo identificador único (ej: 'ci', 'id', 'codigo').
 * Conserva el orden y actualiza con la versión más reciente en caso de colisión.
 * Garantiza que nunca se rendericen filas repetidas en la UI.
 */
export function deduplicateList<T>(list: T[], keyField: string): T[] {
  if (!Array.isArray(list) || list.length === 0) return [];
  if (!keyField) return list;

  const seen = new Set<string | number>();
  const result: T[] = [];

  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const val = (item as any)[keyField];
    if (val !== undefined && val !== null && val !== '') {
      const stringKey = String(val);
      if (!seen.has(stringKey)) {
        seen.add(stringKey);
        result.push(item);
      }
    } else {
      // Si el elemento no tiene el campo clave, se conserva
      result.push(item);
    }
  }

  return result;
}

/**
 * Fusiona los datos en caché con los datos nuevos del servidor:
 * - Actualiza elementos existentes con los datos frescos del servidor
 * - Agrega elementos nuevos
 * - Asegura que ningún registro quede duplicado
 */
export function mergeAndDeduplicate<T>(cachedList: T[] = [], freshList: T[] = [], keyField: string): T[] {
  if (!Array.isArray(cachedList) || cachedList.length === 0) {
    return deduplicateList(freshList, keyField);
  }
  if (!Array.isArray(freshList) || freshList.length === 0) {
    return deduplicateList(cachedList, keyField);
  }

  // Mapa de elementos frescos del servidor
  const freshMap = new Map<string | number, T>();
  for (const item of freshList) {
    if (item && typeof item === 'object') {
      const val = (item as any)[keyField];
      if (val !== undefined && val !== null) {
        freshMap.set(String(val), item);
      }
    }
  }

  const result: T[] = [];
  const processedKeys = new Set<string | number>();

  // 1. Recorrer la lista fresca para mantener el orden del servidor
  for (const freshItem of freshList) {
    const val = (freshItem as any)[keyField];
    const keyStr = String(val);
    if (!processedKeys.has(keyStr)) {
      processedKeys.add(keyStr);
      result.push(freshItem);
    }
  }

  return result;
}
