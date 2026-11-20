import express, { Request, Response } from 'express';
import cors from 'cors';
import authRoutes from '../routes/auth.routes';
import dashboardRoutes from '../routes/dashboard.routes';

const app = express();

// ============================================
// CONFIGURACION CORS
// ============================================
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173'
  })
);

// ============================================
// MIDDLEWARES
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// RUTAS DE AUTENTICACION
// ============================================
app.use('/api/auth', authRoutes);

// ============================================
// RUTAS DEL DASHBOARD
// ============================================
app.use('/api/dashboard', dashboardRoutes);

// ============================================
// RUTA PRINCIPAL
// ============================================
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Bienvenido a VetControl Web API',
    status: 'online'
  });
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    application: 'VetControl Web',
    service: 'Backend API'
  });
});

export default app;
