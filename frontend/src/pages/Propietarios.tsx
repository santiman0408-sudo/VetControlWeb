import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import type { FormEvent } from 'react'

import {
  Search,
  Plus,
  RefreshCw,
  Users,
  Mail,
  Phone,
  MapPin,
  X,
  UserPlus,
  Save,
  Pencil,
  Trash2,
} from 'lucide-react'

import '../styles/propietarios.css'

interface Propietario {
  id: number
  nombres: string
  apellidos: string
  dni: string | null
  telefono: string
  correo: string | null
  direccion: string | null
  fecha_registro: string
}

interface PropietariosResponse {
  success: boolean
  total: number
  propietarios: Propietario[]
}

interface PropietarioForm {
  nombres: string
  apellidos: string
  dni: string
  telefono: string
  correo: string
  direccion: string
}

const formularioInicial: PropietarioForm = {
  nombres: '',
  apellidos: '',
  dni: '',
  telefono: '',
  correo: '',
  direccion: '',
}

const API_URL = 'http://localhost:4000/api/propietarios'

// ============================================
// OBTENER HEADERS DE AUTENTICACIÓN
// ============================================

const obtenerHeaders = () => {
  try {
    const token = window.localStorage.getItem('token')

    return token
      ? { Authorization: `Bearer ${token}` }
      : {}
  } catch (error) {
    console.error('No se pudo acceder a localStorage:', error)
    return {}
  }
}

// ============================================
// COMPONENTE PROPIETARIOS
// ============================================

