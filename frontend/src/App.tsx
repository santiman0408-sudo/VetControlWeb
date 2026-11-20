import { useState, type ReactNode } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import MainLayout from './layouts/MainLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Propietarios from './pages/Propietarios';
import Mascotas from './pages/Mascotas';
import Citas from './pages/Citas';
import Servicios from './pages/Servicios';
import Solicitudes from './pages/Solicitudes';

import './index.css';

// Recuperar el token guardado en el navegador.
function obtenerToken(): string | null {
  try {
    return window.localStorage.getItem('token');
  } catch (error) {
    console.error('Error al recuperar la sesión:', error);
    return null;
  }
}

// Componente para proteger las rutas administrativas.
interface RutaProtegidaProps {
  token: string | null;
  children: ReactNode;
}

function RutaProtegida({ token, children }: RutaProtegidaProps) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const [token, setToken] = useState<string | null>(obtenerToken);

  // Cerrar sesión del administrador.
  const cerrarSesion = () => {
    try {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('usuario');
    } catch (error) {
      console.error('Error al cerrar la sesión:', error);
    }

    // Actualizar el estado de autenticación.
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>

        {/* Inicio de sesión */}
        <Route
          path="/login"
          element={
            token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLoginSuccess={setToken} />
            )
          }
        />

        {/* Rutas protegidas */}
        <Route
          element={
            <RutaProtegida token={token}>
              <MainLayout onLogout={cerrarSesion} />
            </RutaProtegida>
          }
        >
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/propietarios"
            element={<Propietarios />}
          />

          <Route
            path="/mascotas"
            element={<Mascotas />}
          />

          <Route
            path="/citas"
            element={<Citas />}
          />

          <Route
            path="/servicios"
            element={<Servicios />}
          />

          <Route
            path="/solicitudes"
            element={<Solicitudes />}
          />
        </Route>

        {/* Rutas inexistentes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}
