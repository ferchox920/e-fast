const url = process.env.CONTRACT_READY_URL ?? 'http://127.0.0.1:8000/health/ready';
const deadline = Date.now() + 60_000;
let lastError = 'No response';
while (Date.now() < deadline) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
    if (response.ok && (await response.json()).status === 'ready') {
      console.log(`Backend ready: ${url}`);
      process.exit(0);
    }
    lastError = `HTTP ${response.status}`;
  } catch (error) {
    lastError = String(error);
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}
console.error(`Backend unavailable after 60 seconds: ${lastError}`);
process.exit(1);
