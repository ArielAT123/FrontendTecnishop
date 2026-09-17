import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getFromCache, saveToCache, deduplicateList } from '../utils/cacheManager';

export interface UseCachedQueryOptions<TData> {
  queryKey: string[];
  queryFn: () => Promise<TData>;
  keyField?: string;
  nestedArrayKey?: string;
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

export interface UseCachedQueryResult<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isSyncing: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

/**
 * Hook personalizado SWR (Stale-While-Revalidate) para Tecnishop:
 * 1. Proporciona inmediatamente los datos persistidos en localStorage si existen (0ms de carga).
 * 2. Realiza la petición al backend en segundo plano para obtener datos frescos.
 * 3. Al recibir datos nuevos, deduplica estrictamente por el campo clave para no repetir filas.
 * 4. Actualiza la caché en localStorage y re-renderiza fluidamente sin pantalla de carga intrusiva.
 */
export function useCachedQuery<TData>({
  queryKey,
  queryFn,
  keyField,
  nestedArrayKey,
  enabled = true,
  refetchInterval,
  staleTime = 0, // staleTime 0 asegura que siempre revalide en segundo plano al montar o enfocar
}: UseCachedQueryOptions<TData>): UseCachedQueryResult<TData> {
  const cacheKey = queryKey.join('_');

  const query = useQuery<TData, Error>({
    queryKey,
    queryFn: async () => {
      const freshData = await queryFn();

      let processedData: Awaited<TData> = freshData;

      // 1. Deduplicación si es un arreglo directo
      if (Array.isArray(freshData) && keyField) {
        processedData = deduplicateList(freshData, keyField) as unknown as Awaited<TData>;
      }
      // 2. Deduplicación si el arreglo está dentro de una propiedad anidada (ej: ordenesData.ordenes)
      else if (
        freshData &&
        typeof freshData === 'object' &&
        nestedArrayKey &&
        keyField &&
        Array.isArray((freshData as any)[nestedArrayKey])
      ) {
        const nestedList = (freshData as any)[nestedArrayKey];
        const dedupedNested = deduplicateList(nestedList, keyField);
        processedData = {
          ...freshData,
          [nestedArrayKey]: dedupedNested,
        } as unknown as Awaited<TData>;
      }

      // Guardar en almacenamiento local persistente
      saveToCache(cacheKey, processedData);

      return processedData;
    },
    initialData: () => {
      // Cargar instantáneamente de localStorage para evitar pantalla de carga
      const cached = getFromCache<TData>(cacheKey);
      return cached !== null ? cached : undefined;
    },
    enabled,
    refetchInterval,
    staleTime,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const hasData = query.data !== undefined && query.data !== null;
  // isLoading solo es verdadero si no hay datos en caché y la consulta inicial está pendiente
  const isLoading = query.isLoading && !hasData;
  // isSyncing es verdadero cuando hay datos en pantalla pero se están actualizando en segundo plano
  const isSyncing = query.isFetching && hasData;

  return {
    data: query.data,
    isLoading,
    isFetching: query.isFetching,
    isSyncing,
    error: query.error,
    refetch: query.refetch,
  };
}
