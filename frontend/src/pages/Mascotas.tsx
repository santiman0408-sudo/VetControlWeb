import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import '../styles/mascotas.css'

// ======================================================
// CONFIGURACIÓN
// ======================================================

const API_URL = 'http://localhost:4000/api'

// ======================================================
// INTERFACES
// ======================================================

interface Propietario {
  id: number
  nombres: string
  apellidos: string
  dni: string
  telefono?: string
  correo?: string | null
}

interface Mascota {
  id: number
  propietario_id: number
  propietario_nombre?: string
  nombre: string
  especie: string
  raza?: string | null
  sexo?: string | null
  fecha_nacimiento?: string | null
  peso?: number | null
  observaciones?: string | null
}

interface MascotaForm {
  propietario_id: string
  nombre: string
  especie: string
  raza: string
  sexo: string
  fecha_nacimiento: string
  peso: string
  observaciones: string
}

interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
}

const formularioInicial: MascotaForm = {
  propietario_id: '',
  nombre: '',
  especie: 'Perro',
  raza: '',
  sexo: 'MACHO',
  fecha_nacimiento: '',
  peso: '',
  observaciones: '',
}

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function Mascotas() {
  const [mascotas, setMascotas] = useState<Mascota[]>([])
  const [propietarios, setPropietarios] = useState<Propietario[]>([])

  const [formulario, setFormulario] =
    useState<MascotaForm>(formularioInicial)

  const [busqueda, setBusqueda] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mascotaEditar, setMascotaEditar] =
    useState<number | null>(null)

  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  // ======================================================
  // AUTENTICACIÓN
  // ======================================================

  const token = localStorage.getItem('token')

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token],
  )

  // ======================================================
  // CARGAR INFORMACIÓN
  // ======================================================

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError('')

    try {
      const [respuestaMascotas, respuestaPropietarios] =
        await Promise.all([
          axios.get(`${API_URL}/mascotas`, { headers }),
          axios.get(`${API_URL}/propietarios`, { headers }),
        ])

      const listaMascotas =
        respuestaMascotas.data?.mascotas ??
        respuestaMascotas.data?.data?.mascotas ??
        respuestaMascotas.data?.data ??
        []

      const listaPropietarios =
        respuestaPropietarios.data?.propietarios ??
        respuestaPropietarios.data?.data?.propietarios ??
        respuestaPropietarios.data?.data ??
        []

      setMascotas(
        Array.isArray(listaMascotas) ? listaMascotas : [],
      )

      setPropietarios(
        Array.isArray(listaPropietarios)
          ? listaPropietarios
          : [],
      )
    } catch (err: unknown) {
      const errorApi = err as ApiError

      setError(
        errorApi.response?.data?.message ??
          'No se pudieron cargar las mascotas y propietarios.',
      )
    } finally {
      setCargando(false)
    }
  }, [headers])

  useEffect(() => {
    void cargarDatos()
  }, [cargarDatos])

  // ======================================================
  // PROPIETARIO
  // ======================================================

  const obtenerPropietario = (id: number) => {
    const propietario = propietarios.find(
      (item) => item.id === id,
    )

    if (!propietario) return 'Propietario no disponible'

    return `${propietario.nombres} ${propietario.apellidos}`
  }

  // ======================================================
  // BÚSQUEDA
  // ======================================================

  const mascotasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()

    return mascotas.filter((mascota) => {
      const propietario =
        mascota.propietario_nombre ??
        obtenerPropietario(mascota.propietario_id)

      const contenido = [
        mascota.nombre,
        mascota.especie,
        mascota.raza,
        mascota.sexo,
        propietario,
      ]
        .join(' ')
        .toLowerCase()

      return contenido.includes(termino)
    })
  }, [mascotas, propietarios, busqueda])

  // ======================================================
  // CAMPOS DEL FORMULARIO
  // ======================================================

  const cambiarCampo = (
    campo: keyof MascotaForm,
    valor: string,
  ) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }))
  }

  // ======================================================
  // NUEVA MASCOTA
  // ======================================================

  const abrirNuevo = () => {
    setMascotaEditar(null)
    setFormulario({ ...formularioInicial })
    setError('')
    setMensaje('')
    setMostrarFormulario(true)
  }

  // ======================================================
  // EDITAR MASCOTA
  // ======================================================

  const editarMascota = (mascota: Mascota) => {
    setMascotaEditar(mascota.id)

    setFormulario({
      propietario_id: String(mascota.propietario_id),
      nombre: mascota.nombre,
      especie: mascota.especie,
      raza: mascota.raza ?? '',
      sexo: mascota.sexo ?? 'MACHO',
      fecha_nacimiento: mascota.fecha_nacimiento
        ? mascota.fecha_nacimiento.substring(0, 10)
        : '',
      peso:
        mascota.peso !== null &&
        mascota.peso !== undefined
          ? String(mascota.peso)
          : '',
      observaciones: mascota.observaciones ?? '',
    })

    setError('')
    setMensaje('')
    setMostrarFormulario(true)
  }

  // ======================================================
  // CERRAR FORMULARIO
  // ======================================================

  const cerrarFormulario = () => {
    if (guardando) return

    setMostrarFormulario(false)
    setMascotaEditar(null)
    setFormulario({ ...formularioInicial })
    setError('')
  }

  // ======================================================
  // REGISTRAR / ACTUALIZAR
  // ======================================================

  const guardarMascota = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError('')
    setMensaje('')

    if (!formulario.propietario_id) {
      setError('Selecciona un propietario.')
      return
    }

    if (!formulario.nombre.trim()) {
      setError('Ingresa el nombre de la mascota.')
      return
    }

    if (!formulario.especie) {
      setError('Selecciona una especie.')
      return
    }

    if (
      formulario.peso &&
      (
        Number(formulario.peso) <= 0 ||
        !Number.isFinite(Number(formulario.peso))
      )
    ) {
      setError('Ingresa un peso válido.')
      return
    }

    const datos = {
      propietario_id: Number(formulario.propietario_id),
      nombre: formulario.nombre.trim(),
      especie: formulario.especie,
      raza: formulario.raza.trim() || null,
      sexo: formulario.sexo,
      fecha_nacimiento:
        formulario.fecha_nacimiento || null,
      peso: formulario.peso
        ? Number(formulario.peso)
        : null,
      observaciones:
        formulario.observaciones.trim() || null,
    }

    setGuardando(true)

    try {
      if (mascotaEditar !== null) {
        await axios.put(
          `${API_URL}/mascotas/${mascotaEditar}`,
          datos,
          { headers },
        )

        setMensaje('Mascota actualizada correctamente.')
      } else {
        await axios.post(
          `${API_URL}/mascotas`,
          datos,
          { headers },
        )

        setMensaje('Mascota registrada correctamente.')
      }

      setMostrarFormulario(false)
      setMascotaEditar(null)
      setFormulario({ ...formularioInicial })

      await cargarDatos()
    } catch (err: unknown) {
      const errorApi = err as ApiError

      setError(
        errorApi.response?.data?.message ??
          'No se pudo guardar la mascota.',
      )
    } finally {
      setGuardando(false)
    }
  }

  // ======================================================
  // ELIMINAR MASCOTA
  // ======================================================

  const eliminarMascota = async (mascota: Mascota) => {
    const confirmar = window.confirm(
      `¿Deseas eliminar a ${mascota.nombre}? Esta acción no se puede deshacer.`,
    )

    if (!confirmar) return

    setError('')
    setMensaje('')
    setEliminandoId(mascota.id)

    try {
      await axios.delete(
        `${API_URL}/mascotas/${mascota.id}`,
        { headers },
      )

      setMensaje(
        `La mascota ${mascota.nombre} fue eliminada correctamente.`,
      )

      await cargarDatos()
    } catch (err: unknown) {
      const errorApi = err as ApiError

      setError(
        errorApi.response?.data?.message ??
          'No se pudo eliminar la mascota.',
      )
    } finally {
      setEliminandoId(null)
    }
  }

  // ======================================================
  // RENDERIZADO
  // ======================================================

  return (
    <div className="mascotas-container">

      {/* ENCABEZADO */}

      <header className="mascotas-header">
        <div>
          <h1>Gestión de mascotas</h1>
          <p>
            Administración de pacientes veterinarios
          </p>
        </div>
      </header>

      {/* MENSAJES */}

      {error && (
        <div className="mascotas-error" role="alert">
          <span>⚠</span>
          {error}
        </div>
      )}

      {mensaje && (
        <div className="mascotas-success" role="status">
          <span>✓</span>
          {mensaje}
        </div>
      )}

      {/* BARRA DE ACCIONES */}

      <div className="mascotas-toolbar">
        <div className="mascotas-search-wrapper">
          <span className="mascotas-search-icon" aria-hidden="true">
            ⌕
          </span>

          <input
            type="search"
            className="mascotas-search"
            placeholder="Buscar por mascota, raza o propietario..."
            value={busqueda}
            onChange={(event) =>
              setBusqueda(event.target.value)
            }
            aria-label="Buscar mascotas"
          />
        </div>

        <button
          type="button"
          className="mascotas-btn mascotas-btn-primary"
          onClick={abrirNuevo}
        >
          <span aria-hidden="true">＋</span>
          Nueva mascota
        </button>

        <button
          type="button"
          className="mascotas-btn mascotas-btn-secondary mascotas-refresh"
          onClick={() => void cargarDatos()}
          disabled={cargando}
          title="Actualizar listado"
          aria-label="Actualizar listado"
        >
          {cargando ? '…' : '↻'}
        </button>
      </div>

      {/* ESTADÍSTICA */}

      <div className="mascotas-stat-card">
        <div className="mascotas-stat-icon">
          <span aria-hidden="true">🐾</span>
        </div>

        <div>
          <div className="mascotas-stat-label">
            Total de mascotas registradas
          </div>

          <div className="mascotas-stat-value">
            {mascotas.length}
          </div>

          <div className="mascotas-stat-description">
            Pacientes veterinarios
          </div>
        </div>
      </div>

      {/* FORMULARIO */}

      {mostrarFormulario && (
        <section className="mascotas-form-card">

          <div className="mascotas-form-header">
            <div>
              <h2>
                {mascotaEditar !== null
                  ? 'Editar mascota'
                  : 'Registrar nueva mascota'}
              </h2>

              <p>
                Completa la información del paciente veterinario.
              </p>
            </div>

            <button
              type="button"
              className="mascotas-action-btn"
              onClick={cerrarFormulario}
              disabled={guardando}
              aria-label="Cerrar formulario"
              title="Cerrar"
            >
              ✕
            </button>
          </div>

          <form onSubmit={guardarMascota}>

            <div className="mascotas-form-grid">

              {/* PROPIETARIO */}

              <div className="mascotas-form-group">
                <label htmlFor="propietario_id">
                  Propietario <span>*</span>
                </label>

                <select
                  id="propietario_id"
                  value={formulario.propietario_id}
                  onChange={(event) =>
                    cambiarCampo(
                      'propietario_id',
                      event.target.value,
                    )
                  }
                  required
                >
                  <option value="">
                    Seleccionar propietario
                  </option>

                  {propietarios.map((propietario) => (
                    <option
                      key={propietario.id}
                      value={propietario.id}
                    >
                      {propietario.nombres}{' '}
                      {propietario.apellidos}
                    </option>
                  ))}
                </select>

                {propietarios.length === 0 && (
                  <small className="mascotas-field-help">
                    Registra primero un propietario.
                  </small>
                )}
              </div>

              {/* NOMBRE */}

              <div className="mascotas-form-group">
                <label htmlFor="nombre">
                  Nombre de mascota <span>*</span>
                </label>

                <input
                  id="nombre"
                  type="text"
                  placeholder="Ej. Max"
                  value={formulario.nombre}
                  onChange={(event) =>
                    cambiarCampo('nombre', event.target.value)
                  }
                  maxLength={100}
                  required
                />
              </div>

              {/* ESPECIE */}

              <div className="mascotas-form-group">
                <label htmlFor="especie">
                  Especie <span>*</span>
                </label>

                <select
                  id="especie"
                  value={formulario.especie}
                  onChange={(event) =>
                    cambiarCampo('especie', event.target.value)
                  }
                  required
                >
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Ave">Ave</option>
                  <option value="Conejo">Conejo</option>
                  <option value="Hamster">Hamster</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* RAZA */}

              <div className="mascotas-form-group">
                <label htmlFor="raza">Raza</label>

                <input
                  id="raza"
                  type="text"
                  placeholder="Ej. Shih Tzu"
                  value={formulario.raza}
                  onChange={(event) =>
                    cambiarCampo('raza', event.target.value)
                  }
                  maxLength={100}
                />
              </div>

              {/* SEXO */}

              <div className="mascotas-form-group">
                <label htmlFor="sexo">Sexo</label>

                <select
                  id="sexo"
                  value={formulario.sexo}
                  onChange={(event) =>
                    cambiarCampo('sexo', event.target.value)
                  }
                >
                  <option value="MACHO">Macho</option>
                  <option value="HEMBRA">Hembra</option>
                </select>
              </div>

              {/* FECHA */}

              <div className="mascotas-form-group">
                <label htmlFor="fecha_nacimiento">
                  Fecha de nacimiento
                </label>

                <input
                  id="fecha_nacimiento"
                  type="date"
                  value={formulario.fecha_nacimiento}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(event) =>
                    cambiarCampo(
                      'fecha_nacimiento',
                      event.target.value,
                    )
                  }
                />
              </div>

              {/* PESO */}

              <div className="mascotas-form-group">
                <label htmlFor="peso">Peso (kg)</label>

                <input
                  id="peso"
                  type="number"
                  placeholder="Ej. 6.50"
                  min="0.01"
                  max="999"
                  step="0.01"
                  value={formulario.peso}
                  onChange={(event) =>
                    cambiarCampo('peso', event.target.value)
                  }
                />

                <small className="mascotas-field-help">
                  Peso expresado en kilogramos.
                </small>
              </div>

              {/* OBSERVACIONES */}

              <div className="mascotas-form-group mascotas-form-group-full">
                <label htmlFor="observaciones">
                  Observaciones clínicas
                </label>

                <textarea
                  id="observaciones"
                  placeholder="Información adicional, características o antecedentes de la mascota..."
                  value={formulario.observaciones}
                  onChange={(event) =>
                    cambiarCampo(
                      'observaciones',
                      event.target.value,
                    )
                  }
                  rows={4}
                  maxLength={1000}
                />

                <small className="mascotas-field-help">
                  {formulario.observaciones.length}/1000 caracteres
                </small>
              </div>

            </div>

            {/* BOTONES */}

            <div className="mascotas-form-actions">

              <button
                type="button"
                className="mascotas-btn mascotas-btn-secondary"
                onClick={cerrarFormulario}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="mascotas-btn mascotas-btn-primary"
                disabled={
                  guardando ||
                  propietarios.length === 0
                }
              >
                {guardando
                  ? 'Guardando...'
                  : mascotaEditar !== null
                    ? 'Guardar cambios'
                    : 'Registrar mascota'}
              </button>

            </div>

          </form>
        </section>
      )}

      {/* TABLA */}

      <section className="mascotas-table-card">

        <div className="mascotas-table-header">
          <div>
            <h2>Listado de mascotas</h2>
            <p>Pacientes registrados en VetControl</p>
          </div>

          <span className="mascotas-record-count">
            {mascotasFiltradas.length}{' '}
            {mascotasFiltradas.length === 1
              ? 'registro'
              : 'registros'}
          </span>
        </div>

        <div className="mascotas-table-wrapper">

          <table className="mascotas-table">

            <thead>
              <tr>
                <th>Mascota</th>
                <th>Especie</th>
                <th>Raza</th>
                <th>Sexo</th>
                <th>Peso</th>
                <th>Propietario</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>

              {cargando ? (
                <tr>
                  <td colSpan={7} className="mascotas-empty">
                    <span className="mascotas-loading">
                      Cargando mascotas...
                    </span>
                  </td>
                </tr>
              ) : mascotasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="mascotas-empty">
                    <div className="mascotas-empty-icon">
                      🐾
                    </div>

                    <strong>
                      {busqueda
                        ? 'No se encontraron resultados'
                        : 'No hay mascotas registradas'}
                    </strong>

                    <p>
                      {busqueda
                        ? 'Intenta con otro término de búsqueda.'
                        : 'Registra una mascota para comenzar.'}
                    </p>
                  </td>
                </tr>
              ) : (
                mascotasFiltradas.map((mascota) => (
                  <tr key={mascota.id}>

                    {/* MASCOTA */}

                    <td>
                      <div className="mascotas-name-cell">
                        <div className="mascotas-avatar">
                          🐾
                        </div>

                        <div>
                          <div className="mascotas-name">
                            {mascota.nombre}
                          </div>

                          <div className="mascotas-subtext">
                            ID #{mascota.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ESPECIE */}

                    <td>
                      <span className="mascotas-species">
                        {mascota.especie}
                      </span>
                    </td>

                    {/* RAZA */}

                    <td>{mascota.raza || '—'}</td>

                    {/* SEXO */}

                    <td>
                      {mascota.sexo ? (
                        <span
                          className={`mascotas-sex-badge ${
                            mascota.sexo === 'MACHO'
                              ? 'masculino'
                              : 'femenino'
                          }`}
                        >
                          {mascota.sexo === 'MACHO'
                            ? '♂ Macho'
                            : '♀ Hembra'}
                        </span>
                      ) : '—'}
                    </td>

                    {/* PESO */}

                    <td>
                      {mascota.peso !== null &&
                      mascota.peso !== undefined
                        ? `${mascota.peso} kg`
                        : '—'}
                    </td>

                    {/* PROPIETARIO */}

                    <td>
                      <span className="mascotas-owner">
                        {mascota.propietario_nombre ??
                          obtenerPropietario(
                            mascota.propietario_id,
                          )}
                      </span>
                    </td>

                    {/* ACCIONES */}

                    <td>
                      <div className="mascotas-actions">

                        <button
                          type="button"
                          className="mascotas-action-btn"
                          onClick={() =>
                            editarMascota(mascota)
                          }
                          title="Editar mascota"
                          aria-label={`Editar ${mascota.nombre}`}
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          className="mascotas-action-btn delete"
                          onClick={() =>
                            void eliminarMascota(mascota)
                          }
                          disabled={
                            eliminandoId === mascota.id
                          }
                          title="Eliminar mascota"
                          aria-label={`Eliminar ${mascota.nombre}`}
                        >
                          {eliminandoId === mascota.id
                            ? '…'
                            : '🗑'}
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>
      </section>

    </div>
  )
}

