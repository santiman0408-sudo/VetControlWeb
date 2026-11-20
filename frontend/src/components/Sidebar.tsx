import { NavLink } from 'react-router-dom';
import '../styles/sidebar.css';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '▦' },
  { path: '/propietarios', label: 'Propietarios', icon: '♟' },
  { path: '/mascotas', label: 'Mascotas', icon: '🐾' },
  { path: '/citas', label: 'Citas', icon: '▣' },
  { path: '/servicios', label: 'Servicios', icon: '✚' },
  { path: '/solicitudes', label: 'Solicitudes', icon: '◷' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🐾</div>

        <div className="sidebar-brand-text">
          <h2>VetControl</h2>
          <span>Gestión Veterinaria</span>
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-menu-title">
        MENU PRINCIPAL
      </div>

      <nav className="sidebar-navigation">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-link-icon">
              {item.icon}
            </span>

            <span className="sidebar-link-label">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-icon">🐶</div>

        <div>
          <strong>VetControl Web</strong>
          <span>Panel administrativo</span>
        </div>
      </div>
    </aside>
  );
}
