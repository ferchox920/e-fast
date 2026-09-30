import { createHmac } from 'node:crypto';
const [resourceId, eventId, expectedStatus = '200'] = process.argv.slice(2);
const base = process.env.CONTRACT_API_BASE_URL;
if (!base?.startsWith('http://127.0.0.1:') || !resourceId || !eventId)
  throw new Error('Local API and event required');
const timestamp = String(Date.now());
const signature = createHmac('sha256', process.env.MERCADO_PAGO_WEBHOOK_SECRET)
  .update(`id:${resourceId};request-id:${eventId};ts:${timestamp};`)
  .digest('hex');
const response = await fetch(`${base}/payments/mercado-pago/webhook?data.id=${resourceId}`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-request-id': eventId,
    'x-signature': `ts=${timestamp},v1=${signature}`,
  },
  body: JSON.stringify({ type: 'payment', data: { id: resourceId } }),
  signal: AbortSignal.timeout(10000),
});
const result = await response.json();
if (![200, 409].includes(Number(expectedStatus)) || response.status !== Number(expectedStatus))
  throw new Error(`Webhook failed: ${response.status} ${JSON.stringify(result)}`);
console.log(JSON.stringify(response.ok ? result : { httpStatus: response.status, ...result }));
