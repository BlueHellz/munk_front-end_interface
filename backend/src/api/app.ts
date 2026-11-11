import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyError } from 'fastify';
import { apiErrorSchema, healthSchema, readinessSchema, type ApiError, type ApiErrorCode } from '../../../contracts/src/foundation.js';
import type { Config } from '../config/env.js';
import { DomainError } from './errors.js';
import { protectedRoutes, type CreatorServices } from './protected.js';
import cookie from '@fastify/cookie';
import { authRoutes } from './auth.js';
import type { Sessions } from '../auth/sessions.js';
import {publicRoutes} from './public.js';
import { validationDetails } from './validation.js';

export type AppDependencies = {
  config: Config;
  databaseReady: () => Promise<boolean>;
  closeDatabase: () => Promise<void>;
  creatorServices?: CreatorServices;
  sessions?: Sessions;
};
const errorBody = (code: ApiErrorCode, message: string, requestId: string, retryable = false): ApiError => ({ ok: false, code, message, requestId, retryable });

export function buildApp(deps: AppDependencies) {
  const app = Fastify({
    bodyLimit: 64 * 1024,
    requestTimeout: 30 * 60 * 1000,
    connectionTimeout: 10000,
    // Do not trust forwarded headers or caller-provided correlation identifiers.
    trustProxy: false,
    requestIdHeader: false,
    genReqId: () => randomUUID(),
    ajv: { customOptions: { removeAdditional: false, coerceTypes: false, useDefaults: false } },
    logger: {
      level: deps.config.logLevel,
      // URL/query, headers, bodies and raw errors can carry credentials. Log only minimal metadata.
      serializers: {
        req: (req: { method: string }) => ({ method: req.method }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
        err: () => ({ type: 'Error', message: 'Internal request failure; details omitted.', stack: '' }),
      },
    },
  });
  app.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id);
    reply.header('x-content-type-options', 'nosniff');
    reply.header('cache-control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers.origin !== deps.config.appOrigin) {
      return reply.code(403).send(errorBody('forbidden', 'Request origin is not allowed.', request.id));
    }
  });
  app.setErrorHandler<FastifyError>((error, request, reply) => {
    if (error instanceof DomainError) return reply.code(error.status).send({...errorBody(error.code, error.message, request.id, error.status >= 500),...(error.fieldErrors?{fieldErrors:error.fieldErrors}:{})});
    if (error.validation) {
      const {fieldErrors,diagnostics}=validationDetails(error.validation);
      request.log.warn({validationIssues:diagnostics}, 'Request validation rejected');
      return reply.code(400).send({...errorBody('validation','Check the highlighted request fields.',request.id),fieldErrors});
    }
    let status = 500;
    let code: ApiErrorCode = 'internal';
    let message = 'The request could not be completed.';
    if (error.validation || error.statusCode === 400 || error.statusCode === 415) {
      status = error.statusCode === 415 ? 415 : 400; code = 'validation'; message = 'The request is invalid.';
    } else if (error.statusCode === 413) {
      status = 413; code = 'too_large'; message = 'The request exceeds the allowed size.';
    }
    if (status === 500) request.log.error({ err: error }, 'Request failed');
    reply.code(status).send(errorBody(code, message, request.id, status === 500));
  });
  app.setNotFoundHandler((request, reply) => reply.code(404).send(errorBody('not_found', 'Resource not found.', request.id)));
  app.get('/api/config',async()=>({mode:deps.config.productMode,publicPublishing:!!deps.creatorServices?.videos}));
  app.get('/api/health', { schema: { response: { 200: healthSchema } } }, async () => ({ status: 'ok', service: 'munk-api' }));
  app.get('/api/ready', { schema: { response: { 200: readinessSchema, 503: apiErrorSchema } } }, async (request, reply) => {
    try {
      if (await deps.databaseReady()) return { status: 'ready', database: 'ready' };
    } catch { /* Connectivity and migration errors must not leak via readiness. */ }
    return reply.code(503).send(errorBody('unavailable', 'Database is unavailable or migrations are pending.', request.id, true));
  });
  app.addHook('onClose', deps.closeDatabase);
  app.register(cookie);
  app.register(async scope => publicRoutes(scope,deps.creatorServices?.videos,deps.creatorServices?.interfaces,deps.creatorServices?.community));
  app.register(async scope => authRoutes(scope, deps.config, deps.sessions));
  app.register(async scope => protectedRoutes(scope, deps.creatorServices, deps.sessions,deps.config.productMode));
  return app;
}
