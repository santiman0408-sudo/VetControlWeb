const { pool } = require('../config/database');

// ======================================================
// LISTAR SOLICITUDES
// GET /api/solicitudes
// ======================================================

const listar = async (req, res) => {
    try {
        const sql = `
            SELECT
                s.id,
                s.propietario_id,
                s.mascota_id,
                s.tipo_servicio,
                s.prioridad,
                s.descripcion,
                s.estado,
                s.fecha_registro,

                COALESCE(
                    CONCAT(p.nombres, ' ', p.apellidos),
                    'Propietario no disponible'
                ) AS propietario_nombre,

                COALESCE(
                    p.telefono,
                    'No disponible'
                ) AS propietario_telefono,

                COALESCE(
                    m.nombre,
                    'Mascota no disponible'
                ) AS mascota_nombre

            FROM solicitudes s

            LEFT JOIN propietarios p
                ON s.propietario_id = p.id

            LEFT JOIN mascotas m
                ON s.mascota_id = m.id

            ORDER BY s.fecha_registro DESC, s.id DESC
        `;

        const [solicitudes] = await pool.query(sql);

        return res.status(200).json({
            success: true,
            total: solicitudes.length,
            solicitudes
        });

    } catch (error) {
        console.error('Error SQL al listar solicitudes:', error);

        return res.status(500).json({
            success: false,
            message: 'Error al obtener las solicitudes.',
            error: error.message
        });
    }
};

// ======================================================
// OBTENER SOLICITUD POR ID
// GET /api/solicitudes/:id
// ======================================================

const obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const sql = `
            SELECT
                s.id,
                s.propietario_id,
                s.mascota_id,
                s.tipo_servicio,
                s.prioridad,
                s.descripcion,
                s.estado,
                s.fecha_registro,

                COALESCE(
                    CONCAT(p.nombres, ' ', p.apellidos),
                    'Propietario no disponible'
                ) AS propietario_nombre,

                COALESCE(
                    p.telefono,
                    'No disponible'
                ) AS propietario_telefono,

                COALESCE(
                    m.nombre,
                    'Mascota no disponible'
                ) AS mascota_nombre

            FROM solicitudes s

            LEFT JOIN propietarios p
                ON s.propietario_id = p.id

            LEFT JOIN mascotas m
                ON s.mascota_id = m.id

            WHERE s.id = ?
        `;

        const [solicitudes] = await pool.query(sql, [id]);

        if (solicitudes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada.'
            });
        }

        return res.status(200).json({
            success: true,
            solicitud: solicitudes[0]
        });

    } catch (error) {
        console.error('Error SQL al obtener solicitud:', error);

        return res.status(500).json({
            success: false,
            message: 'Error al obtener la solicitud.',
            error: error.message
        });
    }
};

// ======================================================
// REGISTRAR SOLICITUD
// POST /api/solicitudes
// ======================================================

const registrar = async (req, res) => {
    try {
        const {
            propietario_id,
            mascota_id,
            tipo_servicio,
            prioridad,
            descripcion,
            estado
        } = req.body;

        if (!propietario_id || !mascota_id || !tipo_servicio) {
            return res.status(400).json({
                success: false,
                message: 'Propietario, mascota y tipo de servicio son obligatorios.'
            });
        }

        // Verificar que la mascota pertenezca al propietario
        const [mascotas] = await pool.query(
            `SELECT id
             FROM mascotas
             WHERE id = ? AND propietario_id = ?`,
            [mascota_id, propietario_id]
        );

        if (mascotas.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'La mascota seleccionada no pertenece al propietario.'
            });
        }

        const sql = `
            INSERT INTO solicitudes (
                propietario_id,
                mascota_id,
                tipo_servicio,
                prioridad,
                descripcion,
                estado
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [resultado] = await pool.query(sql, [
            propietario_id,
            mascota_id,
            tipo_servicio,
            prioridad || 'MEDIA',
            descripcion || null,
            estado || 'PENDIENTE'
        ]);

        return res.status(201).json({
            success: true,
            message: 'Solicitud registrada correctamente.',
            id: resultado.insertId
        });

    } catch (error) {
        console.error('Error SQL al registrar solicitud:', error);

        return res.status(500).json({
            success: false,
            message: 'Error al registrar la solicitud.',
            error: error.message
        });
    }
};

// ======================================================
// ACTUALIZAR SOLICITUD
// PUT /api/solicitudes/:id
// ======================================================

const actualizar = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            propietario_id,
            mascota_id,
            tipo_servicio,
            prioridad,
            descripcion,
            estado
        } = req.body;

        if (!propietario_id || !mascota_id || !tipo_servicio) {
            return res.status(400).json({
                success: false,
                message: 'Propietario, mascota y tipo de servicio son obligatorios.'
            });
        }

        const [existente] = await pool.query(
            'SELECT id FROM solicitudes WHERE id = ?',
            [id]
        );

        if (existente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada.'
            });
        }

        // Verificar que la mascota pertenezca al propietario
        const [mascotas] = await pool.query(
            `SELECT id
             FROM mascotas
             WHERE id = ? AND propietario_id = ?`,
            [mascota_id, propietario_id]
        );

        if (mascotas.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'La mascota seleccionada no pertenece al propietario.'
            });
        }

        const sql = `
            UPDATE solicitudes
            SET
                propietario_id = ?,
                mascota_id = ?,
                tipo_servicio = ?,
                prioridad = ?,
                descripcion = ?,
                estado = ?
            WHERE id = ?
        `;

        await pool.query(sql, [
            propietario_id,
            mascota_id,
            tipo_servicio,
            prioridad || 'MEDIA',
            descripcion || null,
            estado || 'PENDIENTE',
            id
        ]);

        return res.status(200).json({
            success: true,
            message: 'Solicitud actualizada correctamente.'
        });

    } catch (error) {
        console.error('Error SQL al actualizar solicitud:', error);

        return res.status(500).json({
            success: false,
            message: 'Error al actualizar la solicitud.',
            error: error.message
        });
    }
};

// ======================================================
// ELIMINAR SOLICITUD
// DELETE /api/solicitudes/:id
// ======================================================

const eliminar = async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await pool.query(
            'DELETE FROM solicitudes WHERE id = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Solicitud eliminada correctamente.'
        });

    } catch (error) {
        console.error('Error SQL al eliminar solicitud:', error);

        return res.status(500).json({
            success: false,
            message: 'Error al eliminar la solicitud.',
            error: error.message
        });
    }
};

// ======================================================
// EXPORTAR CONTROLADORES
// ======================================================

module.exports = {
    listar,
    obtenerPorId,
    registrar,
    actualizar,
    eliminar
};
