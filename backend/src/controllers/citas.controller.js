const { pool } = require('../config/database');

// ============================================
// LISTAR CITAS
// ============================================
async function listar(req, res) {
    try {
        const [citas] = await pool.query(`
            SELECT
                c.id,
                c.mascota_id,
                c.servicio_id,
                c.usuario_id,
                c.fecha,
                c.hora,
                c.motivo,
                c.estado,
                c.fecha_registro,
                m.nombre AS mascota_nombre,
                m.especie AS mascota_especie,
                p.nombres AS propietario_nombres,
                p.apellidos AS propietario_apellidos,
                s.nombre AS servicio_nombre,
                u.nombre AS usuario_nombre
            FROM citas c
            INNER JOIN mascotas m ON c.mascota_id = m.id
            INNER JOIN propietarios p ON m.propietario_id = p.id
            INNER JOIN servicios s ON c.servicio_id = s.id
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            ORDER BY c.fecha DESC, c.hora DESC
        `);

        res.status(200).json({
            success: true,
            total: citas.length,
            citas
        });

    } catch (error) {
        console.error('Error al listar citas:', error);

        res.status(500).json({
            success: false,
            message: 'Error al obtener las citas'
        });
    }
}

// ============================================
// CONSULTAR CITA POR ID
// ============================================
async function obtenerPorId(req, res) {
    try {
        const { id } = req.params;

        const [citas] = await pool.query(`
            SELECT
                c.*,
                m.nombre AS mascota_nombre,
                m.especie AS mascota_especie,
                p.nombres AS propietario_nombres,
                p.apellidos AS propietario_apellidos,
                p.telefono AS propietario_telefono,
                s.nombre AS servicio_nombre,
                u.nombre AS usuario_nombre
            FROM citas c
            INNER JOIN mascotas m ON c.mascota_id = m.id
            INNER JOIN propietarios p ON m.propietario_id = p.id
            INNER JOIN servicios s ON c.servicio_id = s.id
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.id = ?
        `, [id]);

        if (citas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            cita: citas[0]
        });

    } catch (error) {
        console.error('Error al consultar cita:', error);

        res.status(500).json({
            success: false,
            message: 'Error al consultar la cita'
        });
    }
}

// ============================================
// REGISTRAR CITA
// ============================================
async function registrar(req, res) {
    try {
        const {
            mascota_id,
            servicio_id,
            usuario_id,
            fecha,
            hora,
            motivo,
            estado
        } = req.body;

        if (!mascota_id || !servicio_id || !fecha || !hora) {
            return res.status(400).json({
                success: false,
                message: 'La mascota, servicio, fecha y hora son obligatorios'
            });
        }

        // Verificar mascota
        const [mascotas] = await pool.query(
            'SELECT id FROM mascotas WHERE id = ?',
            [mascota_id]
        );

        if (mascotas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'La mascota seleccionada no existe'
            });
        }

        // Verificar servicio
        const [servicios] = await pool.query(
            'SELECT id FROM servicios WHERE id = ?',
            [servicio_id]
        );

        if (servicios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El servicio seleccionado no existe'
            });
        }

        // Verificar usuario si se proporciona
        if (usuario_id) {
            const [usuarios] = await pool.query(
                'SELECT id FROM usuarios WHERE id = ?',
                [usuario_id]
            );

            if (usuarios.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'El usuario seleccionado no existe'
                });
            }
        }

        const [resultado] = await pool.query(`
            INSERT INTO citas (
                mascota_id,
                servicio_id,
                usuario_id,
                fecha,
                hora,
                motivo,
                estado
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            mascota_id,
            servicio_id,
            usuario_id || null,
            fecha,
            hora,
            motivo || null,
            estado || 'PENDIENTE'
        ]);

        res.status(201).json({
            success: true,
            message: 'Cita registrada correctamente',
            cita: {
                id: resultado.insertId,
                mascota_id,
                servicio_id,
                usuario_id: usuario_id || null,
                fecha,
                hora,
                motivo: motivo || null,
                estado: estado || 'PENDIENTE'
            }
        });

    } catch (error) {
        console.error('Error al registrar cita:', error);

        res.status(500).json({
            success: false,
            message: 'Error al registrar la cita'
        });
    }
}

// ============================================
// ACTUALIZAR CITA
// ============================================
async function actualizar(req, res) {
    try {
        const { id } = req.params;

        const {
            mascota_id,
            servicio_id,
            usuario_id,
            fecha,
            hora,
            motivo,
            estado
        } = req.body;

        if (!mascota_id || !servicio_id || !fecha || !hora) {
            return res.status(400).json({
                success: false,
                message: 'La mascota, servicio, fecha y hora son obligatorios'
            });
        }

        const [citas] = await pool.query(
            'SELECT id FROM citas WHERE id = ?',
            [id]
        );

        if (citas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        const [mascotas] = await pool.query(
            'SELECT id FROM mascotas WHERE id = ?',
            [mascota_id]
        );

        if (mascotas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'La mascota seleccionada no existe'
            });
        }

        const [servicios] = await pool.query(
            'SELECT id FROM servicios WHERE id = ?',
            [servicio_id]
        );

        if (servicios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El servicio seleccionado no existe'
            });
        }

        if (usuario_id) {
            const [usuarios] = await pool.query(
                'SELECT id FROM usuarios WHERE id = ?',
                [usuario_id]
            );

            if (usuarios.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'El usuario seleccionado no existe'
                });
            }
        }

        await pool.query(`
            UPDATE citas
            SET
                mascota_id = ?,
                servicio_id = ?,
                usuario_id = ?,
                fecha = ?,
                hora = ?,
                motivo = ?,
                estado = ?
            WHERE id = ?
        `, [
            mascota_id,
            servicio_id,
            usuario_id || null,
            fecha,
            hora,
            motivo || null,
            estado || 'PENDIENTE',
            id
        ]);

        res.status(200).json({
            success: true,
            message: 'Cita actualizada correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar cita:', error);

        res.status(500).json({
            success: false,
            message: 'Error al actualizar la cita'
        });
    }
}

// ============================================
// ELIMINAR CITA
// ============================================
async function eliminar(req, res) {
    try {
        const { id } = req.params;

        const [citas] = await pool.query(
            'SELECT id FROM citas WHERE id = ?',
            [id]
        );

        if (citas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        await pool.query(
            'DELETE FROM citas WHERE id = ?',
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Cita eliminada correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar cita:', error);

        res.status(500).json({
            success: false,
            message: 'No se pudo eliminar la cita'
        });
    }
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================
module.exports = {
    listar,
    obtenerPorId,
    registrar,
    actualizar,
    eliminar
};
