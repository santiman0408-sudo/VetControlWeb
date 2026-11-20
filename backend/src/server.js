require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// ============================================
// CONFIGURACIÓN DE MIDDLEWARE
// ============================================

app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173'
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// IMPORTACIÓN DE RUTAS
// ============================================

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const propietariosRoutes = require('./routes/propietarios.routes');
const mascotasRoutes = require('./routes/mascotas.routes');
const citasRoutes = require('./routes/citas.routes');
const serviciosRoutes = require('./routes/servicios.routes');
const solicitudesRoutes = require('./routes/solicitudes.routes');

// ============================================
// REGISTRO DE RUTAS PRINCIPALES DE LA API
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/propietarios', propietariosRoutes);
app.use('/api/mascotas', mascotasRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/solicitudes', solicitudesRoutes);

// ============================================
// RUTA PRINCIPAL
// ============================================

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'VetControl Web API funcionando correctamente',
        version: '1.0.0'
    });
});

// ============================================
// VERIFICACIÓN DEL ESTADO DEL SERVIDOR
// ============================================

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Servidor operativo',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// RUTA NO ENCONTRADA
// ============================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
    });
});

// ============================================
// MANEJO GLOBAL DE ERRORES
// ============================================

app.use((err, req, res, next) => {
    console.error('Error interno del servidor:', err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor'
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log('');
    console.log('============================================');
    console.log('       VETCONTROL WEB - BACKEND');
    console.log('============================================');
    console.log(`Servidor:       http://localhost:${PORT}`);
    console.log(`API:            http://localhost:${PORT}/api`);
    console.log(`Estado:         http://localhost:${PORT}/api/health`);
    console.log(`Autenticación:  http://localhost:${PORT}/api/auth`);
    console.log(`Dashboard:      http://localhost:${PORT}/api/dashboard/estadisticas`);
    console.log(`Propietarios:  http://localhost:${PORT}/api/propietarios`);
    console.log(`Mascotas:      http://localhost:${PORT}/api/mascotas`);
    console.log(`Citas:         http://localhost:${PORT}/api/citas`);
    console.log(`Servicios:     http://localhost:${PORT}/api/servicios`);
    console.log(`Solicitudes:   http://localhost:${PORT}/api/solicitudes`);
    console.log('============================================');
    console.log('');
});
