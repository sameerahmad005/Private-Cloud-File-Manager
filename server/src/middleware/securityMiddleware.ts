import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { env } from '../config/env.js';

export function configureSecurityHeaders(app: any) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://static.cloudflareinsights.com', 'https://*.cloudflareinsights.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://*.googleusercontent.com', 'https://*.gstatic.com'],
          mediaSrc: ["'self'", 'blob:', 'data:'],
          connectSrc: ["'self'", 'https://*.googleapis.com', 'https://static.cloudflareinsights.com', 'https://*.cloudflareinsights.com'],
          frameSrc: ["'self'", 'https://docs.google.com', 'https://drive.google.com'],
        },
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'no-referrer' },
    })
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
}

export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[UNHANDLED_ERROR]:', err);

  const status = err.status || err.statusCode || 500;
  const isForbiddenOutsideRoot = err.message?.includes('FORBIDDEN_OUTSIDE_ROOT');

  let message = 'An unexpected server error occurred. Please try again.';
  if (isForbiddenOutsideRoot) {
    message = 'Access denied: Requested resource is outside the application root directory.';
  } else if (env.APP_ENV === 'development' && err.message) {
    message = err.message;
  }

  res.status(isForbiddenOutsideRoot ? 403 : status).json({
    success: false,
    error: message,
  });
}
