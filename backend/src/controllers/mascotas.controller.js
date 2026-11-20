const { pool } = require('../config/database');

// ============================================
// VALIDACIONES
// ============================================

function validarFecha(fecha) {
    if (!fecha) return true;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return false;
    }

    const [anio, mes, dia] = fecha.split('-').map(Number);
    const comprobacion = new Date(Date.UTC(anio, mes - 1, dia));

    return (
        comprobacion.getUTCFullYear() === anio &&
        comprobacion.getUTCMonth() === mes - 1 &&
        comprobacion.getUTCDate() === dia
    );
}

function validarDatosMascota(datos) {
    const {
        propietario_id,
        nombre,
        especie,
        fecha_nacimiento,
        peso
    } = datos;

    if (
        !Number.isInteger(Number(propietario_id)) ||
        Number(propietario_id) <= 0
    ) {
        return 'Selecciona un propietario válido.';
    }

    if (!nombre || !String(nombre).trim()) {
        return 'El nombre de la mascota es obligatorio.';
    }

    if (!especie || !String(especie).trim()) {
        return 'La especie de la mascota es obligatoria.';
    }

    if (fecha_nacimiento && !validarFecha(fecha_nacimiento)) {
        return 'La fecha de nacimiento debe tener formato YYYY-MM-DD y ser válida.';
    }

    if (peso !== undefined && peso !== null && peso !== '') {
        const pesoNumerico = Number(peso);

        if (!Number.isFinite(pesoNumerico) || pesoNumerico <= 0) {
            return 'El peso debe ser un número mayor que cero.';
        }
    }

    return null;
}

// ============================================
// LISTAR MASCOTAS
// ============================================

async function listar(req, res) {
    try {
        const [mascotas] = await pool.query(`
            SELECT
                m.id,
                m.propietario_id,
                m.nombre,
                m.especie,
                m.raza,
                m.sexo,
                m.fecha_nacimiento,
                m.peso,
                m.observaciones,
                m.fecha_registro,
                CONCAT(p.nombres, ' ', p.apellidos) AS propietario_nombre,
                p.nombres AS propietario_nombres,
                p.apellidos AS propietario_apellidos
            FROM mascotas m
            INNER JOIN propietarios p
                ON m.propietario_id = p.id
            ORDER BY m.id DESC
        `);

        return res.status(200).json({
            success: true,
            total: mascotas.length,
            mascotas
        });

    } catch (error) {
        console.error('Error al listar mascotas:', error);

        return res.status(500).json({
            success: false,
            message: 'Error al obtener las mascotas.'
        });
    }
}

// ============================================
// CONSULTAR MASCOTA POR ID
// ============================================

async function obtenerPorId(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El ID de mascota no es válido.'
            });
        }

        const [mascotas] = await pool.query(`
            SELECT
                m.*,
                CONCAT(p.nombres, ' ', p.apellidos) AS propietario_nombre,
                p.nombres AS propietario_nombres,
                p.apellidos AS propietario_apellidos,
                p.telefono AS propietario_telefono
            FROM mascotas m
            INNER JOIN propietarios p
                ON m.propietario_id = p.id
            WHERE m.id = ?
        `, [id]);

        if (mascotas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mascota no encontrada.'
            });
        }

        return res.status(200).json({
            success: true,
            mascota: mascotas[0]
        });

    } catch (error) {
        console.error('Error al consultar mascota:', error);

        return res.status(500).json({
            success: false,
            message: 'Error al consultar la mascota.'
        });
    }
}

// ============================================
// REGISTRAR MASCOTA
// ============================================

