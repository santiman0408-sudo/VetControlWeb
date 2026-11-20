const express = require('express');
const router = express.Router();

const citasController = require('../controllers/citas.controller');

const {
    verificarToken
} = require('../middleware/auth.middleware');

// ============================================
// RUTAS PROTEGIDAS DEL MÓDULO CITAS
// ============================================

// LISTAR CITAS
router.get('/', verificarToken, citasController.listar);

// CONSULTAR CITA POR ID
router.get('/:id', verificarToken, citasController.obtenerPorId);

// REGISTRAR CITA
router.post('/', verificarToken, citasController.registrar);

// ACTUALIZAR CITA
router.put('/:id', verificarToken, citasController.actualizar);

// ELIMINAR CITA
router.delete('/:id', verificarToken, citasController.eliminar);

module.exports = router;
