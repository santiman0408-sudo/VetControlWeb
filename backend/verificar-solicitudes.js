require('dotenv').config();

const { pool } = require('./src/config/database');

async function verificarSolicitudes() {
    try {
        const [columnas] = await pool.query(
            'DESCRIBE solicitudes'
        );

        console.log('\nCOLUMNAS DE LA TABLA SOLICITUDES:\n');
        console.table(columnas);

    } catch (error) {
        console.error('\nERROR AL CONSULTAR SOLICITUDES:');
        console.error(error.message);
    } finally {
        await pool.end();
    }
}

verificarSolicitudes();
