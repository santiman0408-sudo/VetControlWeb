const express = require('express');
const router = express.Router();

// ============================================
// CONTROLADOR DEL MÓDULO MASCOTAS
// ============================================
const mascotasController = require('../controllers/mascotas.controller');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================
const {
    verificarToken,
    verificarRol
} = require('../middleware/auth.middleware');

// ============================================
// RUTAS PROTEGIDAS DEL MÓDULO MASCOTAS
// ============================================

// LISTAR MASCOTAS
// ADMIN y RECEPCIONISTA
router.get(
    '/',
    verificarToken,
    mascotasController.listar
);

// CONSULTAR MASCOTA POR ID
// ADMIN y RECEPCIONISTA
router.get(
    '/:id',
    verificarToken,
    mascotasController.obtenerPorId
);

// REGISTRAR MASCOTA
// ADMIN y RECEPCIONISTA
router.post(
    '/',
    verificarToken,
    verificarRol('ADMIN', 'RECEPCIONISTA'),
    mascotasController.registrar
);

// ACTUALIZAR MASCOTA
// ADMIN y RECEPCIONISTA
router.put(
    '/:id',
    verificarToken,
    verificarRol('ADMIN', 'RECEPCIONISTA'),
    mascotasController.actualizar
);

// ELIMINAR MASCOTA
// EXCLUSIVO ADMIN
router.delete(
    '/:id',
    verificarToken,
    verificarRol('ADMIN'),
    mascotasController.eliminar
);

// ============================================
// EXPORTAR RUTAS
// ============================================
module.exports = router;
