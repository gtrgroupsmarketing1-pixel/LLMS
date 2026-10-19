import type { Request, Response, NextFunction } from 'express';

/**
 * Structured JSON logger for production.
 * In development, it logs a more readable format.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.headers['x-request-id'],
    };

    if (process.env.NODE_ENV === 'production') {
      // In production, log as JSON for Datadog/CloudWatch
      console.log(JSON.stringify(logData));
    } else {
      // In dev, log with colors
      const color = res.statusCode >= 500 ? '\x1b[31m' : res.statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
      console.log(`${color}${res.statusCode}\x1b[0m ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
  });

  next();
}
