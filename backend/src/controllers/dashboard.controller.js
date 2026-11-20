const { pool } = require('../config/database');

// ============================================
// OBTENER ESTADISTICAS DEL DASHBOARD
// ============================================
const obtenerEstadisticas = async (req, res) => {
    try {
        const [propietarios] = await pool.query(
            'SELECT COUNT(*) AS total FROM propietarios'
        );

        const [mascotas] = await pool.query(
            'SELECT COUNT(*) AS total FROM mascotas'
        );

        const [solicitudes] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM solicitudes
             WHERE estado = 'PENDIENTE'`
        );

        const [citas] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM citas
             WHERE fecha = CURDATE()`
        );

        return res.status(200).json({
            success: true,
            estadisticas: {
                propietarios: propietarios[0].total,
                mascotas: mascotas[0].total,
                solicitudesPendientes: solicitudes[0].total,
                citasHoy: citas[0].total
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);

        return res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas del Dashboard'
        });
    }
};

module.exports = {
    obtenerEstadisticas
};
