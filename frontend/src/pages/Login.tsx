import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  usuario?: {
    id: number;
    nombre: string;
    apellido: string;
    correo: string;
    rol: string;
  };
}

function Login({ onLoginSuccess }: LoginProps) {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        'http://localhost:4000/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            correo: correo.trim(),
            password,
          }),
        }
      );

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.success || !data.token) {
        throw new Error(
          data.message || 'Credenciales incorrectas'
        );
      }

      // Guardar el JWT.
      window.localStorage.setItem('token', data.token);

      // Guardar los datos del usuario.
      if (data.usuario) {
        window.localStorage.setItem(
          'usuario',
          JSON.stringify(data.usuario)
        );
      }

      // Actualizar el estado de autenticación de App.tsx.
      onLoginSuccess(data.token);

      // Ingresar al Dashboard.
      navigate('/dashboard', { replace: true });

    } catch (err) {
      console.error('Error de inicio de sesión:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con el servidor'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-700">
            VetControl
          </h1>

          <p className="text-gray-500 mt-2">
            Sistema de gestión veterinaria
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>

            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="usuario@vetcontrol.com"
              required
              autoComplete="username"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="bg-red-100 text-red-700 p-3 rounded-lg text-sm"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>

        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          VetControl Web © 2026
        </p>

      </div>
    </div>
  );
}

export default Login;
