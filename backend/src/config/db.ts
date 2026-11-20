import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// CONFIGURACIÓN DE CONEXIÓN MYSQL
// ============================================

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'vetcontrol_web',

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  charset: 'utf8mb4'
});

// ============================================
// VERIFICAR CONEXIÓN
// ============================================

export async function testDatabaseConnection(): Promise<void> {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      'SELECT DATABASE() AS database_name, NOW() AS server_time'
    );

    console.log('Conexión MySQL establecida:', rows);
  } finally {
    connection.release();
  }
}
