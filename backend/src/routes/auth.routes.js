const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');

const {
    verificarToken,
    verificarRol
} = require('../middleware/auth.middleware');

// ============================================
// REGISTRO DE USUARIOS
// Solo ADMIN puede registrar nuevos usuarios
// ============================================
router.post(
    '/register',
    verificarToken,
    verificarRol('ADMIN'),
    authController.registrar
);

// ============================================
// INICIO DE SESIÓN
// Ruta pública
// ============================================
router.post('/login', authController.login);

// ============================================
// PERFIL DEL USUARIO AUTENTICADO
// ============================================
router.get(
    '/profile',
    verificarToken,
    authController.perfil
);

module.exports = router;
