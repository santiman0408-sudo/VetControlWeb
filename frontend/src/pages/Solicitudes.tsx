import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import '../styles/solicitudes.css';

const API_URL = 'http://localhost:4000/api';

type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA';

type Estado =
  | 'PENDIENTE'
  | 'EN_ATENCION'
  | 'FINALIZADO'
  | 'CANCELADO';

interface Propietario {
  id: number;
  nombres: string;
  apellidos: string;
  telefono?: string;
}

interface Mascota {
  id: number;
  nombre: string;
  propietario_id: number;
}

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  estado: string;
}

interface Solicitud {
  id: number;
  propietario_id: number;
  mascota_id: number;
  tipo_servicio: string;
  prioridad: Prioridad;
  descripcion: string | null;
  estado: Estado;
  fecha_registro: string;
  propietario_nombre?: string;
  propietario_telefono?: string;
  mascota_nombre?: string;
}

interface Formulario {
  propietario_id: string;
  mascota_id: string;
  tipo_servicio: string;
  prioridad: Prioridad;
  descripcion: string;
  estado: Estado;
}

const formularioInicial: Formulario = {
  propietario_id: '',
  mascota_id: '',
  tipo_servicio: '',
  prioridad: 'MEDIA',
  descripcion: '',
  estado: 'PENDIENTE',
};

const estados: Estado[] = [
  'PENDIENTE',
  'EN_ATENCION',
  'FINALIZADO',
  'CANCELADO',
];

const prioridades: Prioridad[] = ['BAJA', 'MEDIA', 'ALTA'];

