const express = require('express');
const router = express.Router();

// ============================================
// CONTROLADOR DEL MÓDULO PROPIETARIOS
// ============================================
const propietariosController = require('../controllers/propietarios.controller');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================
const {
    verificarToken,
    verificarRol
} = require('../middleware/auth.middleware');

// ============================================
// RUTAS PROTEGIDAS DE PROPIETARIOS
// ============================================

// LISTAR PROPIETARIOS
// ADMIN y RECEPCIONISTA
router.get(
    '/',
    verificarToken,
    propietariosController.listar
);

// OBTENER PROPIETARIO POR ID
// ADMIN y RECEPCIONISTA
router.get(
    '/:id',
    verificarToken,
    propietariosController.obtenerPorId
);

// REGISTRAR PROPIETARIO
// ADMIN y RECEPCIONISTA
router.post(
    '/',
    verificarToken,
    verificarRol('ADMIN', 'RECEPCIONISTA'),
    propietariosController.registrar
);

// ACTUALIZAR PROPIETARIO
// ADMIN y RECEPCIONISTA
router.put(
    '/:id',
    verificarToken,
    verificarRol('ADMIN', 'RECEPCIONISTA'),
    propietariosController.actualizar
);

// ELIMINAR PROPIETARIO
// EXCLUSIVO ADMIN
router.delete(
    '/:id',
    verificarToken,
    verificarRol('ADMIN'),
    propietariosController.eliminar
);

// ============================================
// EXPORTAR RUTAS
// ============================================
module.exports = router;