export default function Propietarios() {
  const [propietarios, setPropietarios] = useState<Propietario[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [formulario, setFormulario] =
    useState<PropietarioForm>(formularioInicial)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [propietarioEditar, setPropietarioEditar] =
    useState<number | null>(null)
  const [eliminandoId, setEliminandoId] =
    useState<number | null>(null)

  // ============================================
  // CARGAR PROPIETARIOS
  // ============================================

  const cargarPropietarios = useCallback(async () => {
    setCargando(true)
    setError('')

    try {
      const respuesta = await axios.get<PropietariosResponse>(
        API_URL,
        {
          headers: obtenerHeaders(),
        },
      )

      setPropietarios(respuesta.data.propietarios ?? [])
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.status === 401
            ? 'Sesión expirada. Inicia sesión nuevamente.'
            : err.response?.data?.message ||
                'No se pudieron cargar los propietarios.',
        )
      } else {
        setError('Ocurrió un error inesperado.')
      }
    } finally {
      setCargando(false)
    }
  }, [])

  // ============================================
  // CARGA INICIAL
  // ============================================

  useEffect(() => {
    void cargarPropietarios()
  }, [cargarPropietarios])

  // ============================================
  // FILTRAR PROPIETARIOS
  // ============================================

  const propietariosFiltrados = useMemo(() => {
    const termino = busqueda.toLowerCase().trim()

    if (!termino) {
      return propietarios
    }

    return propietarios.filter((p) =>
      [
        p.nombres,
        p.apellidos,
        p.dni ?? '',
        p.telefono,
        p.correo ?? '',
      ].some((dato) => dato.toLowerCase().includes(termino)),
    )
  }, [propietarios, busqueda])

  // ============================================
  // ABRIR FORMULARIO NUEVO
  // ============================================

  const abrirModalNuevo = () => {
    setPropietarioEditar(null)
    setFormulario(formularioInicial)
    setMensaje('')
    setModalAbierto(true)
  }

  // ============================================
  // ABRIR FORMULARIO EDICIÓN
  // ============================================

  const abrirModalEditar = (p: Propietario) => {
    setPropietarioEditar(p.id)

    setFormulario({
      nombres: p.nombres,
      apellidos: p.apellidos,
      dni: p.dni ?? '',
      telefono: p.telefono,
      correo: p.correo ?? '',
      direccion: p.direccion ?? '',
    })

    setMensaje('')
    setModalAbierto(true)
  }

  // ============================================
  // CERRAR FORMULARIO
  // ============================================

  const cerrarModal = () => {
    if (guardando) return

    setModalAbierto(false)
    setPropietarioEditar(null)
    setFormulario(formularioInicial)
    setMensaje('')
  }

  // ============================================
  // ACTUALIZAR CAMPOS
  // ============================================

  const actualizarCampo = (
    campo: keyof PropietarioForm,
    valor: string,
  ) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }))
  }

  // ============================================
  // REGISTRAR / ACTUALIZAR PROPIETARIO
  // ============================================

  const guardarPropietario = async (
    evento: FormEvent<HTMLFormElement>,
  ) => {
    evento.preventDefault()
    setMensaje('')

    const datos = {
      nombres: formulario.nombres.trim(),
      apellidos: formulario.apellidos.trim(),
      dni: formulario.dni.trim() || null,
      telefono: formulario.telefono.trim(),
      correo: formulario.correo.trim() || null,
      direccion: formulario.direccion.trim() || null,
    }

    // VALIDAR CAMPOS OBLIGATORIOS

    if (!datos.nombres || !datos.apellidos || !datos.telefono) {
      setMensaje(
        'Nombres, apellidos y teléfono son obligatorios.',
      )
      return
    }

    // VALIDAR DNI

    if (datos.dni && !/^\d{8}$/.test(datos.dni)) {
      setMensaje('El DNI debe contener exactamente 8 números.')
      return
    }

    // VALIDAR TELÉFONO

    if (!/^\d{9}$/.test(datos.telefono)) {
      setMensaje('El teléfono debe contener exactamente 9 números.')
      return
    }

    // VALIDAR CORREO

    if (
      datos.correo &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)
    ) {
      setMensaje('Ingresa un correo electrónico válido.')
      return
    }

    setGuardando(true)

    try {
      const estabaEditando = propietarioEditar !== null

      if (estabaEditando) {
        await axios.put(
          `${API_URL}/${propietarioEditar}`,
          datos,
          {
            headers: obtenerHeaders(),
          },
        )
      } else {
        await axios.post(
          API_URL,
          datos,
          {
            headers: obtenerHeaders(),
          },
        )
      }

      setModalAbierto(false)
      setPropietarioEditar(null)
      setFormulario(formularioInicial)

      await cargarPropietarios()

      setMensaje(
        estabaEditando
          ? 'Propietario actualizado correctamente.'
          : 'Propietario registrado correctamente.',
      )
    } catch (err: unknown) {
      setMensaje(
        axios.isAxiosError(err)
          ? err.response?.data?.message ||
              'No se pudo guardar el propietario.'
          : 'Ocurrió un error inesperado.',
      )
    } finally {
      setGuardando(false)
    }
  }

  // ============================================
  // ELIMINAR PROPIETARIO
  // ============================================

  const eliminarPropietario = async (p: Propietario) => {
    const confirmado = window.confirm(
      `¿Deseas eliminar al propietario ${p.nombres} ${p.apellidos}? Esta acción no se puede deshacer.`,
    )

    if (!confirmado) return

    setEliminandoId(p.id)
    setError('')
    setMensaje('')

    try {
      await axios.delete(`${API_URL}/${p.id}`, {
        headers: obtenerHeaders(),
      })

      setPropietarios((actuales) =>
        actuales.filter((item) => item.id !== p.id),
      )

      setMensaje('Propietario eliminado correctamente.')
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message ||
              'No se pudo eliminar el propietario.'
          : 'Ocurrió un error inesperado al eliminar.',
      )
    } finally {
      setEliminandoId(null)
    }
  }

  // ============================================
  // INTERFAZ
  // ============================================

  return (
    <div className="propietarios-page">

      {/* MENSAJE DE ÉXITO */}

      {mensaje && !modalAbierto && (
        <div className="propietarios-success" role="status">
          <span>{mensaje}</span>

          <button
            type="button"
            onClick={() => setMensaje('')}
            aria-label="Cerrar mensaje"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* BARRA DE BÚSQUEDA */}

      <div className="propietarios-toolbar">

        <div className="propietarios-search">
          <Search size={18} />

          <input
            type="search"
            placeholder="Buscar por nombre, DNI o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="propietarios-refresh"
          onClick={() => void cargarPropietarios()}
          disabled={cargando}
        >
          <RefreshCw
            size={17}
            className={cargando ? 'icon-spin' : ''}
          />
          Actualizar
        </button>

        <button
          type="button"
          className="propietarios-new"
          onClick={abrirModalNuevo}
        >
          <Plus size={18} />
          Nuevo propietario
        </button>
      </div>

      {/* TOTAL */}

      <div className="propietarios-summary">
        <div className="propietarios-summary-icon">
          <Users size={24} />
        </div>

        <div>
          <span>Total de propietarios</span>
          <strong>{propietarios.length}</strong>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="propietarios-error" role="alert">
          {error}
        </div>
      )}

      {/* TABLA */}

      <div className="propietarios-table-container">
        <table className="propietarios-table">

          <thead>
            <tr>
              <th>ID</th>
              <th>Propietario</th>
              <th>DNI</th>
              <th>Contacto</th>
              <th>Dirección</th>
              <th>Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>

            {cargando ? (
              <tr>
                <td colSpan={7} className="propietarios-empty">
                  <RefreshCw size={18} className="icon-spin" />
                  Cargando propietarios...
                </td>
              </tr>
            ) : propietariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="propietarios-empty">
                  {busqueda
                    ? 'No se encontraron propietarios.'
                    : 'Todavía no hay propietarios registrados.'}
                </td>
              </tr>
            ) : (
              propietariosFiltrados.map((p) => (
                <tr key={p.id}>

                  <td>#{p.id}</td>

                  <td>
                    <div className="propietario-name">
                      <strong>
                        {p.nombres} {p.apellidos}
                      </strong>
                      <span>Propietario</span>
                    </div>
                  </td>

                  <td>{p.dni || '—'}</td>

                  <td>
                    <div className="propietario-contact">

                      <span>
                        <Phone size={14} />
                        {p.telefono}
                      </span>

                      <span>
                        <Mail size={14} />
                        {p.correo || 'Sin correo'}
                      </span>

                    </div>
                  </td>

                  <td>
                    <span className="propietario-address">
                      <MapPin size={14} />
                      {p.direccion || 'Sin dirección'}
                    </span>
                  </td>

                  <td>
                    {p.fecha_registro
                      ? new Date(p.fecha_registro).toLocaleDateString('es-PE')
                      : '—'}
                  </td>

                  <td>
                    <div className="propietarios-actions">

                      <button
                        type="button"
                        className="propietarios-action-edit"
                        onClick={() => abrirModalEditar(p)}
                        title="Editar propietario"
                      >
                        <Pencil size={15} />
                        Editar
                      </button>

                      <button
                        type="button"
                        className="propietarios-action-delete"
                        onClick={() => void eliminarPropietario(p)}
                        disabled={eliminandoId === p.id}
                        title="Eliminar propietario"
                      >
                        {eliminandoId === p.id ? (
                          <RefreshCw
                            size={15}
                            className="icon-spin"
                          />
                        ) : (
                          <Trash2 size={15} />
                        )}

                        {eliminandoId === p.id
                          ? 'Eliminando...'
                          : 'Eliminar'}
                      </button>

                    </div>
                  </td>

                </tr>
              ))
            )}

          </tbody>
        </table>
      </div>

      {/* PIE */}

      <div className="propietarios-footer">
        Mostrando {propietariosFiltrados.length} de{' '}
        {propietarios.length} propietarios
      </div>

      {/* MODAL */}

      {modalAbierto && (
        <div
          className="propietarios-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) cerrarModal()
          }}
        >
          <div
            className="propietarios-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-propietario"
          >

            {/* CABECERA DEL MODAL */}

            <div className="propietarios-modal-header">

              <div className="propietarios-modal-title">

                <div className="propietarios-modal-icon">
                  {propietarioEditar !== null ? (
                    <Pencil size={22} />
                  ) : (
                    <UserPlus size={22} />
                  )}
                </div>

                <div>
                  <h2 id="titulo-modal-propietario">
                    {propietarioEditar !== null
                      ? 'Editar propietario'
                      : 'Nuevo propietario'}
                  </h2>

                  <p>
                    {propietarioEditar !== null
                      ? 'Actualiza los datos del cliente'
                      : 'Registra los datos del cliente'}
                  </p>
                </div>

              </div>

              <button
                type="button"
                className="propietarios-modal-close"
                onClick={cerrarModal}
                disabled={guardando}
                aria-label="Cerrar formulario"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORMULARIO */}

            <form onSubmit={guardarPropietario}>

              <div className="propietarios-modal-body">

                <div className="propietarios-form-section">
                  <h3>Información personal</h3>
                  <p>Los campos marcados con * son obligatorios.</p>
                </div>

                <div className="propietarios-form-grid">

                  {/* NOMBRES */}

                  <div className="propietarios-form-group">
                    <label htmlFor="prop-nombres">
                      Nombres *
                    </label>

                    <input
                      id="prop-nombres"
                      type="text"
                      placeholder="Ej. Juan Carlos"
                      value={formulario.nombres}
                      onChange={(e) =>
                        actualizarCampo('nombres', e.target.value)
                      }
                      required
                      maxLength={100}
                      autoFocus
                    />
                  </div>

                  {/* APELLIDOS */}

                  <div className="propietarios-form-group">
                    <label htmlFor="prop-apellidos">
                      Apellidos *
                    </label>

                    <input
                      id="prop-apellidos"
                      type="text"
                      placeholder="Ej. Pérez García"
                      value={formulario.apellidos}
                      onChange={(e) =>
                        actualizarCampo('apellidos', e.target.value)
                      }
                      required
                      maxLength={100}
                    />
                  </div>

                  {/* DNI */}

                  <div className="propietarios-form-group">
                    <label htmlFor="prop-dni">DNI</label>

                    <input
                      id="prop-dni"
                      type="text"
                      inputMode="numeric"
                      placeholder="8 dígitos (opcional)"
                      value={formulario.dni}
                      onChange={(e) =>
                        actualizarCampo(
                          'dni',
                          e.target.value.replace(/\D/g, '').slice(0, 8),
                        )
                      }
                      maxLength={8}
                    />
                  </div>

                  {/* TELÉFONO */}

                  <div className="propietarios-form-group">
                    <label htmlFor="prop-telefono">
                      Teléfono *
                    </label>

                    <input
                      id="prop-telefono"
                      type="tel"
                      inputMode="numeric"
                      placeholder="9 dígitos"
                      value={formulario.telefono}
                      onChange={(e) =>
                        actualizarCampo(
                          'telefono',
                          e.target.value.replace(/\D/g, '').slice(0, 9),
                        )
                      }
                      required
                      maxLength={9}
                    />
                  </div>

                  {/* CORREO */}

                  <div className="propietarios-form-group">
                    <label htmlFor="prop-correo">
                      Correo electrónico
                    </label>

                    <input
                      id="prop-correo"
                      type="email"
                      placeholder="cliente@correo.com"
                      value={formulario.correo}
                      onChange={(e) =>
                        actualizarCampo('correo', e.target.value)
                      }
                      maxLength={150}
                    />
                  </div>

                  {/* DIRECCIÓN */}

                  <div className="propietarios-form-group">
                    <label htmlFor="prop-direccion">
                      Dirección
                    </label>

                    <input
                      id="prop-direccion"
                      type="text"
                      placeholder="Av., calle, distrito..."
                      value={formulario.direccion}
                      onChange={(e) =>
                        actualizarCampo('direccion', e.target.value)
                      }
                      maxLength={255}
                    />
                  </div>

                </div>

                {/* MENSAJE DE ERROR */}

                {mensaje && (
                  <div
                    className="propietarios-form-error"
                    role="alert"
                  >
                    {mensaje}
                  </div>
                )}

              </div>

              {/* BOTONES */}

              <div className="propietarios-modal-footer">

                <button
                  type="button"
                  className="propietarios-btn-cancel"
                  onClick={cerrarModal}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="propietarios-btn-save"
                  disabled={guardando}
                >
                  {guardando ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="icon-spin"
                      />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={17} />

                      {propietarioEditar !== null
                        ? 'Guardar cambios'
                        : 'Registrar propietario'}
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}
