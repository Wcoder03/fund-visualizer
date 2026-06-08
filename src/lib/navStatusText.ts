import type { FundMarketType, MarketStatus } from '../types/portfolio';

export interface OverseasEstimateLabel {
  shortLabel: string;
  fullLabel: string;
  overseasTradeDate: string | null;
  beijingTime: string | null;
}

function parseEstimateTime(est: string): { date: string; hour: number } | null {
  const m = est.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2})/);
  if (!m) return null;
  return { date: m[1], hour: parseInt(m[2], 10) };
}

function prevDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d - 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function marketLabel(mt: FundMarketType): string {
  if (mt === 'qdii_us') return '美股';
  if (mt === 'qdii_hk') return '港股';
  return '海外';
}

export function formatOverseasEstimateLabel(
  marketType: FundMarketType,
  estimatedTime: string | null | undefined
): OverseasEstimateLabel {
  const label = marketLabel(marketType);

  if (!estimatedTime) {
    return { shortLabel: `估算 ${label}`, fullLabel: `估算 ${label}`, overseasTradeDate: null, beijingTime: null };
  }

  const parsed = parseEstimateTime(estimatedTime);
  if (!parsed) {
    return { shortLabel: `估算 ${label}`, fullLabel: `估算 ${label}`, overseasTradeDate: null, beijingTime: estimatedTime };
  }

  let overseasDate: string;

  if (marketType === 'qdii_us') {
    // 美股：北京时间凌晨 03:00-08:00 通常对应美股前一交易日收盘
    if (parsed.hour >= 2 && parsed.hour <= 8) {
      overseasDate = prevDate(parsed.date);
    } else {
      overseasDate = parsed.date;
    }
  } else if (marketType === 'qdii_hk') {
    // 港股：同东八区，直接用北京时间日期
    overseasDate = parsed.date;
  } else {
    // 全球/其他：凌晨时段按前一交易日
    if (parsed.hour >= 2 && parsed.hour <= 8) {
      overseasDate = prevDate(parsed.date);
    } else {
      overseasDate = parsed.date;
    }
  }

  const mm = overseasDate.slice(5); // MM-DD
  return {
    shortLabel: `估算 ${label}${mm}收盘`,
    fullLabel: `对应${label}交易日 ${overseasDate}，北京时间 ${estimatedTime}`,
    overseasTradeDate: overseasDate,
    beijingTime: estimatedTime,
  };
}

export function navStatusLabel(status?: MarketStatus, marketType?: FundMarketType): string {
  if (!status) return '净值缺失';
  if (marketType === 'overseas') {
    const labels: Partial<Record<MarketStatus, string>> = {
      trading: '海外估算',
      closed_pending_nav: '海外估算',
      nav_confirmed: '最新确认',
      non_trading_day: '最新确认',
      before_open: '最新确认',
    };
    return labels[status] ?? '最新确认';
  }
  const labels: Record<MarketStatus, string> = {
    before_open: '待交易',
    trading: '盘中估算',
    closed_pending_nav: '闭市估算',
    nav_confirmed: '当日确认',
    non_trading_day: '非交易日',
  };
  return labels[status];
}

export function navStatusNote(status?: MarketStatus, marketType?: FundMarketType): string {
  if (!status) return '暂无可用净值快照，无法计算金额和收益。';
  if (marketType === 'overseas') {
    return '该基金投资海外市场，净值存在时区和确认延迟。当前以数据源提供的最新确认或估算净值为准。';
  }
  const notes: Record<MarketStatus, string> = {
    before_open: '盘前使用最近确认净值，当日收益显示为 --。',
    trading: '盘中使用估算净值，最终以确认净值为准。',
    closed_pending_nav: '闭市后净值尚未确认，披露后会更新。',
    nav_confirmed: '使用当日确认净值计算收益。',
    non_trading_day: '非交易日使用最近确认净值，当日收益显示为 --。',
  };
  return notes[status];
}
