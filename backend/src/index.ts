import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db';
import { logger } from './utils/logger';
import { sanitize } from './middleware/sanitize';
import { apiLimiter } from './middleware/rateLimiter';
import authRoutes from './modules/auth/auth.routes';
import labRoutes from './modules/lab/lab.routes';
import userRoutes from './modules/user/user.routes';
import patientRoutes from './modules/patient/patient.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import testRoutes from './modules/test/test.routes';
import orderRoutes from './modules/order/order.routes';

export const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(sanitize);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/orders', orderRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status && err.status < 500 ? err.status : 500;
  res.status(status).json({ success: false, message: status === 500 ? 'Server error' : err.message });
});

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT) || 5000;
  connectDB().then(() => {
    app.listen(port, () => logger.info(`API listening on ${port}`));
  });
}