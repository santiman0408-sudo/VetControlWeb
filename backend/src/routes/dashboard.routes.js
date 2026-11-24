const express = require('express');
const router = express.Router();

// ============================================
// CONTROLADOR DEL DASHBOARD
// ============================================
const {
    obtenerEstadisticas
} = require('../controllers/dashboard.controller');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================
const {
    verificarToken,
    verificarRol
} = require('../middleware/auth.middleware');

// ============================================
// RUTA PROTEGIDA DEL DASHBOARD
// ============================================

// GET /api/dashboard/estadisticas
// ADMIN y RECEPCIONISTA
router.get(
    '/estadisticas',
    verificarToken,
    verificarRol('ADMIN', 'RECEPCIONISTA'),
    obtenerEstadisticas
);

// ============================================
// EXPORTAR RUTAS
// ============================================
module.exports = router;
