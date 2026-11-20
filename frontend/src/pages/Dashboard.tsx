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

interface Cita {
  id: number
  mascota_id: number
  servicio_id: number
  usuario_id: number
  fecha: string
  hora: string
  motivo: string
  estado: string
  fecha_registro: string
  mascota_nombre: string
  mascota_especie: string
  propietario_nombres: string
  propietario_apellidos: string
  servicio_nombre: string
  usuario_nombre: string
}

interface RespuestaCitas {
  success: boolean
  total: number
  citas: Cita[]
}

const API_BASE = 'http://localhost:4000/api'

function formatearHora(hora: string): string {
  if (!hora) return '--:--'

  const partes = hora.split(':')
  const horas = Number(partes[0])
  const minutos = partes[1] || '00'

  if (Number.isNaN(horas)) return hora

  const periodo = horas >= 12 ? 'PM' : 'AM'
  const horaFormato = horas % 12 || 12

  return `${String(horaFormato).padStart(2, '0')}:${minutos} ${periodo}`
}

function formatearFecha(fecha: string): string {
  if (!fecha) return 'Sin fecha'

  // Separamos los componentes para evitar cambios de día por zona horaria.
  const partes = fecha.split('T')[0].split('-')

  if (partes.length !== 3) return fecha

  const [anio, mes, dia] = partes

  return `${dia}/${mes}/${anio}`
}

function formatearEstado(estado: string): string {
  if (!estado) return 'Sin estado'

  return estado
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letra) => letra.toUpperCase())
}

function obtenerEstiloEstado(estado: string): {
  backgroundColor: string
  color: string
} {
  const estadoNormalizado = estado.toUpperCase()

  switch (estadoNormalizado) {
    case 'PENDIENTE':
      return {
        backgroundColor: '#fef3c7',
        color: '#92400e',
      }

    case 'CONFIRMADA':
    case 'CONFIRMADO':
      return {
        backgroundColor: '#dcfce7',
        color: '#166534',
      }

    case 'FINALIZADA':
    case 'FINALIZADO':
      return {
        backgroundColor: '#dbeafe',
        color: '#1e40af',
      }

    default:
      return {
        backgroundColor: '#f1f5f9',
        color: '#475569',
      }
  }
}

function obtenerFechaHora(cita: Cita): number {
  const fecha = cita.fecha?.split('T')[0] || ''
  const hora = cita.hora || '00:00:00'

  return new Date(`${fecha}T${hora}`).getTime() || 0
}

export default function Dashboard() {
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    propietarios: 0,
    mascotas: 0,
    solicitudesPendientes: 0,
    citasHoy: 0,
  })

  const [citas, setCitas] = useState<Cita[]>([])
  const [cargando, setCargando] = useState(true)
  const [cargandoCitas, setCargandoCitas] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorCitas, setErrorCitas] = useState<string | null>(null)

  useEffect(() => {
    const token = window.localStorage.getItem('token')

    if (!token) {
      setError('No existe una sesión activa. Inicia sesión nuevamente.')
      setErrorCitas('No existe una sesión activa.')
      setCargando(false)
      setCargandoCitas(false)
      return
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    }

    const obtenerEstadisticas = async () => {
      try {
        setCargando(true)
        setError(null)

        const respuesta = await axios.get<RespuestaEstadisticas>(
          `${API_BASE}/dashboard/estadisticas`,
          { headers }
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
            setError('Tu sesión ha expirado. Inicia sesión nuevamente.')
          } else {
            setError(
              err.response?.data?.message ||
                'No se pudieron cargar las estadísticas.'
            )
          }
        } else {
          setError('Ocurrió un error inesperado.')
        }
      } finally {
        setCargando(false)
      }
    }

    const obtenerCitas = async () => {
      try {
        setCargandoCitas(true)
        setErrorCitas(null)

        const respuesta = await axios.get<RespuestaCitas>(
          `${API_BASE}/citas`,
          {
            headers,
            params: {
              _t: Date.now(),
            },
          }
        )

        if (respuesta.data.success) {
          const citasOrdenadas = [...respuesta.data.citas].sort(
            (a, b) => obtenerFechaHora(b) - obtenerFechaHora(a)
          )

          setCitas(citasOrdenadas.slice(0, 4))
        } else {
          setErrorCitas('No se pudieron obtener las citas.')
        }
      } catch (err) {
        console.error('Error al cargar citas recientes:', err)

        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            setErrorCitas(
              'Tu sesión ha expirado. Inicia sesión nuevamente.'
            )
          } else {
            setErrorCitas(
              err.response?.data?.message ||
                'No se pudieron cargar las citas recientes.'
            )
          }
        } else {
          setErrorCitas('Ocurrió un error inesperado al cargar las citas.')
        }
      } finally {
        setCargandoCitas(false)
      }
    }

    obtenerEstadisticas()
    obtenerCitas()
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
          value={
            cargando
              ? '...'
              : String(estadisticas.solicitudesPendientes)
          }
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
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {cargandoCitas ? (
                  <tr>
                    <td colSpan={6}>
                      Cargando citas recientes...
                    </td>
                  </tr>
                ) : errorCitas ? (
                  <tr>
                    <td colSpan={6}>
                      {errorCitas}
                    </td>
                  </tr>
                ) : citas.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      No hay citas registradas.
                    </td>
                  </tr>
                ) : (
                  citas.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>
                        <div className="pet-cell">
                          <div className="pet-avatar">
                            <PawPrint size={17} />
                          </div>

                          <strong>
                            {appointment.mascota_nombre || 'Sin nombre'}
                          </strong>
                        </div>
                      </td>

                      <td>
                        {[
                          appointment.propietario_nombres,
                          appointment.propietario_apellidos,
                        ]
                          .filter(Boolean)
                          .join(' ') || 'Sin propietario'}
                      </td>

                      <td>
                        {appointment.servicio_nombre || 'Sin servicio'}
                      </td>

                      <td>
                        {formatearFecha(appointment.fecha)}
                      </td>

                      <td>
                        {formatearHora(appointment.hora)}
                      </td>

                      <td>
                        <span
                          className="status-badge"
                          style={obtenerEstiloEstado(appointment.estado)}
                        >
                          {formatearEstado(appointment.estado)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
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
