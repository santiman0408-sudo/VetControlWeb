import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { testDatabaseConnection } from './db';

const PORT = Number(process.env.PORT || 4000);

async function startServer(): Promise<void> {
  try {
    await testDatabaseConnection();

    app.listen(PORT, () => {
      console.log('===================================');
      console.log('VetControl Web API');
      console.log(`Servidor: http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
      console.log('MySQL: conectado');
      console.log('===================================');
    });
  } catch (error) {
    console.error('Error al iniciar VetControl Web:', error);
    process.exit(1);
  }
}

startServer();
