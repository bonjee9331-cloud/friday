import { NextResponse } from 'next/server';

// Hardcoded fallback when market APIs are down
const FALLBACK = {
  sp500: 5200, sp500_chg: 0.34,
  asx200: 7800, asx200_chg: 0.12,
  btc: 67000, btc_chg: 1.45,
  oil: 78.5, oil_chg: -0.22,
  source: 'fallback',
};

async function fetchYahoo(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`yahoo ${symbol} ${res.status}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  const meta   = result?.meta;
  if (!meta) throw new Error('no meta');

  const price = meta.regularMarketPrice ?? meta.previousClose;
  const prev  = meta.previousClose ?? meta.chartPreviousClose;
  const chg   = prev > 0 ? ((price - prev) / prev) * 100 : 0;
  return { price, chg: Math.round(chg * 100) / 100 };
}

export async function GET() {
  try {
    const [sp, asx, btc, oil] = await Promise.all([
      fetchYahoo('%5EGSPC'),
      fetchYahoo('%5EAXJO'),
      fetchYahoo('BTC-USD'),
      fetchYahoo('CL=F'),
    ]);

    return NextResponse.json({
      sp500:      Math.round(sp.price),
      sp500_chg:  sp.chg,
      asx200:     Math.round(asx.price),
      asx200_chg: asx.chg,
      btc:        Math.round(btc.price),
      btc_chg:    btc.chg,
      oil:        Math.round(oil.price * 100) / 100,
      oil_chg:    oil.chg,
      source:     'yahoo',
      ts:         Date.now(),
    });
  } catch (err) {
    console.error('[markets]', err.message);
    return NextResponse.json({ ...FALLBACK, ts: Date.now() });
  }
}
