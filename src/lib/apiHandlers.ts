import { runFundAnalysis } from './fundAnalyzer';
import { getFundSnapshot, searchFunds } from './fundDataProvider';
import { fetchFundExtendedData } from './providers/eastmoneyProvider';
import type { FundInput } from '../types/fundAnalysis';

interface ApiRequest {
  url?: string;
  method?: string;
  on: (event: 'data' | 'end' | 'error', callback: (chunk?: unknown) => void) => void;
}

interface ApiResponse {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body: string) => void;
}

function sendJson(res: ApiResponse, statusCode: number, value: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(value));
}

function readBody(req: ApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += String(chunk ?? '');
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export async function handleApiRequest(req: ApiRequest, res: ApiResponse) {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const pathname = url.pathname.startsWith('/api') ? url.pathname : `/api${url.pathname}`;

    if (req.method === 'GET' && pathname === '/api/funds/search') {
      const keyword = url.searchParams.get('keyword') || '';
      return sendJson(res, 200, { items: await searchFunds(keyword) });
    }

    const snapshotMatch = pathname.match(/^\/api\/funds\/([^/]+)\/snapshot$/);
    if (req.method === 'GET' && snapshotMatch) {
      return sendJson(res, 200, await getFundSnapshot(snapshotMatch[1]));
    }

    const extendedMatch = pathname.match(/^\/api\/funds\/([^/]+)\/extended$/);
    if (req.method === 'GET' && extendedMatch) {
      return sendJson(res, 200, await fetchFundExtendedData(extendedMatch[1]));
    }

    const realtimeMatch = pathname.match(/^\/api\/funds\/([^/]+)\/realtime$/);
    if (req.method === 'GET' && realtimeMatch) {
      const snapshot = await getFundSnapshot(realtimeMatch[1]);
      return sendJson(res, 200, {
        fundCode: snapshot.fundCode,
        fundName: snapshot.fundName,
        estimatedNav: snapshot.estimatedNav,
        estimatedChangeRate: snapshot.intradayChangeRate,
        estimateTime: snapshot.estimateTime,
        dataSource: snapshot.dataSource,
        dataStatus: snapshot.dataStatus,
      });
    }

    const navHistoryMatch = pathname.match(/^\/api\/funds\/([^/]+)\/nav-history$/);
    if (req.method === 'GET' && navHistoryMatch) {
      const snapshot = await getFundSnapshot(navHistoryMatch[1]);
      return sendJson(res, 200, { fundCode: snapshot.fundCode, latest: snapshot.latestConfirmedNav, dataSource: snapshot.dataSource, dataStatus: snapshot.dataStatus });
    }

    if (req.method === 'POST' && pathname === '/api/analyze-funds') {
      const body = JSON.parse(await readBody(req)) as { funds?: FundInput[] };
      const results = await runFundAnalysis(body.funds || []);
      return sendJson(res, 200, results);
    }

    return sendJson(res, 404, { message: 'API route not found' });
  } catch (error) {
    return sendJson(res, 500, { message: error instanceof Error ? error.message : 'API error' });
  }
}
