import 'whatwg-fetch';
import { TransformStream as NodeTransformStream } from 'stream/web';
import { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from 'util';
import '@testing-library/jest-dom';
import type { SetupServerApi } from 'msw/node';

// Polyfill TextEncoder/Decoder for msw/node in the JSDOM environment.
if (!global.TextEncoder) {
  global.TextEncoder = NodeTextEncoder;
}

if (!global.TextDecoder) {
  // @ts-expect-error - Jest's JSDOM globals do not declare TextDecoder yet.
  global.TextDecoder = NodeTextDecoder;
}

if (!('TransformStream' in global)) {
  // @ts-expect-error - JSDOM globals don't include TransformStream.
  global.TransformStream = NodeTransformStream;
}

let serverInstance: SetupServerApi | null = null;

async function ensureServer() {
  if (!serverInstance) {
    const mod = await import('@/test-utils/msw/server');
    serverInstance = mod.server;
  }

  return serverInstance;
}

beforeAll(async () => {
  const server = await ensureServer();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(async () => {
  const server = await ensureServer();
  server.resetHandlers();
});

afterAll(async () => {
  const server = await ensureServer();
  server.close();
});
