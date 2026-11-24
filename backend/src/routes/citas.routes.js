const express = require('express');
const router = express.Router();

// ============================================
// CONTROLADOR DEL MÓDULO CITAS
// ============================================
const citasController = require('../controllers/citas.controller');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================
const {
    verificarToken,
    verificarRol
} = require('../middleware/auth.middleware');

// ============================================
// RUTAS PROTEGIDAS DEL MÓDULO CITAS
// ============================================

// LISTAR CITAS
// ADMIN y RECEPCIONISTA
router.get(
    '/',
    verificarToken,
    citasController.listar
);

// CONSULTAR CITA POR ID
// ADMIN y RECEPCIONISTA
router.get(
    '/:id',
    verificarToken,
    citasController.obtenerPorId
);

// REGISTRAR CITA
// ADMIN y RECEPCIONISTA
router.post(
    '/',
    verificarToken,
    verificarRol('ADMIN', 'RECEPCIONISTA'),
    citasController.registrar
);

// ACTUALIZAR CITA
// ADMIN y RECEPCIONISTA
router.put(
    '/:id',
    verificarToken,
    verificarRol('ADMIN', 'RECEPCIONISTA'),
    citasController.actualizar
);

// ELIMINAR CITA
// EXCLUSIVO ADMIN
router.delete(
    '/:id',
    verificarToken,
    verificarRol('ADMIN'),
    citasController.eliminar
);

// ============================================
// EXPORTAR RUTAS
// ============================================
module.exports = router;
