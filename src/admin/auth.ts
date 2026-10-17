import { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../config/env.js';
import { getSupabase } from '../db/client.js';

/**
 * Authentication middleware for /admin REST API routes.
 * Accepts:
 * 1. Static API Key header: `x-admin-key: <ADMIN_API_KEY>` or `Authorization: Bearer <ADMIN_API_KEY>`
 * 2. Supabase Auth JWT token: `Authorization: Bearer <jwt_token>` (validated via Supabase Auth)
 */
export async function adminAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const adminKeyHeader = request.headers['x-admin-key'] as string | undefined;
  const authHeader = request.headers.authorization;

  // 1. Direct static admin key check
  if (adminKeyHeader && adminKeyHeader === env.ADMIN_API_KEY) {
    return;
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();

    // Check if token matches static key directly
    if (token === env.ADMIN_API_KEY) {
      return;
    }

    // Check if valid Supabase Auth JWT
    try {
      const supabase = getSupabase();
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        (request as any).user = user;
        return;
      }
    } catch {
      // Ignore error and reject below
    }
  }

  reply.status(401).send({
    statusCode: 401,
    error: 'Unauthorized',
    message: 'Valid admin credentials required. Provide x-admin-key header or Bearer token.',
  });
}
