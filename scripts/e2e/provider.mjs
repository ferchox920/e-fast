import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.env.E2E_PROVIDER_MODE !== 'local')
  throw new Error('Explicit local provider mode required');
const port = Number(process.env.E2E_PROVIDER_PORT ?? 59001);
const origin = `http://127.0.0.1:${port}`;
const preferences = new Map();
const keys = new Map();
let sequence = 0;
const send = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};
async function body(req) {
  let text = '';
  for await (const chunk of req) text += chunk;
  return JSON.parse(text || '{}');
}
function cents(value) {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) throw new Error('Provider payload requires whole positive cents');
  return BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
}
async function emit(record, eventId, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        fileURLToPath(new URL('./webhook-emitter.mjs', import.meta.url)),
        record.payment.id,
        eventId,
        String(expectedStatus),
      ],
      { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code !== 0) reject(new Error(stderr || stdout));
      else {
        const result = JSON.parse(stdout);
        record.events.push(result);
        resolve(result);
      }
    });
  });
}
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, origin);
    if (url.pathname === '/health') return send(res, 200, { ready: true });
    if (url.pathname === '/image.svg') {
      res.writeHead(200, { 'content-type': 'image/svg+xml' });
      return res.end(
        '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#eef2ff"/><path d="M240 100h160l70 90-60 40-20-30v180H250V200l-20 30-60-40z" fill="#6366f1"/></svg>',
      );
    }
    if (url.pathname.startsWith('/__control/')) {
      if (req.headers['x-test-control'] !== process.env.E2E_CONTROL_SECRET)
        return send(res, 403, { error: 'forbidden' });
      if (url.pathname === '/__control/state') return send(res, 200, [...preferences.values()]);
      if (url.pathname === '/__control/emit') {
        const input = await body(req);
        const record = preferences.get(input.preferenceId);
        if (!record) return send(res, 404, {});
        return send(res, 200, await emit(record, input.eventId, input.expectedStatus ?? 200));
      }
      if (url.pathname === '/__control/payment') {
        const input = await body(req);
        const record = preferences.get(input.preferenceId);
        if (!record) return send(res, 404, {});
        for (const key of ['transaction_amount', 'currency_id', 'status'])
          if (key in input) record.payment[key] = input[key];
        return send(res, 200, record.payment);
      }
    }
    if (url.pathname === '/checkout/preferences' && req.method === 'POST') {
      if (req.headers.authorization !== 'Bearer local-provider-token') return send(res, 401, {});
      const key = req.headers['x-idempotency-key'];
      if (keys.has(key)) return send(res, 200, keys.get(key));
      const input = await body(req);
      const id = `local-preference-${++sequence}`;
      const preference = {
        id,
        init_point: `${origin}/checkout/${id}`,
        sandbox_init_point: `${origin}/checkout/${id}`,
      };
      const payment = {
        id: String(10000 + sequence),
        external_reference: input.external_reference,
        transaction_amount:
          Number(
            input.items.reduce(
              (sum, item) => sum + cents(item.unit_price) * BigInt(item.quantity),
              0n,
            ),
          ) / 100,
        currency_id: input.items[0].currency_id,
        status: 'pending',
        status_detail: 'local-test',
      };
      preferences.set(id, {
        preference,
        payment,
        payload: input,
        back_urls: input.back_urls,
        events: [],
      });
      if (key) keys.set(key, preference);
      return send(res, 201, preference);
    }
    if (url.pathname.startsWith('/v1/payments/') && req.method === 'GET') {
      if (req.headers.authorization !== 'Bearer local-provider-token') return send(res, 401, {});
      const record = [...preferences.values()].find(
        (item) => item.payment.id === url.pathname.split('/').at(-1),
      );
      return send(res, record ? 200 : 404, record?.payment ?? {});
    }
    if (url.pathname.startsWith('/checkout/')) {
      const record = preferences.get(url.pathname.split('/')[2]);
      if (!record) return send(res, 404, {});
      if (req.method === 'POST') {
        let input = '';
        for await (const chunk of req) input += chunk;
        const status = new URLSearchParams(input).get('status');
        if (!['pending', 'approved', 'rejected'].includes(status)) return send(res, 422, {});
        record.payment.status = status;
        await emit(record, `${record.payment.id}-${status}`);
      }
      const returnUrl = new URL(
        record.back_urls[
          record.payment.status === 'approved'
            ? 'success'
            : record.payment.status === 'rejected'
              ? 'failure'
              : 'pending'
        ],
      );
      returnUrl.searchParams.set('external_reference', record.payment.external_reference);
      returnUrl.searchParams.set('collection_status', record.payment.status);
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(
        `<!doctype html><html lang="es"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Checkout local de pruebas</title><style>body{font:18px system-ui;max-width:600px;margin:3rem auto;padding:1rem}button,a{display:block;margin:1rem 0;padding:1rem}button{width:100%}</style><h1>Checkout local de pruebas</h1><p>Importe: ${record.payment.transaction_amount} ${record.payment.currency_id}</p><p>Estado del proveedor: ${record.payment.status}</p><form method="post"><button name="status" value="pending">Mantener pendiente</button><button name="status" value="approved">Aprobar pago</button><button name="status" value="rejected">Rechazar pago</button></form><a href="${returnUrl}">Volver al comercio</a></html>`,
      );
    }
    send(res, 404, { error: 'unsupported provider route' });
  } catch (error) {
    console.error(error);
    send(res, 500, { error: 'local provider failed' });
  }
});
server.listen(port, '127.0.0.1');
