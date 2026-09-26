const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveApiBaseUrl } = require('../api-config');
const { app } = require('../server');

test('resolves same-origin URLs in the browser', () => {
  const result = resolveApiBaseUrl({
    location: { origin: 'http://127.0.0.1:3000', protocol: 'http:' },
    storage: { getItem: () => null }
  });

  assert.equal(result, 'http://127.0.0.1:3000');
});

test('uses a configured compiler server in native capacitor apps', () => {
  const result = resolveApiBaseUrl({
    location: { origin: 'https://localhost', protocol: 'https:' },
    capacitor: { isNativePlatform: () => true },
    configuredUrl: 'http://192.168.1.20:3000/'
  });

  assert.equal(result, 'http://192.168.1.20:3000');
});

test('does not treat the native WebView origin as a compiler server', () => {
  const result = resolveApiBaseUrl({
    location: { origin: 'https://localhost', protocol: 'https:' },
    capacitor: { isNativePlatform: () => true },
    storage: { getItem: () => null }
  });

  assert.equal(result, '');
});

test('Capacitor origin can preflight and run Python through the compiler API', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const origin = 'https://localhost';
  const preflight = await fetch(`${baseUrl}/api/run`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
      'Access-Control-Request-Private-Network': 'true'
    }
  });

  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
  assert.equal(preflight.headers.get('access-control-allow-private-network'), 'true');

  const response = await fetch(`${baseUrl}/api/run`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'python',
      filename: 'mobile_test.py',
      code: 'print("mobile runner ready")'
    })
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), origin);
  assert.equal(result.exitCode, 0);
  assert.match(result.output, /mobile runner ready/);
});
