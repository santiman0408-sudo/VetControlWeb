const express = require('express');
const router = express.Router();

const propietariosController = require('../controllers/propietarios.controller');

const {
    verificarToken
} = require('../middleware/auth.middleware');

// ============================================
// RUTAS PROTEGIDAS DE PROPIETARIOS
// ============================================

// LISTAR PROPIETARIOS
router.get('/', verificarToken, propietariosController.listar);

// OBTENER PROPIETARIO POR ID
router.get('/:id', verificarToken, propietariosController.obtenerPorId);

// REGISTRAR PROPIETARIO
router.post('/', verificarToken, propietariosController.registrar);

// ACTUALIZAR PROPIETARIO
router.put('/:id', verificarToken, propietariosController.actualizar);

// ELIMINAR PROPIETARIO
router.delete('/:id', verificarToken, propietariosController.eliminar);

module.exports = router;
