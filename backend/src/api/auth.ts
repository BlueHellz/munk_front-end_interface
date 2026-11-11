import type { FastifyInstance } from 'fastify';
import type { Config } from '../config/env.js';
import { loginSchema } from '../../../contracts/src/auth.js';
import { Sessions, sessionCookieName, challengeCookieName } from '../auth/sessions.js';
import { DomainError } from './errors.js';

export async function authRoutes(app: FastifyInstance, config: Config, sessions?: Sessions) {
  const required = () => { if (!sessions) throw new DomainError(503, 'unavailable', 'Authentication is not configured.'); return sessions; };
  const cookie = { httpOnly: true, secure: config.appOrigin.startsWith('https:'), sameSite: 'strict' as const, path: '/api' };
  app.get('/api/auth/challenge', async (request, reply) => {
    const result = await required().challenge(request.ip);
    reply.setCookie(challengeCookieName, result.token, { ...cookie, maxAge: 300 });
    return { challenge: result.challenge };
  });
  app.post<{ Body: { accessToken: string } }>('/api/auth/sessions', { schema: { body: loginSchema } }, async (request, reply) => {
    const header = request.headers['x-login-challenge'];
    const result = await required().login(request.body.accessToken, request.cookies[challengeCookieName], typeof header === 'string' ? header : undefined, request.ip, request.cookies[sessionCookieName]);
    reply.clearCookie(challengeCookieName, cookie);
    reply.setCookie(sessionCookieName, result.token, { ...cookie, maxAge: 7 * 24 * 60 * 60 });
    return result.session;
  });
  app.get('/api/me', async request => required().me(request.cookies[sessionCookieName]));
  app.delete('/api/auth/session', async (request, reply) => {
    const header = request.headers['x-csrf-token'];
    await required().logout(request.cookies[sessionCookieName], typeof header === 'string' ? header : undefined);
    reply.clearCookie(sessionCookieName, cookie);
    return { status: 'logged_out' };
  });
}
