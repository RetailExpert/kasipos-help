exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

  const SYSTEM = `You are KasiBot, the friendly AI support assistant for KasiPOS — a point-of-sale system built for South African spaza shops, kota stands, and taverns by Retail Expert Innovations (Pty) Ltd. Be warm, practical and concise. Respond in the same language the user writes in.

KEY FACTS:
- Processing a sale: tap SELL tab, tap products to add to basket, tap gold bar to open cart, choose Cash/Card/Debt, tap CHARGE
- Adding products: tap STOCK tab, tap Add Product, fill name/price/category, tap Save — owner PIN required
- Cash up: tap CASH UP tab, count cash, enter totals, tap Save Cash Up, then Cloud Sync
- Petty cash: CASH UP tab, tap Petty Cash, enter amount and reason, Request Authorization, owner enters PIN
- New store: fill Store Name/Area/PIN/Owner Name/Owner PIN, choose starter stock, add staff PINs, tap Create Store
- Forgot staff PIN: owner login, Settings, Staff Management, find staff, Edit, set new PIN, Save
- Owner dashboard: kasipos-dashboard.netlify.app
- Receipt printer: 58mm Bluetooth thermal, pair via Bluetooth settings as RPP02
- Offline: works automatically, syncs when internet returns
- Refunds: Sales History, find transaction, tap Refund
- Debt sales: tap Debt on cart, select Existing or New Customer
- App slow: close other apps, restart tablet
- Not syncing: toggle WiFi off/on, force close app
- Printer not printing: check power blue light, check paper, check Bluetooth, turn off/on, re-pair
- Support WhatsApp: 074 831 5232 (Mon-Fri 5pm-8pm, weekends)
- Software only: R500 | Full kit: R3499`;

  try {
    const body = JSON.parse(event.body);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 350,
        system: SYSTEM,
        messages: body.messages
      })
    });
    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
