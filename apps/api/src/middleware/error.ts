import type { Request, Response, NextFunction } from 'express';
import { AuthError, ModeUnavailableError } from '@lmms/contracts';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AuthError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof ModeUnavailableError) {
    return res.status(409).json({
      error: 'mode_unavailable',
      message: err.message,
      feature: err.feature,
      mode: err.mode,
    });
  }
  // eslint-disable-next-line no-console
  console.error('[api] unhandled', err);
  return res.status(500).json({ error: 'internal_error' });
}
