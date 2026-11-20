const jwt = require('jsonwebtoken');

// ============================================
// VERIFICAR TOKEN JWT
// ============================================
const verificarToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Acceso denegado. Token no proporcionado.'
            });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.usuario = {
            id: decoded.id,
            correo: decoded.correo,
            rol: decoded.rol
        };

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado.'
        });
    }
};

// ============================================
// VERIFICAR ROL DEL USUARIO
// ============================================
const verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {

        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado.'
            });
        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para acceder a este recurso.'
            });
        }

        next();
    };
};

// ============================================
// EXPORTAR MIDDLEWARES
// ============================================
module.exports = {
    verificarToken,
    verificarRol
};
