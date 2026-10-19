import type { Request, Response, NextFunction } from 'express';

/**
 * Intercepts errors to send to Sentry/Datadog.
 * For this build, we mock the Sentry call but structure it correctly.
 */
export function errorTracker(err: any, req: Request, res: Response, next: NextFunction) {
  // If Sentry DSN is provided, initialize Sentry here in a real app
  const sentryDsn = process.env.SENTRY_DSN;

  if (sentryDsn) {
    // Mock Sentry capture
    console.error(`[SENTRY] Capturing exception for ${req.method} ${req.url}`, {
      error: err.message,
      stack: err.stack,
      user: (req as any).auth?.sub,
      tenant: (req as any).auth?.tenantId,
    });
  }

  next(err);
}
