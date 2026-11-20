import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import '../styles/citas.css'

const API_URL = 'http://localhost:4000/api'

interface Mascota {
  id: number
  nombre: string
  especie: string
  propietario_id: number
  propietario_nombres?: string
  propietario_apellidos?: string
}

interface Servicio {
  id: number
  nombre: string
  descripcion?: string
  precio?: number | string
  estado?: string
}

interface Cita {
  id: number
  mascota_id: number
  servicio_id: number
  usuario_id?: number | null
  fecha: string
  hora: string
  motivo: string
  estado: string
  mascota_nombre?: string
  mascota_especie?: string
  propietario_nombres?: string
  propietario_apellidos?: string
  servicio_nombre?: string
  usuario_nombre?: string
}

interface FormularioCita {
  mascota_id: string
  servicio_id: string
  fecha: string
  hora: string
  motivo: string
  estado: string
}

interface RespuestaCitas {
  success: boolean
  citas: Cita[]
  message?: string
}

interface RespuestaMascotas {
  success: boolean
  mascotas: Mascota[]
  message?: string
}

interface RespuestaServicios {
  success: boolean
  servicios: Servicio[]
  message?: string
}

const formularioInicial: FormularioCita = {
  mascota_id: '',
  servicio_id: '',
  fecha: '',
  hora: '',
  motivo: '',
  estado: 'PENDIENTE',
}