const headersAPI = (): HeadersInit => {
  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const nombreCompleto = (propietario: Propietario) =>
  `${propietario.nombres} ${propietario.apellidos}`.trim();

const formatoFecha = (fecha: string) => {
  if (!fecha) return '-';

  const fechaValida = new Date(fecha);

  if (Number.isNaN(fechaValida.getTime())) {
    return fecha;
  }

  return fechaValida.toLocaleString('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [propietarios, setPropietarios] = useState<Propietario[]>([]);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  const [formulario, setFormulario] =
    useState<Formulario>(formularioInicial);

  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroPrioridad, setFiltroPrioridad] = useState('TODAS');

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] =
    useState<'success' | 'error'>('success');

  const mostrarMensaje = (
    texto: string,
    tipo: 'success' | 'error' = 'success'
  ) => {
    setMensaje(texto);
    setTipoMensaje(tipo);
  };

  // =====================================================
  // CARGAR SOLICITUDES
  // =====================================================

  const cargarSolicitudes = useCallback(async () => {
    const response = await fetch(`${API_URL}/solicitudes`, {
      headers: headersAPI(),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error al cargar solicitudes.');
    }

    setSolicitudes(data.solicitudes ?? []);
  }, []);

  // =====================================================
  // CARGAR PROPIETARIOS
  // =====================================================

  const cargarPropietarios = useCallback(async () => {
    const response = await fetch(`${API_URL}/propietarios`, {
      headers: headersAPI(),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error al cargar propietarios.');
    }

    setPropietarios(data.propietarios ?? []);
  }, []);

  // =====================================================
  // CARGAR MASCOTAS
  // =====================================================

  const cargarMascotas = useCallback(async () => {
    const response = await fetch(`${API_URL}/mascotas`, {
      headers: headersAPI(),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error al cargar mascotas.');
    }

    setMascotas(data.mascotas ?? []);
  }, []);

  // =====================================================
  // CARGAR SERVICIOS REGISTRADOS
  // =====================================================

  const cargarServicios = useCallback(async () => {
    const response = await fetch(`${API_URL}/servicios`, {
      headers: headersAPI(),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error al cargar servicios.');
    }

    setServicios(data.servicios ?? []);
  }, []);

  // =====================================================
  // INICIALIZAR MÓDULO
  // =====================================================

  useEffect(() => {
    const inicializar = async () => {
      try {
        setCargando(true);

        await Promise.all([
          cargarSolicitudes(),
          cargarPropietarios(),
          cargarMascotas(),
          cargarServicios(),
        ]);
      } catch (error) {
        mostrarMensaje(
          error instanceof Error
            ? error.message
            : 'Error al cargar información.',
          'error'
        );
      } finally {
        setCargando(false);
      }
    };

    inicializar();
  }, [cargarSolicitudes, cargarPropietarios, cargarMascotas, cargarServicios]);

  // =====================================================
  // MASCOTAS DEL PROPIETARIO SELECCIONADO
  // =====================================================

  const mascotasFiltradas = useMemo(() => {
    if (!formulario.propietario_id) return [];

    return mascotas.filter(
      mascota =>
        Number(mascota.propietario_id) ===
        Number(formulario.propietario_id)
    );
  }, [mascotas, formulario.propietario_id]);

  // =====================================================
  // SERVICIOS DISPONIBLES PARA EL FORMULARIO
  // Solo se ofrecen servicios activos para nuevas solicitudes.
  // Al editar, se conserva el servicio histórico aunque esté inactivo.
  // =====================================================

  const serviciosDisponibles = useMemo(() => {
    const activos = servicios.filter(
      servicio => String(servicio.estado).trim().toUpperCase() === 'ACTIVO'
    );

    if (!editandoId || !formulario.tipo_servicio) {
      return activos;
    }

    const servicioHistorico = servicios.find(
      servicio =>
        servicio.nombre === formulario.tipo_servicio &&
        String(servicio.estado).trim().toUpperCase() !== 'ACTIVO'
    );

    if (
      servicioHistorico &&
      !activos.some(servicio => servicio.id === servicioHistorico.id)
    ) {
      return [...activos, servicioHistorico];
    }

    return activos;
  }, [servicios, editandoId, formulario.tipo_servicio]);

  // =====================================================
  // FILTRAR SOLICITUDES
  // =====================================================

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter(solicitud => {
      const texto = busqueda.toLowerCase();

      const coincideBusqueda =
        (solicitud.propietario_nombre ?? '').toLowerCase().includes(texto) ||
        (solicitud.propietario_telefono ?? '').includes(texto) ||
        (solicitud.mascota_nombre ?? '').toLowerCase().includes(texto) ||
        solicitud.tipo_servicio.toLowerCase().includes(texto);

      const coincideEstado =
        filtroEstado === 'TODOS' ||
        solicitud.estado === filtroEstado;

      const coincidePrioridad =
        filtroPrioridad === 'TODAS' ||
        solicitud.prioridad === filtroPrioridad;

      return coincideBusqueda && coincideEstado && coincidePrioridad;
    });
  }, [solicitudes, busqueda, filtroEstado, filtroPrioridad]);

  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  const estadisticas = useMemo(() => ({
    total: solicitudes.length,
    pendientes: solicitudes.filter(
      solicitud => solicitud.estado === 'PENDIENTE'
    ).length,
    atencion: solicitudes.filter(
      solicitud => solicitud.estado === 'EN_ATENCION'
    ).length,
    finalizadas: solicitudes.filter(
      solicitud => solicitud.estado === 'FINALIZADO'
    ).length,
  }), [solicitudes]);

  // =====================================================
  // CAMBIAR CAMPOS DEL FORMULARIO
  // =====================================================

  const cambiarCampo = (campo: keyof Formulario, valor: string) => {
    setFormulario(actual => ({
      ...actual,
      [campo]: valor,
      ...(campo === 'propietario_id' ? { mascota_id: '' } : {}),
    }));
  };

  // =====================================================
  // LIMPIAR FORMULARIO
  // =====================================================

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setEditandoId(null);
  };

  // =====================================================
  // REGISTRAR / ACTUALIZAR SOLICITUD
  // =====================================================

  const guardarSolicitud = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !formulario.propietario_id ||
      !formulario.mascota_id ||
      !formulario.tipo_servicio
    ) {
      mostrarMensaje(
        'Completa propietario, mascota y servicio.',
        'error'
      );
      return;
    }

    const payload = {
      propietario_id: Number(formulario.propietario_id),
      mascota_id: Number(formulario.mascota_id),
      tipo_servicio: formulario.tipo_servicio,
      prioridad: formulario.prioridad,
      descripcion: formulario.descripcion.trim(),
      estado: formulario.estado,
    };

    try {
      setGuardando(true);

      const url = editandoId
        ? `${API_URL}/solicitudes/${editandoId}`
        : `${API_URL}/solicitudes`;

      const response = await fetch(url, {
        method: editandoId ? 'PUT' : 'POST',
        headers: headersAPI(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al guardar solicitud.');
      }

      mostrarMensaje(
        editandoId
          ? 'Solicitud actualizada correctamente.'
          : 'Solicitud registrada correctamente.'
      );

      limpiarFormulario();
      await cargarSolicitudes();
    } catch (error) {
      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la solicitud.',
        'error'
      );
    } finally {
      setGuardando(false);
    }
  };

  // =====================================================
  // EDITAR SOLICITUD
  // =====================================================

  const editarSolicitud = (solicitud: Solicitud) => {
    setEditandoId(solicitud.id);

    setFormulario({
      propietario_id: String(solicitud.propietario_id),
      mascota_id: String(solicitud.mascota_id),
      tipo_servicio: solicitud.tipo_servicio,
      prioridad: solicitud.prioridad,
      descripcion: solicitud.descripcion ?? '',
      estado: solicitud.estado,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // =====================================================
  // CAMBIAR ESTADO
  // =====================================================

  const actualizarEstado = async (
    solicitud: Solicitud,
    estado: Estado
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/solicitudes/${solicitud.id}`,
        {
          method: 'PUT',
          headers: headersAPI(),
          body: JSON.stringify({
            propietario_id: solicitud.propietario_id,
            mascota_id: solicitud.mascota_id,
            tipo_servicio: solicitud.tipo_servicio,
            prioridad: solicitud.prioridad,
            descripcion: solicitud.descripcion ?? '',
            estado,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al cambiar estado.');
      }

      mostrarMensaje('Estado actualizado correctamente.');
      await cargarSolicitudes();
    } catch (error) {
      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el estado.',
        'error'
      );
    }
  };

  // =====================================================
  // ELIMINAR SOLICITUD
  // =====================================================

  const eliminarSolicitud = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar esta solicitud?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/solicitudes/${id}`, {
        method: 'DELETE',
        headers: headersAPI(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al eliminar solicitud.');
      }

      mostrarMensaje('Solicitud eliminada correctamente.');
      await cargarSolicitudes();
    } catch (error) {
      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar la solicitud.',
        'error'
      );
    }
  };

  // =====================================================
  // INTERFAZ
  // =====================================================

  return (
    <div className="solicitudes-container">

      <header className="solicitudes-header">
        <div>
          <span className="solicitudes-subtitle">
            GESTIÓN VETERINARIA
          </span>

          <h1>Solicitudes de Atención</h1>

          <p>Administra las solicitudes de atención veterinaria.</p>
        </div>

        <button
          type="button"
          className="solicitudes-btn-primary"
          onClick={() => {
            limpiarFormulario();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          + Nueva solicitud
        </button>
      </header>

      {mensaje && (
        <div className={`solicitudes-alert ${tipoMensaje}`}>
          {mensaje}

          <button
            type="button"
            onClick={() => setMensaje('')}
            aria-label="Cerrar mensaje"
            style={{
              float: 'right',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ESTADÍSTICAS */}

      <section className="solicitudes-estadisticas">
        <article className="solicitud-stat-card">
          <span className="stat-icon">📋</span>
          <div>
            <span>Total solicitudes</span>
            <strong>{estadisticas.total}</strong>
          </div>
        </article>

        <article className="solicitud-stat-card">
          <span className="stat-icon">⏳</span>
          <div>
            <span>Pendientes</span>
            <strong>{estadisticas.pendientes}</strong>
          </div>
        </article>

        <article className="solicitud-stat-card">
          <span className="stat-icon">🩺</span>
          <div>
            <span>En atención</span>
            <strong>{estadisticas.atencion}</strong>
          </div>
        </article>

        <article className="solicitud-stat-card">
          <span className="stat-icon">✅</span>
          <div>
            <span>Finalizadas</span>
            <strong>{estadisticas.finalizadas}</strong>
          </div>
        </article>
      </section>

      {/* FORMULARIO */}

      <section className="solicitudes-form-card">
        <div className="solicitudes-section-header">
          <div>
            <h2>
              {editandoId ? 'Editar solicitud' : 'Registrar solicitud'}
            </h2>
            <p>Completa los datos de la atención.</p>
          </div>

          {editandoId && (
            <button
              type="button"
              className="solicitudes-btn-secondary"
              onClick={limpiarFormulario}
            >
              Cancelar edición
            </button>
          )}
        </div>

        <form onSubmit={guardarSolicitud}>
          <div className="solicitudes-form-grid">

            <div className="solicitudes-field">
              <label htmlFor="propietario_id">Propietario *</label>

              <select
                id="propietario_id"
                value={formulario.propietario_id}
                onChange={event =>
                  cambiarCampo('propietario_id', event.target.value)
                }
                required
              >
                <option value="">Seleccionar propietario</option>

                {propietarios.map(propietario => (
                  <option key={propietario.id} value={propietario.id}>
                    {nombreCompleto(propietario)}
                  </option>
                ))}
              </select>
            </div>

            <div className="solicitudes-field">
              <label htmlFor="mascota_id">Mascota *</label>

              <select
                id="mascota_id"
                value={formulario.mascota_id}
                onChange={event =>
                  cambiarCampo('mascota_id', event.target.value)
                }
                disabled={!formulario.propietario_id}
                required
              >
                <option value="">Seleccionar mascota</option>

                {mascotasFiltradas.map(mascota => (
                  <option key={mascota.id} value={mascota.id}>
                    {mascota.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="solicitudes-field">
              <label htmlFor="tipo_servicio">Tipo de servicio *</label>

              <select
                id="tipo_servicio"
                value={formulario.tipo_servicio}
                onChange={event =>
                  cambiarCampo('tipo_servicio', event.target.value)
                }
                required
              >
                <option value="">Seleccionar servicio</option>
                {serviciosDisponibles.map(servicio => {
                  const estaActivo =
                    String(servicio.estado).trim().toUpperCase() === 'ACTIVO';

                  return (
                    <option key={servicio.id} value={servicio.nombre}>
                      {servicio.nombre}
                      {!estaActivo ? ' (Inactivo - servicio histórico)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="solicitudes-field">
              <label htmlFor="prioridad">Prioridad *</label>

              <select
                id="prioridad"
                value={formulario.prioridad}
                onChange={event =>
                  cambiarCampo('prioridad', event.target.value)
                }
                required
              >
                {prioridades.map(prioridad => (
                  <option key={prioridad} value={prioridad}>
                    {prioridad}
                  </option>
                ))}
              </select>
            </div>

            {editandoId && (
              <div className="solicitudes-field">
                <label htmlFor="estado">Estado *</label>

                <select
                  id="estado"
                  value={formulario.estado}
                  onChange={event =>
                    cambiarCampo('estado', event.target.value)
                  }
                >
                  {estados.map(estado => (
                    <option key={estado} value={estado}>
                      {estado.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="solicitudes-field solicitudes-field-full">
              <label htmlFor="descripcion">Descripción</label>

              <textarea
                id="descripcion"
                value={formulario.descripcion}
                onChange={event =>
                  cambiarCampo('descripcion', event.target.value)
                }
                placeholder="Describe los síntomas o motivo de atención..."
                rows={4}
              />
            </div>

          </div>

          <div className="solicitudes-form-actions">
            <button
              type="button"
              className="solicitudes-btn-secondary"
              onClick={limpiarFormulario}
            >
              Limpiar
            </button>

            <button
              type="submit"
              className="solicitudes-btn-primary"
              disabled={guardando}
            >
              {guardando
                ? 'Guardando...'
                : editandoId
                  ? 'Actualizar solicitud'
                  : 'Registrar solicitud'}
            </button>
          </div>
        </form>
      </section>

      {/* LISTADO */}

      <section className="solicitudes-list-card">
        <div className="solicitudes-section-header">
          <div>
            <h2>Listado de solicitudes</h2>
            <p>
              {solicitudesFiltradas.length} solicitud(es) encontrada(s).
            </p>
          </div>
        </div>

        <div className="solicitudes-filtros">
          <input
            type="search"
            placeholder="Buscar propietario, teléfono o mascota..."
            value={busqueda}
            onChange={event => setBusqueda(event.target.value)}
          />

          <select
            value={filtroEstado}
            onChange={event => setFiltroEstado(event.target.value)}
          >
            <option value="TODOS">Todos los estados</option>

            {estados.map(estado => (
              <option key={estado} value={estado}>
                {estado.replace('_', ' ')}
              </option>
            ))}
          </select>

          <select
            value={filtroPrioridad}
            onChange={event => setFiltroPrioridad(event.target.value)}
          >
            <option value="TODAS">Todas las prioridades</option>

            {prioridades.map(prioridad => (
              <option key={prioridad} value={prioridad}>
                {prioridad}
              </option>
            ))}
          </select>
        </div>

        {cargando ? (
          <div className="solicitudes-loading">
            Cargando solicitudes...
          </div>
        ) : solicitudesFiltradas.length === 0 ? (
          <div className="solicitudes-empty">
            <span>📭</span>
            <h3>No hay solicitudes disponibles</h3>
            <p>Registra una solicitud o cambia los filtros.</p>
          </div>
        ) : (
          <div className="solicitudes-table-wrapper">
            <table className="solicitudes-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Propietario</th>
                  <th>Teléfono</th>
                  <th>Mascota</th>
                  <th>Servicio</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {solicitudesFiltradas.map(solicitud => (
                  <tr key={solicitud.id}>
                    <td>#{solicitud.id}</td>

                    <td>
                      <strong>
                        {solicitud.propietario_nombre || 'Sin propietario'}
                      </strong>
                    </td>

                    <td>{solicitud.propietario_telefono || '-'}</td>

                    <td>{solicitud.mascota_nombre || 'Sin mascota'}</td>

                    <td>
                      <span className="solicitud-servicio">
                        {solicitud.tipo_servicio}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`solicitud-badge prioridad-${solicitud.prioridad.toLowerCase()}`}
                      >
                        {solicitud.prioridad}
                      </span>
                    </td>

                    <td>
                      <select
                        className={`solicitud-estado-select estado-${solicitud.estado.toLowerCase()}`}
                        value={solicitud.estado}
                        onChange={event =>
                          actualizarEstado(
                            solicitud,
                            event.target.value as Estado
                          )
                        }
                      >
                        {estados.map(estado => (
                          <option key={estado} value={estado}>
                            {estado.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>{formatoFecha(solicitud.fecha_registro)}</td>

                    <td>
                      <div className="solicitudes-actions">
                        <button
                          type="button"
                          className="solicitud-action-edit"
                          onClick={() => editarSolicitud(solicitud)}
                          title="Editar"
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          className="solicitud-action-delete"
                          onClick={() => eliminarSolicitud(solicitud.id)}
                          title="Eliminar"
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
      </section>

      <footer className="solicitudes-footer">
        VetControlWeb · Gestión de solicitudes veterinarias
      </footer>

    </div>
  );
}

export default Solicitudes;
