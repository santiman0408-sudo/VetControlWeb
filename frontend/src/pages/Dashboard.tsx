import {
  Users,
  PawPrint,
  Clock,
  CalendarCheck,
  Plus,
  ArrowRight,
  CalendarDays,
} from 'lucide-react'

import { useEffect, useState } from 'react'
import axios from 'axios'
import StatCard from '../components/StatCard'
import { Link } from 'react-router-dom'

interface Estadisticas {
  propietarios: number
  mascotas: number
  solicitudesPendientes: number
  citasHoy: number
}

interface RespuestaEstadisticas {
  success: boolean
  estadisticas: Estadisticas
}

const API_URL = 'http://localhost:4000/api/dashboard/estadisticas'

const recentAppointments = [
  {
    id: 1,
    pet: 'Max',
    owner: 'Carlos Mendoza',
    service: 'Consulta general',
    time: '09:00 AM',
    status: 'Confirmada',
  },
  {
    id: 2,
    pet: 'Luna',
    owner: 'María Torres',
    service: 'Vacunación',
    time: '10:30 AM',
    status: 'Pendiente',
  },
  {
    id: 3,
    pet: 'Rocky',
    owner: 'José Ramírez',
    service: 'Control médico',
    time: '11:00 AM',
    status: 'Confirmada',
  },
  {
    id: 4,
    pet: 'Mia',
    owner: 'Ana Flores',
    service: 'Desparasitación',
    time: '12:00 PM',
    status: 'Pendiente',
  },
]

export default function Dashboard() {
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    propietarios: 0,
    mascotas: 0,
    solicitudesPendientes: 0,
    citasHoy: 0,
  })

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const obtenerEstadisticas = async () => {
      try {
        setCargando(true)
        setError(null)

        // Recuperar el token JWT de la sesión.
        const token = window.localStorage.getItem('token')

        if (!token) {
          setError('No existe una sesión activa. Inicia sesión nuevamente.')
          return
        }

        // Consultar estadísticas enviando el token JWT.
        const respuesta = await axios.get<RespuestaEstadisticas>(
          API_URL,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (respuesta.data.success) {
          setEstadisticas(respuesta.data.estadisticas)
        } else {
          setError('El servidor no pudo obtener las estadísticas.')
        }
      } catch (err) {
        console.error('Error al cargar estadísticas:', err)

        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            setError('Tu sesión ha expirado o el token no es válido. Inicia sesión nuevamente.')
          } else {
            setError(
              err.response?.data?.message ||
                'No se pudo conectar con el servidor.'
            )
          }
        } else {
          setError('Ocurrió un error inesperado.')
        }
      } finally {
        setCargando(false)
      }
    }

    obtenerEstadisticas()
  }, [])

  return (
    <div className="dashboard">

      <div className="welcome-banner">
        <div>
          <span className="welcome-label">PANEL ADMINISTRATIVO</span>
          <h2>¡Bienvenido a VetControl!</h2>
          <p>
            Administra tu clínica veterinaria desde un solo lugar.
          </p>
        </div>

        <div className="welcome-illustration">
          <PawPrint size={85} />
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="stats-grid">
        <StatCard
          title="Propietarios"
          value={cargando ? '...' : String(estadisticas.propietarios)}
          description="Clientes registrados"
          icon={Users}
          color="#2563eb"
          background="#eff6ff"
        />

        <StatCard
          title="Mascotas"
          value={cargando ? '...' : String(estadisticas.mascotas)}
          description="Pacientes registrados"
          icon={PawPrint}
          color="#059669"
          background="#ecfdf5"
        />

        <StatCard
          title="Solicitudes pendientes"
          value={cargando ? '...' : String(estadisticas.solicitudesPendientes)}
          description="Por atender"
          icon={Clock}
          color="#d97706"
          background="#fffbeb"
        />

        <StatCard
          title="Citas de hoy"
          value={cargando ? '...' : String(estadisticas.citasHoy)}
          description="Programadas para hoy"
          icon={CalendarCheck}
          color="#7c3aed"
          background="#f5f3ff"
        />
      </div>

      <div className="dashboard-grid">

        <section className="panel appointments-panel">
          <div className="panel-header">
            <div>
              <h3>Citas recientes</h3>
              <p>Agenda de atención veterinaria</p>
            </div>

            <Link to="/citas" className="view-all">
              Ver todas <ArrowRight size={16} />
            </Link>
          </div>

          <div className="table-wrapper">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Mascota</th>
                  <th>Propietario</th>
                  <th>Servicio</th>
                  <th>Hora</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {recentAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      <div className="pet-cell">
                        <div className="pet-avatar">
                          <PawPrint size={17} />
                        </div>
                        <strong>{appointment.pet}</strong>
                      </div>
                    </td>

                    <td>{appointment.owner}</td>
                    <td>{appointment.service}</td>
                    <td>{appointment.time}</td>

                    <td>
                      <span
                        className={`status-badge ${
                          appointment.status === 'Confirmada'
                            ? 'confirmed'
                            : 'pending'
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel quick-actions-panel">
          <div className="panel-header">
            <div>
              <h3>Acciones rápidas</h3>
              <p>Accesos directos</p>
            </div>
          </div>

          <div className="quick-actions">
            <Link to="/propietarios" className="quick-action">
              <div className="quick-action-icon blue">
                <Users size={21} />
              </div>
              <div>
                <strong>Nuevo propietario</strong>
                <span>Registrar cliente</span>
              </div>
              <ArrowRight size={17} />
            </Link>

            <Link to="/mascotas" className="quick-action">
              <div className="quick-action-icon green">
                <PawPrint size={21} />
              </div>
              <div>
                <strong>Nueva mascota</strong>
                <span>Registrar paciente</span>
              </div>
              <ArrowRight size={17} />
            </Link>

            <Link to="/citas" className="quick-action">
              <div className="quick-action-icon purple">
                <CalendarDays size={21} />
              </div>
              <div>
                <strong>Nueva cita</strong>
                <span>Programar atención</span>
              </div>
              <ArrowRight size={17} />
            </Link>

            <Link to="/solicitudes" className="quick-action">
              <div className="quick-action-icon orange">
                <Plus size={21} />
              </div>
              <div>
                <strong>Nueva solicitud</strong>
                <span>Registrar solicitud</span>
              </div>
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>

      </div>

      <div className="dashboard-footer">
        VetControl Web · Sistema de gestión veterinaria
      </div>

    </div>
  )
}
