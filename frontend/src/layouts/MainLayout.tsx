import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/layout.css';

interface MainLayoutProps {
  onLogout: () => void;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/propietarios': 'Gestión de propietarios',
  '/mascotas': 'Gestión de mascotas',
  '/citas': 'Gestión de citas',
  '/servicios': 'Gestión de servicios',
  '/solicitudes': 'Gestión de solicitudes',
};

export default function MainLayout({ onLogout }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const title =
    pageTitles[location.pathname] || 'Panel administrativo';

  const handleLogout = () => {
    onLogout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-layout">
      <Sidebar />

      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-title">
            <h1>{title}</h1>
            <p>Administración de clínica veterinaria</p>
          </div>

          <div
            className="admin-user"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div className="admin-user-avatar">A</div>

            <div className="admin-user-info">
              <strong>Administrador</strong>
              <span>Panel de control</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              style={{
                padding: '10px 15px',
                border: '1px solid #dc3545',
                borderRadius: '8px',
                backgroundColor: '#fff',
                color: '#dc3545',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ↪ Cerrar sesión
            </button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>

        <footer className="admin-footer">
          © 2026 VetControl Web - Sistema de gestión veterinaria
        </footer>
      </div>
    </div>
  );
}
