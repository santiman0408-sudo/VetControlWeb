const express = require('express');
const router = express.Router();

// ============================================
// CONTROLADOR DEL MÓDULO SOLICITUDES
// ============================================
const solicitudesController = require('../controllers/solicitudes.controller');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================
const {
    verificarToken,
    verificarRol
} = require('../middleware/auth.middleware');

// ============================================
// RUTAS PROTEGIDAS DEL MÓDULO SOLICITUDES
// ============================================

// LISTAR SOLICITUDES
// ADMIN y RECEPCIONISTA
router.get(
    '/',
    verificarToken,
    solicitudesController.listar
);

// OBTENER SOLICITUD POR ID
// ADMIN y RECEPCIONISTA
router.get(
    '/:id',
    verificarToken,
    solicitudesController.obtenerPorId
);

// REGISTRAR SOLICITUD
// ADMIN y RECEPCIONISTA
router.post(
    '/',
    verificarToken,
    verificarRol('ADMIN', 'RECEPCIONISTA'),
    solicitudesController.registrar
);

// ACTUALIZAR SOLICITUD
// ADMIN y RECEPCIONISTA
router.put(
    '/:id',
    verificarToken,
    verificarRol('ADMIN', 'RECEPCIONISTA'),
    solicitudesController.actualizar
);

// ELIMINAR SOLICITUD
// EXCLUSIVO ADMIN
router.delete(
    '/:id',
    verificarToken,
    verificarRol('ADMIN'),
    solicitudesController.eliminar
);

// ============================================
// EXPORTAR RUTAS
// ============================================
module.exports = router;
