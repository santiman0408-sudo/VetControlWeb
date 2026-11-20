const mysql = require('mysql2/promise');

// ==========================================
// CONFIGURACIÓN DE CONEXIÓN MYSQL
// ==========================================

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'vetcontrol_web',

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ==========================================
// VERIFICAR CONEXIÓN
// ==========================================

async function verificarConexion() {
    try {
        const connection = await pool.getConnection();

        console.log('MySQL conectado correctamente');
        connection.release();

        return true;
    } catch (error) {
        console.error('Error de conexión MySQL:', error.message);
        return false;
    }
}

// ==========================================
// EXPORTAR
// ==========================================

module.exports = {
    pool,
    verificarConexion
};
