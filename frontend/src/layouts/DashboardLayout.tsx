import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

interface DashboardLayoutProps {
  onLogout: () => void
}

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Dashboard',
    subtitle: 'Resumen general de la clínica veterinaria',
  },
  '/propietarios': {
    title: 'Propietarios',
    subtitle: 'Gestión de clientes y propietarios',
  },
  '/mascotas': {
    title: 'Mascotas',
    subtitle: 'Administración de pacientes veterinarios',
  },
  '/citas': {
    title: 'Citas',
    subtitle: 'Agenda y programación de citas',
  },
  '/solicitudes': {
    title: 'Solicitudes',
    subtitle: 'Gestión de solicitudes de atención',
  },
  '/atenciones': {
    title: 'Atenciones',
    subtitle: 'Historial de atención veterinaria',
  },
  '/servicios': {
    title: 'Servicios',
    subtitle: 'Administración de servicios veterinarios',
  },
}

export default function DashboardLayout({
  onLogout,
}: DashboardLayoutProps) {
  const location = useLocation()

  const currentPage = pageTitles[location.pathname] ?? {
    title: 'VetControl',
    subtitle: 'Sistema de gestión veterinaria',
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Header
          title={currentPage.title}
          subtitle={currentPage.subtitle}
          onLogout={onLogout}
        />

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
