const express = require('express');
const router = express.Router();

const solicitudesController = require('../controllers/solicitudes.controller');

const {
    verificarToken
} = require('../middleware/auth.middleware');

// ============================================
// RUTAS PROTEGIDAS DEL MÓDULO SOLICITUDES
// ============================================

// LISTAR SOLICITUDES
router.get('/', verificarToken, solicitudesController.listar);

// OBTENER SOLICITUD POR ID
router.get('/:id', verificarToken, solicitudesController.obtenerPorId);

// REGISTRAR SOLICITUD
router.post('/', verificarToken, solicitudesController.registrar);

// ACTUALIZAR SOLICITUD
router.put('/:id', verificarToken, solicitudesController.actualizar);

// ELIMINAR SOLICITUD
router.delete('/:id', verificarToken, solicitudesController.eliminar);

module.exports = router;
