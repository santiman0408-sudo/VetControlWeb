const express = require('express');
const router = express.Router();

// ============================================
// CONTROLADOR DEL DASHBOARD
// ============================================
const {
    obtenerEstadisticas
} = require('../controllers/dashboard.controller');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
const {
    verificarToken
} = require('../middleware/auth.middleware');

// ============================================
// RUTA PROTEGIDA DEL DASHBOARD
// ============================================

// GET /api/dashboard/estadisticas
router.get(
    '/estadisticas',
    verificarToken,
    obtenerEstadisticas
);

// ============================================
// EXPORTAR RUTAS
// ============================================
module.exports = router;
