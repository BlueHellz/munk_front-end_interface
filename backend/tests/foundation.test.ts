import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from '../src/api/app.js';
import { backendRoot, loadConfig } from '../src/config/env.js';
import { resolve } from 'node:path';
import { isApiError, isHealthResponse, isReadinessResponse, houseDraftSchema } from '../../contracts/src/foundation.js';

const config = () => loadConfig({ NODE_ENV: 'test', DATABASE_URL: 'postgresql://user:secret@127.0.0.1/munk_test', LOG_LEVEL: 'silent' });

test('configuration validates secrets without echoing them and resolves media against backend', () => {
  assert.equal(config().mediaRoot, resolve(backendRoot, '.data/media'));
  assert.equal(config().host, '127.0.0.1');
  assert.throws(() => loadConfig({}), /DATABASE_URL is required/);
  assert.throws(() => loadConfig({ DATABASE_URL: 'postgresql://user:secret@localhost/db?sslmode=disable' }), /without query/);
  for (const port of ['0', '-1', '1.5', '3001junk', '65536', '']) {
    assert.throws(() => loadConfig({ DATABASE_URL: config().databaseUrl, API_PORT: port }), /API_PORT/);
  }
  assert.throws(() => loadConfig({ DATABASE_URL: config().databaseUrl, APP_ORIGIN: 'https://user:secret@example.test' }), /APP_ORIGIN/);
  assert.throws(() => loadConfig({ DATABASE_URL: config().databaseUrl, APP_ORIGIN: 'https://example.test/path' }), /APP_ORIGIN/);
  assert.throws(() => loadConfig({ DATABASE_URL: config().databaseUrl, DATABASE_SSL: 'sometimes' }), /DATABASE_SSL/);
});

test('health is liveness only; readiness reflects unavailable, stale and ready databases', async () => {
  let ready = false;
  let fail = false;
  let closed = false;
  const app = buildApp({ config: config(), databaseReady: async () => {
    if (fail) throw Error('postgresql://user:secret@internal/private');
    return ready;
  }, closeDatabase: async () => { closed = true; } });
  try {
    const health = await app.inject('/api/health');
    assert.equal(health.statusCode, 200);
    assert.ok(isHealthResponse(health.json()));
    assert.equal(health.headers['cache-control'], 'no-store');
    const pending = await app.inject('/api/ready');
    assert.equal(pending.statusCode, 503);
    assert.ok(isApiError(pending.json()));
    ready = true;
    const available = await app.inject('/api/ready');
    assert.equal(available.statusCode, 200);
    assert.ok(isReadinessResponse(available.json()));
    fail = true;
    const unavailable = await app.inject('/api/ready');
    assert.equal(unavailable.statusCode, 503);
    assert.ok(!unavailable.body.includes('secret'));
    assert.ok(!unavailable.body.includes('internal/private'));
  } finally { await app.close(); }
  assert.equal(closed, true);
});

test('errors use portable envelope and new request IDs; undeclared routes stay unavailable', async () => {
  const app = buildApp({ config: config(), databaseReady: async () => true, closeDatabase: async () => {} });
  app.post('/api/test-draft', { schema: { body: houseDraftSchema } }, async () => ({ saved: true }));
  app.get('/api/test-failure', async () => { throw Error('private database detail'); });
  try {
    const unknown = await app.inject({ url: '/api/unknown', headers: { 'x-request-id': 'caller-controlled' } });
    assert.equal(unknown.statusCode, 404);
    assert.ok(isApiError(unknown.json()));
    assert.notEqual(unknown.headers['x-request-id'], 'caller-controlled');
    const noOrigin = await app.inject({ method: 'POST', url: '/api/test-draft', payload: {} });
    assert.equal(noOrigin.statusCode, 403);
    const invalid = await app.inject({ method: 'POST', url: '/api/test-draft', headers: { origin: config().appOrigin }, payload: {
      address: 'test-house', name: '', description: '', publicName: '', focus: '', admissionStatus: 'admitted',
    } });
    assert.equal(invalid.statusCode, 400);
    assert.ok(isApiError(invalid.json()));
    const valid = await app.inject({ method: 'POST', url: '/api/test-draft', headers: { origin: config().appOrigin }, payload: {
      address: 'test-house', name: '', description: '', publicName: '', focus: '',
    } });
    assert.equal(valid.statusCode, 200);
    const huge = await app.inject({ method: 'POST', url: '/api/test-draft', headers: { origin: config().appOrigin }, payload: { name: 'x'.repeat(70000) } });
    assert.equal(huge.statusCode, 413);
    const failed = await app.inject('/api/test-failure');
    assert.equal(failed.statusCode, 500);
    assert.ok(isApiError(failed.json()));
    assert.ok(!failed.body.includes('private database detail'));
    for (const endpoint of ['/api/uploads']) {
      const response = await app.inject({ method: 'POST', url: endpoint, headers: { origin: config().appOrigin } });
      assert.equal(response.statusCode, 404);
    }
    for (const endpoint of ['/api/houses', '/api/reviews/00000000-0000-4000-8000-000000000000/decisions']) {
      const response = await app.inject({ method: 'POST', url: endpoint, headers: { origin: config().appOrigin, authorization: 'Bearer arbitrary', 'x-account-id': 'forged' }, payload: {} });
      assert.equal(response.statusCode, 401);
      assert.equal(response.json().code, 'unauthenticated');
    }
    for (const endpoint of ['/api/me/houses', '/api/uploads/00000000-0000-4000-8000-000000000000', '/api/reviews']) {
      assert.equal((await app.inject(endpoint)).statusCode, 401);
    }
    const upload = await app.inject({ method: 'PUT', url: '/api/uploads/00000000-0000-4000-8000-000000000000/content', headers: { origin: config().appOrigin, 'content-type': 'application/octet-stream' }, payload: Buffer.from('bytes') });
    assert.equal(upload.statusCode, 401);
  } finally { await app.close(); }
});
