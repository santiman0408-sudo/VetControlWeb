const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// ============================================
// REGISTRAR USUARIO
// ============================================
const registrar = async (req, res) => {
    try {
        const { nombre, apellido, correo, password } = req.body;

        // ----------------------------------------
        // VALIDAR CAMPOS OBLIGATORIOS
        // ----------------------------------------
        if (!nombre || !apellido || !correo || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        // ----------------------------------------
        // VALIDAR CONTRASEÑA
        // ----------------------------------------
        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 8 caracteres'
            });
        }

        // ----------------------------------------
        // NORMALIZAR DATOS
        // ----------------------------------------
        const nombreNormalizado = nombre.trim();
        const apellidoNormalizado = apellido.trim();
        const correoNormalizado = correo.trim().toLowerCase();

        if (!nombreNormalizado || !apellidoNormalizado || !correoNormalizado) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, apellido y correo no pueden estar vacíos'
            });
        }

        // ----------------------------------------
        // VERIFICAR CORREO EXISTENTE
        // ----------------------------------------
        const [usuariosExistentes] = await pool.query(
            'SELECT id FROM usuarios WHERE correo = ?',
            [correoNormalizado]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El correo ya está registrado'
            });
        }

        // ----------------------------------------
        // ENCRIPTAR CONTRASEÑA
        // ----------------------------------------
        const passwordHash = await bcrypt.hash(password, 10);

        // ----------------------------------------
        // ASIGNAR ROL
        // ENUM ACTUAL:
        // ADMIN, VETERINARIO, RECEPCIONISTA
        // ----------------------------------------
        const rol = 'RECEPCIONISTA';

        // ----------------------------------------
        // REGISTRAR USUARIO EN MYSQL
        // ----------------------------------------
        const [resultado] = await pool.query(
            `INSERT INTO usuarios
                (nombre, apellido, correo, password, rol)
             VALUES (?, ?, ?, ?, ?)`,
            [
                nombreNormalizado,
                apellidoNormalizado,
                correoNormalizado,
                passwordHash,
                rol
            ]
        );

        // ----------------------------------------
        // RESPUESTA EXITOSA
        // ----------------------------------------
        return res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente',
            usuario: {
                id: resultado.insertId,
                nombre: nombreNormalizado,
                apellido: apellidoNormalizado,
                correo: correoNormalizado,
                rol
            }
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error);

        return res.status(500).json({
            success: false,
            message: 'Error interno al registrar usuario'
        });
    }
};

// ============================================
// INICIAR SESIÓN
// ============================================
const login = async (req, res) => {
    try {
        const { correo, password } = req.body;

        // ----------------------------------------
        // VALIDAR DATOS
        // ----------------------------------------
        if (!correo || !password) {
            return res.status(400).json({
                success: false,
                message: 'Correo y contraseña son obligatorios'
            });
        }

        const correoNormalizado = correo.trim().toLowerCase();

        // ----------------------------------------
        // BUSCAR USUARIO
        // ----------------------------------------
        const [usuarios] = await pool.query(
            `SELECT id, nombre, apellido, correo, password, rol, estado
             FROM usuarios
             WHERE correo = ?`,
            [correoNormalizado]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        const usuario = usuarios[0];

        // ----------------------------------------
        // VALIDAR ESTADO
        // ----------------------------------------
        if (usuario.estado !== 'ACTIVO') {
            return res.status(403).json({
                success: false,
                message: 'El usuario se encuentra inactivo'
            });
        }

        // ----------------------------------------
        // VERIFICAR CONTRASEÑA
        // ----------------------------------------
        const passwordValida = await bcrypt.compare(
            password,
            usuario.password
        );

        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        // ----------------------------------------
        // VERIFICAR JWT_SECRET
        // ----------------------------------------
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET no está configurado');
        }

        // ----------------------------------------
        // GENERAR TOKEN JWT
        // ----------------------------------------
        const token = jwt.sign(
            {
                id: usuario.id,
                correo: usuario.correo,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '8h'
            }
        );

        // ----------------------------------------
        // RESPUESTA LOGIN EXITOSO
        // ----------------------------------------
        return res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);

        return res.status(500).json({
            success: false,
            message: 'Error interno al iniciar sesión'
        });
    }
};

// ============================================
// CONSULTAR PERFIL
// ============================================
const perfil = async (req, res) => {
    try {
        // ----------------------------------------
        // VALIDAR USUARIO AUTENTICADO
        // ----------------------------------------
        if (!req.usuario || !req.usuario.id) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        // ----------------------------------------
        // CONSULTAR PERFIL
        // ----------------------------------------
        const [usuarios] = await pool.query(
            `SELECT id, nombre, apellido, correo, rol, estado, fecha_registro
             FROM usuarios
             WHERE id = ?`,
            [req.usuario.id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            usuario: usuarios[0]
        });

    } catch (error) {
        console.error('Error al consultar perfil:', error);

        return res.status(500).json({
            success: false,
            message: 'Error interno al consultar perfil'
        });
    }
};

// ============================================
// EXPORTAR CONTROLADORES
// ============================================
module.exports = {
    registrar,
    login,
    perfil
};
