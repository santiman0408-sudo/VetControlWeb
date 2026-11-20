const { pool } = require('../config/database');

// ============================================
// LISTAR PROPIETARIOS
// GET /api/propietarios
// ============================================
async function listar(req, res) {
    try {
        const [propietarios] = await pool.query(`
            SELECT
                id,
                nombres,
                apellidos,
                dni,
                telefono,
                correo,
                direccion,
                fecha_registro
            FROM propietarios
            ORDER BY id DESC
        `);

        res.status(200).json({
            success: true,
            total: propietarios.length,
            propietarios
        });
    } catch (error) {
        console.error('Error al listar propietarios:', error);

        res.status(500).json({
            success: false,
            message: 'Error al obtener los propietarios'
        });
    }
}

// ============================================
// OBTENER PROPIETARIO POR ID
// GET /api/propietarios/:id
// ============================================
async function obtenerPorId(req, res) {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de propietario inválido'
            });
        }

        const [propietarios] = await pool.query(
            'SELECT * FROM propietarios WHERE id = ?',
            [id]
        );

        if (propietarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Propietario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            propietario: propietarios[0]
        });
    } catch (error) {
        console.error('Error al obtener propietario:', error);

        res.status(500).json({
            success: false,
            message: 'Error al obtener el propietario'
        });
    }
}

// ============================================
// REGISTRAR PROPIETARIO
// POST /api/propietarios
// ============================================
async function registrar(req, res) {
    try {
        const {
            nombres,
            apellidos,
            dni,
            telefono,
            correo,
            direccion
        } = req.body;

        if (
            !nombres ||
            !apellidos ||
            !telefono ||
            !String(nombres).trim() ||
            !String(apellidos).trim() ||
            !String(telefono).trim()
        ) {
            return res.status(400).json({
                success: false,
                message: 'Nombres, apellidos y teléfono son obligatorios'
            });
        }

        const datos = {
            nombres: String(nombres).trim(),
            apellidos: String(apellidos).trim(),
            dni: dni ? String(dni).trim() : null,
            telefono: String(telefono).trim(),
            correo: correo ? String(correo).trim() : null,
            direccion: direccion ? String(direccion).trim() : null
        };

        if (datos.dni) {
            const [existente] = await pool.query(
                'SELECT id FROM propietarios WHERE dni = ?',
                [datos.dni]
            );

            if (existente.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un propietario con ese DNI'
                });
            }
        }

        const [resultado] = await pool.query(
            `INSERT INTO propietarios
                (nombres, apellidos, dni, telefono, correo, direccion)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                datos.nombres,
                datos.apellidos,
                datos.dni,
                datos.telefono,
                datos.correo,
                datos.direccion
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Propietario registrado correctamente',
            id: resultado.insertId
        });
    } catch (error) {
        console.error('Error al registrar propietario:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'El DNI ingresado ya está registrado'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al registrar el propietario'
        });
    }
}

// ============================================
// ACTUALIZAR PROPIETARIO
// PUT /api/propietarios/:id
// ============================================
async function actualizar(req, res) {
    try {
        const { id } = req.params;

        const {
            nombres,
            apellidos,
            dni,
            telefono,
            correo,
            direccion
        } = req.body;

        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de propietario inválido'
            });
        }

        if (
            !nombres ||
            !apellidos ||
            !telefono ||
            !String(nombres).trim() ||
            !String(apellidos).trim() ||
            !String(telefono).trim()
        ) {
            return res.status(400).json({
                success: false,
                message: 'Nombres, apellidos y teléfono son obligatorios'
            });
        }

        const [propietario] = await pool.query(
            'SELECT id FROM propietarios WHERE id = ?',
            [id]
        );

        if (propietario.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Propietario no encontrado'
            });
        }

        const dniNormalizado = dni ? String(dni).trim() : null;

        if (dniNormalizado) {
            const [existente] = await pool.query(
                'SELECT id FROM propietarios WHERE dni = ? AND id <> ?',
                [dniNormalizado, id]
            );

            if (existente.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'El DNI pertenece a otro propietario'
                });
            }
        }

        await pool.query(
            `UPDATE propietarios
             SET nombres = ?,
                 apellidos = ?,
                 dni = ?,
                 telefono = ?,
                 correo = ?,
                 direccion = ?
             WHERE id = ?`,
            [
                String(nombres).trim(),
                String(apellidos).trim(),
                dniNormalizado,
                String(telefono).trim(),
                correo ? String(correo).trim() : null,
                direccion ? String(direccion).trim() : null,
                id
            ]
        );

        res.status(200).json({
            success: true,
            message: 'Propietario actualizado correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar propietario:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'El DNI ingresado ya está registrado'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar el propietario'
        });
    }
}

// ============================================
// ELIMINAR PROPIETARIO
// DELETE /api/propietarios/:id
//
// Las mascotas se conservan.
// Se desvinculan del propietario eliminado.
// ============================================
async function eliminar(req, res) {
    let conexion;

    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de propietario inválido'
            });
        }

        // Obtener conexión para realizar una transacción
        conexion = await pool.getConnection();

        await conexion.beginTransaction();

        // Verificar que el propietario exista
        const [propietarios] = await conexion.query(
            'SELECT id FROM propietarios WHERE id = ? FOR UPDATE',
            [id]
        );

        if (propietarios.length === 0) {
            await conexion.rollback();

            return res.status(404).json({
                success: false,
                message: 'Propietario no encontrado'
            });
        }

        // Contar mascotas asociadas
        const [mascotas] = await conexion.query(
            `SELECT COUNT(*) AS total
             FROM mascotas
             WHERE propietario_id = ?`,
            [id]
        );

        const totalMascotas = Number(mascotas[0].total);

        // Conservar mascotas y quitar su propietario
        await conexion.query(
            `UPDATE mascotas
             SET propietario_id = NULL
             WHERE propietario_id = ?`,
            [id]
        );

        // Eliminar propietario
        await conexion.query(
            'DELETE FROM propietarios WHERE id = ?',
            [id]
        );

        // Confirmar ambas operaciones
        await conexion.commit();

        res.status(200).json({
            success: true,
            message: totalMascotas > 0
                ? `Propietario eliminado correctamente. Se conservaron ${totalMascotas} mascota(s) sin propietario asignado.`
                : 'Propietario eliminado correctamente.',
            mascotasConservadas: totalMascotas
        });

    } catch (error) {
        console.error('Error al eliminar propietario:', error);

        // Revertir cambios si ocurrió un error
        if (conexion) {
            await conexion.rollback();
        }

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar el propietario porque tiene otros registros asociados.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al eliminar el propietario'
        });

    } finally {
        // Liberar conexión
        if (conexion) {
            conexion.release();
        }
    }
}

// ============================================
// EXPORTAR CONTROLADORES
// ============================================
module.exports = {
    listar,
    obtenerPorId,
    registrar,
    actualizar,
    eliminar
};
