import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { monitorContext } from './runtime.mjs';

function fixture() {
  const page = new EventEmitter();
  const context = new EventEmitter();
  context.pages = () => [page];
  const errors = [];
  const monitor = monitorContext(context, errors);
  return { page, context, errors, monitor };
}
const response = (status, path, method = 'GET') => ({
  status: () => status,
  url: () => `http://127.0.0.1:59002${path}`,
  request: () => ({ method: () => method }),
});

test('expected status applies only to exact method/path and resource console location', () => {
  const { context, page, errors, monitor } = fixture();
  monitor.allow({ status: 400, method: 'POST', path: '/api/v1/auth/login' });
  context.emit('response', response(400, '/api/v1/auth/login', 'POST'));
  page.emit('console', {
    type: () => 'error',
    text: () => 'Failed to load resource: the server responded with a status of 400 (Bad Request)',
    location: () => ({ url: 'http://127.0.0.1:59002/api/v1/auth/login' }),
  });
  context.emit('response', response(400, '/api/v1/auth/login'));
  context.emit('response', response(404, '/missing.svg'));
  monitor.finish();
  assert.equal(errors.length, 2);
});

test('secondary pages, hydration, requests, 5xx and unknown broken resources all fail', () => {
  const { context, errors, monitor } = fixture();
  const other = new EventEmitter();
  context.emit('page', other);
  other.emit('pageerror', new Error('hydration mismatch'));
  other.emit('console', {
    type: () => 'error',
    text: () => 'Failed to load resource: net::ERR_FAILED',
    location: () => ({ url: '' }),
  });
  other.emit('console', {
    type: () => 'error',
    text: () => 'Failed to load resource: the server responded with a status of 404',
    location: () => ({ url: 'http://127.0.0.1/missing.svg' }),
  });
  context.emit('response', response(503, '/api/v1/products'));
  context.emit('requestfailed', {
    method: () => 'GET',
    url: () => 'http://127.0.0.1/image.svg',
    failure: () => ({ errorText: 'net::ERR_FAILED' }),
  });
  context.emit('request', { url: () => 'https://external.example/image.png' });
  monitor.finish();
  assert.equal(errors.length, 6);
  assert.equal(other.listenerCount('pageerror'), 0);
  assert.equal(context.listenerCount('response'), 0);
});

test('only framework speculative local GET cancellations are exempt', () => {
  const { context, errors, monitor } = fixture();
  const req = (overrides = {}) => ({
    method: () => 'GET',
    url: () => 'http://127.0.0.1:59000/products?_rsc=abc',
    headers: () => ({ rsc: '1', 'next-router-prefetch': '1' }),
    failure: () => ({ errorText: 'net::ERR_ABORTED' }),
    ...overrides,
  });
  context.emit('requestfailed', req());
  context.emit('response', {
    ...response(200, '/products'),
    url: () => 'http://127.0.0.1:59000/products',
  });
  context.emit('requestfailed', req({ headers: () => ({ rsc: '1' }) }));
  context.emit(
    'requestfailed',
    req({ url: () => 'http://127.0.0.1:59000/unresolved?_rsc=x', headers: () => ({ rsc: '1' }) }),
  );
  context.emit('requestfailed', req({ headers: () => ({}) }));
  context.emit('requestfailed', req({ method: () => 'POST' }));
  context.emit('requestfailed', req({ failure: () => ({ errorText: 'net::ERR_FAILED' }) }));
  context.emit('requestfailed', req({ url: () => 'https://external.example/?_rsc=abc' }));
  monitor.finish();
  assert.equal(errors.length, 5);
});
