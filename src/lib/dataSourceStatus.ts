import type { UnifiedDataSource, UnifiedDataStatus } from '../types/fund';

export interface SourceMarked {
  dataSource: UnifiedDataSource;
  dataStatus: UnifiedDataStatus;
}

export function markFallback<T extends object>(value: T): T & SourceMarked {
  return { ...value, dataSource: 'mock', dataStatus: 'fallback' };
}

export function inferMixedStatus(items: SourceMarked[]): SourceMarked {
  if (items.length === 0) return { dataSource: 'unavailable', dataStatus: 'error' };
  const hasMock = items.some((item) => item.dataSource === 'mock');
  const hasReal = items.some((item) => item.dataSource === 'eastmoney');
  return {
    dataSource: hasMock && hasReal ? 'mixed' : hasReal ? 'eastmoney' : hasMock ? 'mock' : 'unavailable',
    dataStatus: hasMock ? 'fallback' : items.some((item) => item.dataStatus === 'partial') ? 'partial' : 'live',
  };
}
