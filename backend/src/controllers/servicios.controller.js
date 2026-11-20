const { pool } = require('../config/database');

// ============================================
// VALIDACIONES
// ============================================

const validarEstado = (estado) => {
    return ['ACTIVO', 'INACTIVO'].includes(estado);
};

const validarDatosServicio = (datos) => {
    const { nombre, precio, duracion, estado } = datos;

    if (typeof nombre !== 'string' || !nombre.trim()) {
        return 'El nombre del servicio es obligatorio';
    }

    if (
        precio === undefined ||
        precio === null ||
        precio === '' ||
        !Number.isFinite(Number(precio)) ||
        Number(precio) < 0
    ) {
        return 'El precio debe ser un número válido mayor o igual a cero';
    }

    if (
        !Number.isInteger(Number(duracion)) ||
        Number(duracion) <= 0
    ) {
        return 'La duración debe ser un número entero mayor que cero';
    }

    if (estado !== undefined && !validarEstado(estado)) {
        return 'El estado debe ser ACTIVO o INACTIVO';
    }

    return null;
};

// ============================================
// LISTAR SERVICIOS
// ============================================

const listar = async (req, res) => {
    try {
        const [servicios] = await pool.query(`
            SELECT
                id,
                nombre,
                descripcion,
                precio,
                duracion,
                estado
            FROM servicios
            ORDER BY id DESC
        `);

        res.status(200).json({
            success: true,
            total: servicios.length,
            servicios
        });

    } catch (error) {
        console.error('Error al listar servicios:', error);

        res.status(500).json({
            success: false,
            message: 'Error al listar los servicios'
        });
    }
};

// ============================================
// OBTENER SERVICIO POR ID
// ============================================

const obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const [servicios] = await pool.query(
            `
            SELECT
                id,
                nombre,
                descripcion,
                precio,
                duracion,
                estado
            FROM servicios
            WHERE id = ?
            `,
            [id]
        );

        if (servicios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Servicio no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            servicio: servicios[0]
        });

    } catch (error) {
        console.error('Error al obtener servicio:', error);

        res.status(500).json({
            success: false,
            message: 'Error al obtener el servicio'
        });
    }
};

// ============================================
// REGISTRAR SERVICIO
// ============================================

const registrar = async (req, res) => {
    try {
        const {
            nombre,
            descripcion,
            precio,
            duracion = 30,
            estado = 'ACTIVO'
        } = req.body;

        const errorValidacion = validarDatosServicio({
            nombre,
            precio,
            duracion,
            estado
        });

        if (errorValidacion) {
            return res.status(400).json({
                success: false,
                message: errorValidacion
            });
        }

        const [resultado] = await pool.query(
            `
            INSERT INTO servicios
                (nombre, descripcion, precio, duracion, estado)
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                nombre.trim(),
                descripcion?.trim() || null,
                Number(precio),
                Number(duracion),
                estado
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Servicio registrado correctamente',
            servicio: {
                id: resultado.insertId,
                nombre: nombre.trim(),
                descripcion: descripcion?.trim() || null,
                precio: Number(precio),
                duracion: Number(duracion),
                estado
            }
        });

    } catch (error) {
        console.error('Error al registrar servicio:', error);

        res.status(500).json({
            success: false,
            message: 'Error al registrar el servicio'
        });
    }
};

// ============================================
// ACTUALIZAR SERVICIO
// ============================================

const actualizar = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nombre,
            descripcion,
            precio,
            duracion = 30,
            estado = 'ACTIVO'
        } = req.body;

        const errorValidacion = validarDatosServicio({
            nombre,
            precio,
            duracion,
            estado
        });

        if (errorValidacion) {
            return res.status(400).json({
                success: false,
                message: errorValidacion
            });
        }

        // Comprobar que el servicio existe.
        const [serviciosExistentes] = await pool.query(
            'SELECT id FROM servicios WHERE id = ?',
            [id]
        );

        if (serviciosExistentes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Servicio no encontrado'
            });
        }

        await pool.query(
            `
            UPDATE servicios
            SET
                nombre = ?,
                descripcion = ?,
                precio = ?,
                duracion = ?,
                estado = ?
            WHERE id = ?
            `,
            [
                nombre.trim(),
                descripcion?.trim() || null,
                Number(precio),
                Number(duracion),
                estado,
                id
            ]
        );

        res.status(200).json({
            success: true,
            message: 'Servicio actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar servicio:', error);

        res.status(500).json({
            success: false,
            message: 'Error al actualizar el servicio'
        });
    }
};

// ============================================
// ELIMINAR SERVICIO
// ============================================

const eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await pool.query(
            'DELETE FROM servicios WHERE id = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Servicio no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Servicio eliminado correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar servicio:', error);

        res.status(500).json({
            success: false,
            message: 'No se pudo eliminar el servicio. Puede estar relacionado con citas existentes.'
        });
    }
};

// ============================================
// EXPORTAR CONTROLADOR
// ============================================

module.exports = {
    listar,
    obtenerPorId,
    registrar,
    actualizar,
    eliminar
};
