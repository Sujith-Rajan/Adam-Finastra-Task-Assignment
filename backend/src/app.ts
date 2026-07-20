import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { globalErrorHandler } from './errors/errorHandler';
import { ApiError } from './errors/ApiError';
import { apiActivityLogger } from './middlewares/activity-logger.middleware';


import routes from './routes';

const app: Application = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Activity Logger (must be before routes to intercept res.send)
app.use(apiActivityLogger);

// Routes
app.use('/api/v1', routes);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'API is running successfully' });
});

// Handle 404
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, 'Not Found'));
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
