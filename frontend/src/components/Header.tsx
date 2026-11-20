import { useEffect, useState } from 'react'
import { Bell, Search, Menu, LogOut } from 'lucide-react'

interface Usuario {
  id: number
  nombre: string
  apellido: string
  correo: string
  rol: string
}

interface HeaderProps {
  title: string
  subtitle: string
  onLogout: () => void
}

interface PerfilResponse {
  success: boolean
  usuario: Usuario
}

export default function Header({
  title,
  subtitle,
  onLogout,
}: HeaderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    try {
      const datos = localStorage.getItem('usuario')
      return datos ? JSON.parse(datos) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) return

    let cancelado = false

    const obtenerPerfil = async () => {
      try {
        const respuesta = await fetch(
          'http://localhost:4000/api/auth/profile',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (cancelado) return

        if (respuesta.status === 401 || respuesta.status === 403) {
          onLogout()
          return
        }

        if (!respuesta.ok) {
          console.error('Error al obtener perfil:', respuesta.status)
          return
        }

        const data: PerfilResponse = await respuesta.json()

        if (data.success && data.usuario) {
          setUsuario(data.usuario)

          localStorage.setItem(
            'usuario',
            JSON.stringify(data.usuario)
          )
        }
      } catch (error) {
        if (!cancelado) {
          console.error('Error de conexión al obtener perfil:', error)
        }
      }
    }

    obtenerPerfil()

    return () => {
      cancelado = true
    }
  }, [])

  const nombreCompleto = usuario
    ? `${usuario.nombre} ${usuario.apellido}`
    : 'Usuario'

  const iniciales = usuario
    ? `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase()
    : 'US'

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="mobile-menu-button"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="header-actions">
        <div className="header-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Buscar..."
            aria-label="Buscar"
          />
        </div>

        <button
          className="notification-button"
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <Bell size={20} />
          <span className="notification-dot" />
        </button>

        <div className="header-profile">
          <div className="header-avatar">
            {iniciales}
          </div>

          <div className="header-profile-info">
            <strong>{nombreCompleto}</strong>
            <span>{usuario?.rol ?? 'Usuario'}</span>
          </div>
        </div>

        <button
          className="logout-button"
          onClick={onLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  )
}
