const express = require('express');
const router = express.Router();

// ============================================
// CONTROLADOR DEL MÓDULO SERVICIOS
// ============================================
const serviciosController = require('../controllers/servicios.controller');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================
const {
    verificarToken,
    verificarRol
} = require('../middleware/auth.middleware');

// ============================================
// RUTAS PROTEGIDAS DEL MÓDULO SERVICIOS
// ============================================

// LISTAR SERVICIOS
// ADMIN y RECEPCIONISTA
router.get(
    '/',
    verificarToken,
    serviciosController.listar
);

// OBTENER SERVICIO POR ID
// ADMIN y RECEPCIONISTA
router.get(
    '/:id',
    verificarToken,
    serviciosController.obtenerPorId
);

// REGISTRAR SERVICIO
// EXCLUSIVO ADMIN
router.post(
    '/',
    verificarToken,
    verificarRol('ADMIN'),
    serviciosController.registrar
);

// ACTUALIZAR SERVICIO
// EXCLUSIVO ADMIN
router.put(
    '/:id',
    verificarToken,
    verificarRol('ADMIN'),
    serviciosController.actualizar
);

// ELIMINAR SERVICIO
// EXCLUSIVO ADMIN
router.delete(
    '/:id',
    verificarToken,
    verificarRol('ADMIN'),
    serviciosController.eliminar
);

// ============================================
// EXPORTAR RUTAS
// ============================================
module.exports = router;