function obtenerHeaders(): HeadersInit {
  const token = localStorage.getItem('token')

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function obtenerMensajeError(
  data: { message?: string },
  mensajePredeterminado: string
) {
  return data.message || mensajePredeterminado
}

function Citas() {
  const [citas, setCitas] = useState<Cita[]>([])
  const [mascotas, setMascotas] = useState<Mascota[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])

  const [formulario, setFormulario] =
    useState<FormularioCita>(formularioInicial)

  const [citaEditando, setCitaEditando] =
    useState<number | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  // ==================================================
  // CARGAR CITAS, MASCOTAS Y SERVICIOS
  // ==================================================

  useEffect(() => {
    let activo = true

    const cargarDatos = async () => {
      try {
        const headers = obtenerHeaders()

        const [resCitas, resMascotas, resServicios] =
          await Promise.all([
            fetch(`${API_URL}/citas`, { headers }),
            fetch(`${API_URL}/mascotas`, { headers }),
            fetch(`${API_URL}/servicios`, { headers }),
          ])

        if (!resCitas.ok) {
          throw new Error('No se pudieron cargar las citas.')
        }

        if (!resMascotas.ok) {
          throw new Error('No se pudieron cargar las mascotas.')
        }

        if (!resServicios.ok) {
          throw new Error('No se pudieron cargar los servicios.')
        }

        const dataCitas =
          (await resCitas.json()) as RespuestaCitas

        const dataMascotas =
          (await resMascotas.json()) as RespuestaMascotas

        const dataServicios =
          (await resServicios.json()) as RespuestaServicios

        if (
          dataCitas.success === false ||
          dataMascotas.success === false ||
          dataServicios.success === false
        ) {
          throw new Error('La API devolvió un error al cargar los datos.')
        }

        if (!activo) return

        setCitas(dataCitas.citas || [])
        setMascotas(dataMascotas.mascotas || [])

        // Mostrar solamente servicios activos.
        setServicios(
          (dataServicios.servicios || []).filter(
            (servicio) =>
              !servicio.estado ||
              servicio.estado.toUpperCase() === 'ACTIVO'
          )
        )
      } catch (err) {
        if (!activo) return

        setError(
          err instanceof Error
            ? err.message
            : 'Error al cargar los datos.'
        )
      } finally {
        if (activo) {
          setCargando(false)
        }
      }
    }

    void cargarDatos()

    return () => {
      activo = false
    }
  }, [])

  // ==================================================
  // RECARGAR DATOS
  // ==================================================

  const recargarDatos = async () => {
    setCargando(true)
    setError('')

    try {
      const headers = obtenerHeaders()

      const [resCitas, resMascotas, resServicios] =
        await Promise.all([
          fetch(`${API_URL}/citas`, { headers }),
          fetch(`${API_URL}/mascotas`, { headers }),
          fetch(`${API_URL}/servicios`, { headers }),
        ])

      if (!resCitas.ok || !resMascotas.ok || !resServicios.ok) {
        throw new Error('Error al actualizar los datos.')
      }

      const dataCitas =
        (await resCitas.json()) as RespuestaCitas

      const dataMascotas =
        (await resMascotas.json()) as RespuestaMascotas

      const dataServicios =
        (await resServicios.json()) as RespuestaServicios

      if (
        dataCitas.success === false ||
        dataMascotas.success === false ||
        dataServicios.success === false
      ) {
        throw new Error('La API devolvió un error al actualizar.')
      }

      setCitas(dataCitas.citas || [])
      setMascotas(dataMascotas.mascotas || [])

      setServicios(
        (dataServicios.servicios || []).filter(
          (servicio) =>
            !servicio.estado ||
            servicio.estado.toUpperCase() === 'ACTIVO'
        )
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al actualizar los datos.'
      )
    } finally {
      setCargando(false)
    }
  }

  // ==================================================
  // FILTRAR CITAS
  // ==================================================

  const citasFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim()

    return citas.filter((cita) => {
      const nombreMascota = cita.mascota_nombre || ''

      const propietario =
        `${cita.propietario_nombres || ''} ${
          cita.propietario_apellidos || ''
        }`

      const servicio = cita.servicio_nombre || ''

      const coincideBusqueda =
        nombreMascota.toLowerCase().includes(texto) ||
        propietario.toLowerCase().includes(texto) ||
        servicio.toLowerCase().includes(texto)

      const coincideEstado =
        filtroEstado === 'TODOS' ||
        cita.estado === filtroEstado

      return coincideBusqueda && coincideEstado
    })
  }, [citas, busqueda, filtroEstado])

  // ==================================================
  // ESTADÍSTICAS
  // ==================================================

  const estadisticas = useMemo(() => ({
    total: citas.length,

    pendientes: citas.filter(
      (cita) => cita.estado === 'PENDIENTE'
    ).length,

    confirmadas: citas.filter(
      (cita) => cita.estado === 'CONFIRMADA'
    ).length,

    finalizadas: citas.filter(
      (cita) => cita.estado === 'FINALIZADA'
    ).length,
  }), [citas])

  // ==================================================
  // ACTUALIZAR FORMULARIO
  // ==================================================

  const actualizarCampo = (
    campo: keyof FormularioCita,
    valor: string
  ) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  // ==================================================
  // ABRIR FORMULARIO
  // ==================================================

  const abrirFormulario = () => {
    setFormulario({ ...formularioInicial })
    setCitaEditando(null)
    setMensaje('')
    setError('')
    setMostrarFormulario(true)
  }

  // ==================================================
  // EDITAR CITA
  // ==================================================

  const editarCita = (cita: Cita) => {
    setFormulario({
      mascota_id: String(cita.mascota_id),
      servicio_id: String(cita.servicio_id),
      fecha: cita.fecha?.slice(0, 10) || '',
      hora: cita.hora?.slice(0, 5) || '',
      motivo: cita.motivo || '',
      estado: cita.estado,
    })

    setCitaEditando(cita.id)
    setMostrarFormulario(true)
    setMensaje('')
    setError('')
  }

  // ==================================================
  // REGISTRAR / ACTUALIZAR CITA
  // ==================================================

  const guardarCita = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    setError('')
    setMensaje('')

    if (
      !formulario.mascota_id ||
      !formulario.servicio_id ||
      !formulario.fecha ||
      !formulario.hora
    ) {
      setError('Completa los campos obligatorios.')
      return
    }

    setGuardando(true)

    try {
      const usuarioGuardado =
        localStorage.getItem('usuario')

      let usuarioId: number | null = null

      try {
        if (usuarioGuardado) {
          const usuario = JSON.parse(usuarioGuardado)
          usuarioId = usuario.id ?? null
        }
      } catch {
        usuarioId = null
      }

      const payload = {
        mascota_id: Number(formulario.mascota_id),
        servicio_id: Number(formulario.servicio_id),
        usuario_id: usuarioId,
        fecha: formulario.fecha,
        hora: formulario.hora,
        motivo: formulario.motivo.trim(),
        estado: formulario.estado,
      }

      const url = citaEditando
        ? `${API_URL}/citas/${citaEditando}`
        : `${API_URL}/citas`

      const response = await fetch(url, {
        method: citaEditando ? 'PUT' : 'POST',
        headers: obtenerHeaders(),
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || data.success === false) {
        throw new Error(
          obtenerMensajeError(
            data,
            'No se pudo guardar la cita.'
          )
        )
      }

      setMensaje(
        citaEditando
          ? 'Cita actualizada correctamente.'
          : 'Cita registrada correctamente.'
      )

      setMostrarFormulario(false)
      setFormulario({ ...formularioInicial })
      setCitaEditando(null)

      await recargarDatos()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al guardar la cita.'
      )
    } finally {
      setGuardando(false)
    }
  }

  // ==================================================
  // ELIMINAR CITA
  // ==================================================

  const eliminarCita = async (id: number) => {
    const confirmar = window.confirm(
      '¿Estás seguro de eliminar esta cita?'
    )

    if (!confirmar) return

    setError('')
    setMensaje('')

    try {
      const response = await fetch(
        `${API_URL}/citas/${id}`,
        {
          method: 'DELETE',
          headers: obtenerHeaders(),
        }
      )

      const data = await response.json()

      if (!response.ok || data.success === false) {
        throw new Error(
          obtenerMensajeError(
            data,
            'No se pudo eliminar la cita.'
          )
        )
      }

      setMensaje('Cita eliminada correctamente.')

      await recargarDatos()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al eliminar la cita.'
      )
    }
  }

  // ==================================================
  // CANCELAR FORMULARIO
  // ==================================================

  const cancelarFormulario = () => {
    setMostrarFormulario(false)
    setFormulario({ ...formularioInicial })
    setCitaEditando(null)
    setError('')
  }

  // ==================================================
  // ESTADO CSS
  // ==================================================

  const obtenerEstadoClase = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'estado-pendiente'

      case 'CONFIRMADA':
        return 'estado-confirmada'

      case 'FINALIZADA':
        return 'estado-finalizada'

      case 'CANCELADA':
        return 'estado-cancelada'

      default:
        return ''
    }
  }

  // ==================================================
  // FORMATEAR FECHA
  // ==================================================

  const formatearFecha = (fecha: string) => {
    if (!fecha) return '-'

    const fechaLocal = fecha.includes('T')
      ? fecha.split('T')[0]
      : fecha

    const [anio, mes, dia] =
      fechaLocal.slice(0, 10).split('-')

    if (!anio || !mes || !dia) {
      return fecha
    }

    return `${dia}/${mes}/${anio}`
  }

  // ==================================================
  // INTERFAZ
  // ==================================================

  return (
    <div className="citas-container">

      {/* CABECERA */}

      <div className="citas-header">
        <div>
          <h1>Gestión de citas</h1>
          <p>
            Administra las citas y atenciones veterinarias.
          </p>
        </div>

        <button
          type="button"
          className="btn-cita-nueva"
          onClick={abrirFormulario}
        >
          + Nueva cita
        </button>
      </div>

      {/* MENSAJES */}

      {mensaje && (
        <div className="citas-alerta citas-alerta-exito">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="citas-alerta citas-alerta-error">
          {error}
        </div>
      )}

      {/* ESTADÍSTICAS */}

      <div className="citas-estadisticas">

        <div className="citas-stat-card">
          <span>Total de citas</span>
          <strong>{estadisticas.total}</strong>
        </div>

        <div className="citas-stat-card">
          <span>Pendientes</span>
          <strong>{estadisticas.pendientes}</strong>
        </div>

        <div className="citas-stat-card">
          <span>Confirmadas</span>
          <strong>{estadisticas.confirmadas}</strong>
        </div>

        <div className="citas-stat-card">
          <span>Finalizadas</span>
          <strong>{estadisticas.finalizadas}</strong>
        </div>

      </div>

      {/* FORMULARIO */}

      {mostrarFormulario && (
        <div className="citas-formulario-card">

          <div className="citas-formulario-header">
            <h2>
              {citaEditando
                ? 'Editar cita'
                : 'Registrar nueva cita'}
            </h2>

            <button
              type="button"
              onClick={cancelarFormulario}
              disabled={guardando}
              aria-label="Cerrar formulario"
            >
              ✕
            </button>
          </div>

          <form
            onSubmit={guardarCita}
            className="citas-formulario"
          >

            <div className="citas-form-grid">

              {/* MASCOTA */}

              <div className="citas-campo">
                <label htmlFor="mascota_id">
                  Mascota *
                </label>

                <select
                  id="mascota_id"
                  value={formulario.mascota_id}
                  onChange={(e) =>
                    actualizarCampo(
                      'mascota_id',
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Seleccionar mascota
                  </option>

                  {mascotas.map((mascota) => (
                    <option
                      key={mascota.id}
                      value={mascota.id}
                    >
                      {mascota.nombre} -{' '}
                      {mascota.propietario_nombres || ''}{' '}
                      {mascota.propietario_apellidos || ''}
                    </option>
                  ))}
                </select>

                {mascotas.length === 0 && (
                  <small>
                    No hay mascotas registradas.
                  </small>
                )}
              </div>

              {/* SERVICIO */}

              <div className="citas-campo">
                <label htmlFor="servicio_id">
                  Servicio veterinario *
                </label>

                <select
                  id="servicio_id"
                  value={formulario.servicio_id}
                  onChange={(e) =>
                    actualizarCampo(
                      'servicio_id',
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Seleccionar servicio
                  </option>

                  {servicios.map((servicio) => (
                    <option
                      key={servicio.id}
                      value={servicio.id}
                    >
                      {servicio.nombre}
                      {servicio.precio !== undefined
                        ? ` - S/ ${servicio.precio}`
                        : ''}
                    </option>
                  ))}
                </select>

                {servicios.length === 0 && (
                  <small>
                    No hay servicios activos disponibles.
                  </small>
                )}
              </div>

              {/* FECHA */}

              <div className="citas-campo">
                <label htmlFor="fecha">
                  Fecha *
                </label>

                <input
                  id="fecha"
                  type="date"
                  value={formulario.fecha}
                  onChange={(e) =>
                    actualizarCampo(
                      'fecha',
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              {/* HORA */}

              <div className="citas-campo">
                <label htmlFor="hora">
                  Hora *
                </label>

                <input
                  id="hora"
                  type="time"
                  value={formulario.hora}
                  onChange={(e) =>
                    actualizarCampo(
                      'hora',
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              {/* ESTADO */}

              <div className="citas-campo">
                <label htmlFor="estado">
                  Estado
                </label>

                <select
                  id="estado"
                  value={formulario.estado}
                  onChange={(e) =>
                    actualizarCampo(
                      'estado',
                      e.target.value
                    )
                  }
                >
                  <option value="PENDIENTE">
                    Pendiente
                  </option>

                  <option value="CONFIRMADA">
                    Confirmada
                  </option>

                  <option value="FINALIZADA">
                    Finalizada
                  </option>

                  <option value="CANCELADA">
                    Cancelada
                  </option>
                </select>
              </div>

              {/* MOTIVO */}

              <div className="citas-campo citas-campo-completo">
                <label htmlFor="motivo">
                  Motivo de la cita
                </label>

                <textarea
                  id="motivo"
                  rows={3}
                  value={formulario.motivo}
                  onChange={(e) =>
                    actualizarCampo(
                      'motivo',
                      e.target.value
                    )
                  }
                  placeholder="Describe el motivo de la atención..."
                />
              </div>

            </div>

            {/* BOTONES */}

            <div className="citas-formulario-acciones">

              <button
                type="button"
                className="btn-cita-cancelar"
                onClick={cancelarFormulario}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn-cita-guardar"
                disabled={
                  guardando ||
                  mascotas.length === 0 ||
                  servicios.length === 0
                }
              >
                {guardando
                  ? 'Guardando...'
                  : citaEditando
                    ? 'Actualizar cita'
                    : 'Guardar cita'}
              </button>

            </div>

          </form>
        </div>
      )}

      {/* LISTADO */}

      <div className="citas-listado-card">

        {/* FILTROS */}

        <div className="citas-toolbar">

          <input
            type="search"
            placeholder="Buscar por mascota, propietario o servicio..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
          />

          <select
            value={filtroEstado}
            onChange={(e) =>
              setFiltroEstado(e.target.value)
            }
          >
            <option value="TODOS">
              Todos los estados
            </option>

            <option value="PENDIENTE">
              Pendientes
            </option>

            <option value="CONFIRMADA">
              Confirmadas
            </option>

            <option value="FINALIZADA">
              Finalizadas
            </option>

            <option value="CANCELADA">
              Canceladas
            </option>
          </select>

        </div>

        {/* CONTENIDO */}

        {cargando ? (
          <div className="citas-vacio">
            Cargando citas...
          </div>
        ) : citasFiltradas.length === 0 ? (
          <div className="citas-vacio">
            <span>📅</span>
            <h3>No hay citas para mostrar</h3>
            <p>
              Registra una nueva cita o modifica los filtros.
            </p>
          </div>
        ) : (
          <div className="citas-tabla-contenedor">

            <table className="citas-tabla">

              <thead>
                <tr>
                  <th>Mascota</th>
                  <th>Propietario</th>
                  <th>Servicio</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {citasFiltradas.map((cita) => (
                  <tr key={cita.id}>

                    <td>
                      <strong>
                        {cita.mascota_nombre ||
                          `Mascota #${cita.mascota_id}`}
                      </strong>

                      <small>
                        {cita.mascota_especie || ''}
                      </small>
                    </td>

                    <td>
                      {cita.propietario_nombres || ''}{' '}
                      {cita.propietario_apellidos || ''}
                    </td>

                    <td>
                      {cita.servicio_nombre ||
                        `Servicio #${cita.servicio_id}`}
                    </td>

                    <td>
                      {formatearFecha(cita.fecha)}
                    </td>

                    <td>
                      {cita.hora?.slice(0, 5) || '-'}
                    </td>

                    <td>
                      <span
                        className={`citas-estado ${obtenerEstadoClase(
                          cita.estado
                        )}`}
                      >
                        {cita.estado}
                      </span>
                    </td>

                    <td>
                      <div className="citas-acciones">

                        <button
                          type="button"
                          className="btn-cita-editar"
                          onClick={() => editarCita(cita)}
                          title="Editar cita"
                          aria-label={`Editar cita ${cita.id}`}
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          className="btn-cita-eliminar"
                          onClick={() => eliminarCita(cita.id)}
                          title="Eliminar cita"
                          aria-label={`Eliminar cita ${cita.id}`}
                        >
                          🗑️
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

        {/* PIE */}

        <div className="citas-footer">
          Mostrando {citasFiltradas.length} de{' '}
          {citas.length} citas
        </div>

      </div>
    </div>
  )
}

export default Citas
