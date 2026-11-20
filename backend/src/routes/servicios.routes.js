const express = require('express');
const router = express.Router();

const serviciosController = require('../controllers/servicios.controller');

const {
    verificarToken
} = require('../middleware/auth.middleware');

// ============================================
// RUTAS PROTEGIDAS DEL MÓDULO SERVICIOS
// ============================================

// LISTAR SERVICIOS
router.get('/', verificarToken, serviciosController.listar);

// OBTENER SERVICIO POR ID
router.get('/:id', verificarToken, serviciosController.obtenerPorId);

// REGISTRAR SERVICIO
router.post('/', verificarToken, serviciosController.registrar);

// ACTUALIZAR SERVICIO
router.put('/:id', verificarToken, serviciosController.actualizar);

// ELIMINAR SERVICIO
router.delete('/:id', verificarToken, serviciosController.eliminar);

module.exports = router;