async function registrar(req, res) {
    try {
        const {
            propietario_id,
            nombre,
            especie,
            raza,
            sexo,
            fecha_nacimiento,
            peso,
            observaciones
        } = req.body;

        // Validar datos
        const errorValidacion = validarDatosMascota(req.body);

        if (errorValidacion) {
            return res.status(400).json({
                success: false,
                message: errorValidacion
            });
        }

        const propietarioId = Number(propietario_id);
        const pesoNumerico =
            peso !== undefined && peso !== null && peso !== ''
                ? Number(peso)
                : null;

        // Verificar propietario
        const [propietarios] = await pool.query(
            'SELECT id, nombres, apellidos FROM propietarios WHERE id = ?',
            [propietarioId]
        );

        if (propietarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El propietario seleccionado no existe.'
            });
        }

        // Insertar mascota
        const [resultado] = await pool.query(`
            INSERT INTO mascotas (
                propietario_id,
                nombre,
                especie,
                raza,
                sexo,
                fecha_nacimiento,
                peso,
                observaciones
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            propietarioId,
            String(nombre).trim(),
            String(especie).trim(),
            raza ? String(raza).trim() : null,
            sexo || null,
            fecha_nacimiento || null,
            pesoNumerico,
            observaciones ? String(observaciones).trim() : null
        ]);

        // Consultar mascota registrada
        const [mascotas] = await pool.query(`
            SELECT
                m.*,
                CONCAT(p.nombres, ' ', p.apellidos) AS propietario_nombre
            FROM mascotas m
            INNER JOIN propietarios p
                ON m.propietario_id = p.id
            WHERE m.id = ?
        `, [resultado.insertId]);

        return res.status(201).json({
            success: true,
            message: 'Mascota registrada correctamente.',
            mascota: mascotas[0]
        });

    } catch (error) {
        console.error('Error al registrar mascota:', error);

        return res.status(500).json({
            success: false,
            message: 'Error al registrar la mascota.',
            detalle: error.sqlMessage || error.message
        });
    }
}

// ============================================
// ACTUALIZAR MASCOTA
// ============================================

async function actualizar(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El ID de mascota no es válido.'
            });
        }

        const {
            propietario_id,
            nombre,
            especie,
            raza,
            sexo,
            fecha_nacimiento,
            peso,
            observaciones
        } = req.body;

        const errorValidacion = validarDatosMascota(req.body);

        if (errorValidacion) {
            return res.status(400).json({
                success: false,
                message: errorValidacion
            });
        }

        const [mascotasExistentes] = await pool.query(
            'SELECT id FROM mascotas WHERE id = ?',
            [id]
        );

        if (mascotasExistentes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mascota no encontrada.'
            });
        }

        const propietarioId = Number(propietario_id);

        const [propietarios] = await pool.query(
            'SELECT id FROM propietarios WHERE id = ?',
            [propietarioId]
        );

        if (propietarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El propietario seleccionado no existe.'
            });
        }

        const pesoNumerico =
            peso !== undefined && peso !== null && peso !== ''
                ? Number(peso)
                : null;

        await pool.query(`
            UPDATE mascotas
            SET
                propietario_id = ?,
                nombre = ?,
                especie = ?,
                raza = ?,
                sexo = ?,
                fecha_nacimiento = ?,
                peso = ?,
                observaciones = ?
            WHERE id = ?
        `, [
            propietarioId,
            String(nombre).trim(),
            String(especie).trim(),
            raza ? String(raza).trim() : null,
            sexo || null,
            fecha_nacimiento || null,
            pesoNumerico,
            observaciones ? String(observaciones).trim() : null,
            id
        ]);

        return res.status(200).json({
            success: true,
            message: 'Mascota actualizada correctamente.'
        });

    } catch (error) {
        console.error('Error al actualizar mascota:', error);

        return res.status(500).json({
            success: false,
            message: 'Error al actualizar la mascota.',
            detalle: error.sqlMessage || error.message
        });
    }
}

// ============================================
// ELIMINAR MASCOTA
// ============================================

async function eliminar(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El ID de mascota no es válido.'
            });
        }

        const [mascotas] = await pool.query(
            'SELECT id FROM mascotas WHERE id = ?',
            [id]
        );

        if (mascotas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mascota no encontrada.'
            });
        }

        await pool.query(
            'DELETE FROM mascotas WHERE id = ?',
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Mascota eliminada correctamente.'
        });

    } catch (error) {
        console.error('Error al eliminar mascota:', error);

        return res.status(500).json({
            success: false,
            message: 'No se pudo eliminar la mascota. Verifica si tiene citas o atenciones asociadas.',
            detalle: error.sqlMessage || error.message
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
