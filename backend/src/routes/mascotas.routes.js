const express = require('express');
const router = express.Router();

const mascotasController = require('../controllers/mascotas.controller');

const {
    verificarToken
} = require('../middleware/auth.middleware');

// ============================================
// RUTAS PROTEGIDAS DEL MÓDULO MASCOTAS
// ============================================

// LISTAR MASCOTAS
router.get('/', verificarToken, mascotasController.listar);

// CONSULTAR MASCOTA POR ID
router.get('/:id', verificarToken, mascotasController.obtenerPorId);

// REGISTRAR MASCOTA
router.post('/', verificarToken, mascotasController.registrar);

// ACTUALIZAR MASCOTA
router.put('/:id', verificarToken, mascotasController.actualizar);

// ELIMINAR MASCOTA
router.delete('/:id', verificarToken, mascotasController.eliminar);

module.exports = router;
