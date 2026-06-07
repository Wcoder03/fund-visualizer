import type { PortfolioHolding, PortfolioStorageData } from '../types/portfolio';

const STORAGE_KEY = 'fund-visualizer.portfolio.v1';
const LEGACY_DEMO_HOLDING_IDS = new Set(['holding-018173', 'holding-008254']);

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadPortfolioFromStorage(): PortfolioHolding[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<PortfolioStorageData>;
    if (parsed.version !== 1 || !Array.isArray(parsed.holdings)) return [];
    return parsed.holdings.filter((holding) => !LEGACY_DEMO_HOLDING_IDS.has(holding.id));
  } catch {
    return [];
  }
}

export function savePortfolioToStorage(holdings: PortfolioHolding[]): void {
  if (!canUseStorage()) return;
  const payload: PortfolioStorageData = { version: 1, holdings };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearPortfolioStorage(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
