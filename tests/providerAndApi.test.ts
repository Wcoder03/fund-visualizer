import { describe, expect, it, vi } from 'vitest';
import { handleApiRequest } from '../src/lib/apiHandlers';
import { getFundSnapshot } from '../src/lib/fundDataProvider';
import { eastmoneyParsing, parseJsonp } from '../src/lib/providers/eastmoneyProvider';
import { serverCacheClear, serverCacheGet, serverCacheSet } from '../src/lib/serverCache';

describe('eastmoney parsing', () => {
  it('parses jsonp safely', () => {
    expect(parseJsonp<{ fundcode: string }>('jsonpgz({"fundcode":"018173"});')?.fundcode).toBe('018173');
    expect(parseJsonp('not jsonp')).toBeNull();
  });

  it('parses JS variable history without throwing on missing fields', () => {
    const text = 'var Data_netWorthTrend = [{"x":1780000000000,"y":1.23}]; var fS_name = "测试基金"; var fS_code = "001";';
    expect(eastmoneyParsing.extractJsonVariable<{ y: number }[]>(text, 'Data_netWorthTrend')?.[0].y).toBe(1.23);
    expect(eastmoneyParsing.extractJsonVariable(text, 'Missing')).toBeNull();
  });
});

describe('fundDataProvider fallback and API', () => {
  it('falls back to mock snapshot when fetch fails', async () => {
    serverCacheClear();
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network'))));
    const snapshot = await getFundSnapshot('018173');
    expect(snapshot.dataSource).toBe('mock');
    expect(snapshot.dataStatus).toBe('fallback');
    vi.unstubAllGlobals();
  });

  it('serves snapshot through API handler', async () => {
    serverCacheClear();
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network'))));
    let body = '';
    const req = {
      method: 'GET',
      url: '/api/funds/018173/snapshot',
      on: () => undefined,
    };
    const res = {
      statusCode: 0,
      setHeader: () => undefined,
      end: (value: string) => {
        body = value;
      },
    };
    await handleApiRequest(req, res);
    expect(JSON.parse(body).fundCode).toBe('018173');
    vi.unstubAllGlobals();
  });
});

describe('serverCache', () => {
  it('sets, gets, and expires values', async () => {
    serverCacheClear();
    serverCacheSet('k', 'v', 20);
    expect(serverCacheGet('k')).toBe('v');
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(serverCacheGet('k')).toBeNull();
  });
});
