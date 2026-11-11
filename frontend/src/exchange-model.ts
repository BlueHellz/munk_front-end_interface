import { fictionalCatalog } from './fictional-catalog';
import { houses, works, type HouseId } from './fixtures';
export type MarketFixture = {
    houseId: HouseId;
    symbol: string;
    history: number[];
    volumeUsd: number;
    marketCapUsd: number;
    valuationScore: number;
};
// Fictional illustration only. No quotes, order books, token contracts or transactions.
export const markets: MarketFixture[] = [
    { houseId: 'off-grid', symbol: 'OG.MUNK', history: [1.03, 1.08, 1.06, 1.12, 1.16, 1.18, 1.24], volumeUsd: 18400, marketCapUsd: 1240000, valuationScore: 92 },
    { houseId: 'the-margin', symbol: 'MRG.MUNK', history: [2.55, 2.49, 2.42, 2.48, 2.31, 2.35, 2.40], volumeUsd: 42700, marketCapUsd: 2400000, valuationScore: 81 },
    { houseId: 'field-notes', symbol: 'FN.MUNK', history: [.81, .83, .85, .84, .89, .88, .86], volumeUsd: 6700, marketCapUsd: 860000, valuationScore: 87 },
    { houseId: 'signal-hill', symbol: 'SH.MUNK', history: [1.42, 1.47, 1.45, 1.52, 1.55, 1.58, 1.71], volumeUsd: 10900, marketCapUsd: 1710000, valuationScore: 76 }
];
for (const [i, entry] of fictionalCatalog.entries()) {
    const base = .48 + i * .115;
    markets.push({ houseId: entry.id, symbol: `${entry.id.split('-').map(p => p[0]).join('').toUpperCase()}.MUNK`, history: [base * .91, base * .95, base * .94, base * .99, base * .97, base, base * (i % 3 === 0 ? .982 : 1.012 + i * .001)], volumeUsd: 1800 + i * 430, marketCapUsd: Math.round(base * 320000), valuationScore: 54 + i * 2 });
}
export const marketPrice = (m: MarketFixture) => m.history[m.history.length - 1];
export const marketChange = (m: MarketFixture) => 100 * (marketPrice(m) / m.history[m.history.length - 2] - 1);
export function contentCategory(id: string): 'Video' | 'Writing' | 'Both' { const own = works.filter(w => w.houseId === id); const film = own.some(w => w.kind === 'FILM'), writing = own.some(w => w.kind === 'ESSAY'); return film && writing ? 'Both' : film ? 'Video' : 'Writing'; }
export type ExchangeSettings = {
    query: string;
    category: 'All' | 'Video' | 'Writing';
    watchlistOnly: boolean;
    sort: 'change' | 'volume' | 'valuation';
    direction: 'desc' | 'asc';
    density: 'compact' | 'comfortable';
    columns: 2 | 3 | 4;
    watchlist: HouseId[];
    mode?: 'mosaic' | 'comparison';
};
export const defaultExchange: ExchangeSettings = { query: '', category: 'All', watchlistOnly: false, sort: 'valuation', direction: 'desc', density: 'compact', columns: 4, watchlist: [], mode: 'mosaic' };
export function isExchangeSettings(value: unknown): value is ExchangeSettings {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return false;
    const v = value as Record<string, unknown>;
    return (v.mode === undefined || v.mode === 'mosaic' || v.mode === 'comparison') && typeof v.query === 'string' && v.query.length <= 200 && ['All', 'Video', 'Writing'].includes(v.category as string) && typeof v.watchlistOnly === 'boolean' && ['change', 'volume', 'valuation'].includes(v.sort as string) && ['desc', 'asc'].includes(v.direction as string) && ['compact', 'comfortable'].includes(v.density as string) && [2, 3, 4].includes(v.columns as number) && Array.isArray(v.watchlist) && v.watchlist.length <= houses.length && new Set(v.watchlist).size === v.watchlist.length && v.watchlist.every(id => houses.some(h => h.id === id));
}
export const EXCHANGE_KEY = 'munk-exchange-preview-v1';
export function loadExchange(storage: Pick<Storage, 'getItem'>): {
    settings: ExchangeSettings;
    warning: string;
} {
    try {
        const raw = storage.getItem(EXCHANGE_KEY);
        if (!raw)
            return { settings: defaultExchange, warning: '' };
        const parsed: unknown = JSON.parse(raw);
        if (isExchangeSettings(parsed))
            return { settings: parsed, warning: '' };
        return { settings: defaultExchange, warning: 'Invalid saved Exchange settings were reset to defaults.' };
    }
    catch {
        return { settings: defaultExchange, warning: 'Exchange storage is unavailable. Changes remain in this tab only.' };
    }
}
export function saveExchange(storage: Pick<Storage, 'setItem'>, settings: ExchangeSettings): string {
    if (!isExchangeSettings(settings))
        return 'Invalid Exchange settings were not saved.';
    try {
        storage.setItem(EXCHANGE_KEY, JSON.stringify(settings));
        return '';
    }
    catch {
        return 'Exchange changes are in memory only: browser storage is unavailable or full.';
    }
}
export function compareHouses(settings: ExchangeSettings): MarketFixture[] { const query = settings.query.trim().toLowerCase(); return markets.filter(m => { const h = houses.find(h => h.id === m.houseId)!; return (!query || `${h.name} ${h.creator.name} ${m.symbol}`.toLowerCase().includes(query)) && (settings.category === 'All' || contentCategory(h.id) === 'Both' || contentCategory(h.id) === settings.category) && (!settings.watchlistOnly || settings.watchlist.includes(h.id)); }).sort((a, b) => { const value = (m: MarketFixture) => settings.sort === 'change' ? marketChange(m) : settings.sort === 'volume' ? m.volumeUsd : m.valuationScore; return (settings.direction === 'desc' ? -1 : 1) * (value(a) - value(b)) || a.houseId.localeCompare(b.houseId); }); }
export function sparkline(values: number[], width = 240, height = 44): string { const min = Math.min(...values), max = Math.max(...values), spread = max - min || 1; return values.map((v, i) => `${(4 + i * (width - 8) / Math.max(1, values.length - 1)).toFixed(2)},${(height - 4 - (v - min) * (height - 8) / spread).toFixed(2)}`).join(' '); }
