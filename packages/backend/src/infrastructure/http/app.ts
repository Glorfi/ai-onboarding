import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares';
import apiRoutes from './routes';

export function createApp() {
  const app = express();
  app.set('trust proxy', true);
  app.use(helmet());
  app.use(cors({ credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api', apiRoutes);

  app.use(errorHandler);

  return app;
}
