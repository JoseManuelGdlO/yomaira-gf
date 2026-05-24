import compression from 'compression';
import cors from 'cors';
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import './models';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error';

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());

  const allowedOrigins =
    env.CORS_ORIGIN === '*'
      ? null
      : env.CORS_ORIGIN.split(',')
          .map(normalizeOrigin)
          .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        // Peticiones sin Origin (curl, health checks)
        if (!origin) return callback(null, true);
        if (env.CORS_ORIGIN === '*') return callback(null, true);
        // En desarrollo: cualquier localhost / 127.0.0.1 (Vite, Lovable, etc.)
        if (
          env.NODE_ENV === 'development' &&
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
          return callback(null, true);
        }
        if (allowedOrigins?.includes(normalizeOrigin(origin))) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (env.NODE_ENV !== 'test') app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/health', (_req, res) => {
    res.json({ data: { status: 'ok', service: 'medflow-api', time: new Date().toISOString() } });
  });

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: env.NODE_ENV === 'production' ? 120 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);

  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
