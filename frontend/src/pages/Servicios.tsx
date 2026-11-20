import { useEffect, useState, type FormEvent } from "react";
import "../styles/servicios.css";

// ============================================
// TIPOS E INTERFACES
// ============================================

type EstadoServicio = "ACTIVO" | "INACTIVO";

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracion: number;
  estado: EstadoServicio;
}

interface FormularioServicio {
  nombre: string;
  descripcion: string;
  precio: string;
  duracion: string;
  estado: EstadoServicio;
}

interface RespuestaServicios {
  success: boolean;
  total: number;
  servicios: Servicio[];
  message?: string;
}

// ============================================
// CONFIGURACIÓN API
// ============================================

const API_URL = "http://localhost:4000/api/servicios";

const formularioInicial: FormularioServicio = {
  nombre: "",
  descripcion: "",
  precio: "",
  duracion: "30",
  estado: "ACTIVO",
};

// ============================================
// OBTENER CABECERAS DE AUTENTICACIÓN
// ============================================

const obtenerHeaders = (): HeadersInit => {
  const token = window.localStorage.getItem("token");

  if (!token) {
    throw new Error(
      "No hay una sesión activa. Inicia sesión nuevamente."
    );
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// ============================================
// COMPONENTE SERVICIOS
// ============================================

function Servicios() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [formulario, setFormulario] =
    useState<FormularioServicio>(formularioInicial);

  const [editando, setEditando] = useState<number | null>(null);

  // ============================================
  // OBTENER SERVICIOS
  // ============================================

  const obtenerServicios = async () => {
    try {
      setError("");

      const respuesta = await fetch(API_URL, {
        method: "GET",
        headers: obtenerHeaders(),
        cache: "no-store",
      });

      const datos: RespuestaServicios = await respuesta.json();

      if (!respuesta.ok || !datos.success) {
        throw new Error(
          datos.message || "Error al obtener los servicios"
        );
      }

      setServicios(
        (datos.servicios || []).map((servicio) => ({
          ...servicio,
          precio: Number(servicio.precio),
          duracion: Number(servicio.duracion),
          estado:
            servicio.estado === "INACTIVO" ? "INACTIVO" : "ACTIVO",
        }))
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los servicios"
      );
    } finally {
      setCargando(false);
    }
  };

  // ============================================
  // CARGAR SERVICIOS AL INICIAR
  // ============================================

  useEffect(() => {
    obtenerServicios();
  }, []);

  // ============================================
  // LIMPIAR FORMULARIO
  // ============================================

  const limpiarFormulario = () => {
    setFormulario({ ...formularioInicial });
    setEditando(null);
  };

  // ============================================
  // REGISTRAR O ACTUALIZAR SERVICIO
  // ============================================

  const guardarServicio = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const payload = {
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim(),
        precio: Number(formulario.precio),
        duracion: Number(formulario.duracion),
        estado: formulario.estado,
      };

      // VALIDAR NOMBRE
      if (!payload.nombre) {
        throw new Error("El nombre del servicio es obligatorio");
      }

      // VALIDAR PRECIO
      if (
        formulario.precio.trim() === "" ||
        !Number.isFinite(payload.precio) ||
        payload.precio < 0
      ) {
        throw new Error(
          "Ingresa un precio válido mayor o igual a cero"
        );
      }

      // VALIDAR DURACIÓN
      if (
        formulario.duracion.trim() === "" ||
        !Number.isFinite(payload.duracion) ||
        payload.duracion <= 0
      ) {
        throw new Error(
          "La duración debe ser mayor que cero"
        );
      }

      const respuesta = await fetch(
        editando !== null
          ? `${API_URL}/${editando}`
          : API_URL,
        {
          method: editando !== null ? "PUT" : "POST",
          headers: obtenerHeaders(),
          body: JSON.stringify(payload),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.success) {
        throw new Error(
          datos.message || "No se pudo guardar el servicio"
        );
      }

      const mensajeExito =
        editando !== null
          ? "Servicio actualizado correctamente."
          : "Servicio registrado correctamente.";

      limpiarFormulario();

      await obtenerServicios();

      setMensaje(mensajeExito);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al guardar el servicio"
      );
    } finally {
      setGuardando(false);
    }
  };

  // ============================================
  // EDITAR SERVICIO
  // ============================================

  const editarServicio = (servicio: Servicio) => {
    setEditando(servicio.id);

    setFormulario({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || "",
      precio: String(servicio.precio),
      duracion: String(servicio.duracion),
      estado: servicio.estado,
    });

    setMensaje("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================
  // ELIMINAR SERVICIO
  // ============================================

  const eliminarServicio = async (id: number) => {
    const confirmar = window.confirm(
      "¿Estás seguro de eliminar este servicio?"
    );

    if (!confirmar) return;

    try {
      setError("");
      setMensaje("");

      const respuesta = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: obtenerHeaders(),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.success) {
        throw new Error(
          datos.message || "No se pudo eliminar el servicio"
        );
      }

      if (editando === id) {
        limpiarFormulario();
      }

      await obtenerServicios();

      setMensaje("Servicio eliminado correctamente.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al eliminar el servicio"
      );
    }
  };

  // ============================================
  // RENDERIZADO
  // ============================================

  return (
    <div className="servicios-container">

      {/* ENCABEZADO */}

      <header className="servicios-header">
        <div>
          <h1>Gestión de Servicios Veterinarios</h1>
          <p>
            Administra los servicios, precios y duración de las atenciones.
          </p>
        </div>
      </header>

      {/* MENSAJES */}

      {error && (
        <div className="servicios-alerta">
          <strong>Error:</strong> {error}
        </div>
      )}

      {mensaje && (
        <div className="servicios-mensaje">
          {mensaje}
        </div>
      )}

      {/* FORMULARIO */}

      <section className="servicios-formulario">

        <h2>
          {editando !== null
            ? "Editar servicio"
            : "Registrar nuevo servicio"}
        </h2>

        <form onSubmit={guardarServicio}>

          <div className="servicios-grid-form">

            {/* NOMBRE */}

            <div className="servicios-campo">
              <label htmlFor="nombre">
                Nombre del servicio
              </label>

              <input
                id="nombre"
                type="text"
                required
                value={formulario.nombre}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    nombre: e.target.value,
                  })
                }
                placeholder="Ej. Consulta veterinaria"
              />
            </div>

            {/* PRECIO */}

            <div className="servicios-campo">
              <label htmlFor="precio">
                Precio (S/)
              </label>

              <input
                id="precio"
                type="number"
                min="0"
                step="0.01"
                required
                value={formulario.precio}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    precio: e.target.value,
                  })
                }
                placeholder="0.00"
              />
            </div>

            {/* DURACIÓN */}

            <div className="servicios-campo">
              <label htmlFor="duracion">
                Duración (minutos)
              </label>

              <input
                id="duracion"
                type="number"
                min="1"
                required
                value={formulario.duracion}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    duracion: e.target.value,
                  })
                }
              />
            </div>

            {/* ESTADO */}

            <div className="servicios-campo">
              <label htmlFor="estado">
                Estado
              </label>

              <select
                id="estado"
                value={formulario.estado}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    estado: e.target.value as EstadoServicio,
                  })
                }
              >
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>

            {/* DESCRIPCIÓN */}

            <div className="servicios-campo servicios-campo-completo">
              <label htmlFor="descripcion">
                Descripción
              </label>

              <textarea
                id="descripcion"
                rows={3}
                value={formulario.descripcion}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    descripcion: e.target.value,
                  })
                }
                placeholder="Descripción del servicio veterinario"
              />
            </div>

          </div>

          {/* BOTONES DEL FORMULARIO */}

          <div className="servicios-form-acciones">

            <button
              type="submit"
              className="servicios-btn servicios-btn-primary"
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : editando !== null
                  ? "Actualizar servicio"
                  : "Registrar servicio"}
            </button>

            {editando !== null && (
              <button
                type="button"
                className="servicios-btn servicios-btn-secondary"
                onClick={limpiarFormulario}
              >
                Cancelar edición
              </button>
            )}

          </div>

        </form>
      </section>

      {/* TABLA DE SERVICIOS */}

      <section className="servicios-tabla-section">

        <div className="servicios-tabla-header">
          <h2>Servicios registrados</h2>

          <span className="servicios-total">
            Total: {servicios.length}
          </span>
        </div>

        {cargando ? (
          <div className="servicios-loading">
            Cargando servicios...
          </div>
        ) : servicios.length === 0 ? (
          <div className="servicios-vacio">
            <h3>No hay servicios registrados</h3>
            <p>
              Registra un servicio utilizando el formulario superior.
            </p>
          </div>
        ) : (
          <div className="servicios-tabla-contenedor">

            <table className="servicios-tabla">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Servicio</th>
                  <th>Descripción</th>
                  <th>Precio</th>
                  <th>Duración</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {servicios.map((servicio) => (
                  <tr key={servicio.id}>

                    <td>{servicio.id}</td>

                    <td>
                      <strong>{servicio.nombre}</strong>
                    </td>

                    <td>
                      {servicio.descripcion || "Sin descripción"}
                    </td>

                    <td>
                      S/ {Number(servicio.precio).toFixed(2)}
                    </td>

                    <td>
                      {servicio.duracion} min
                    </td>

                    <td>
                      <span
                        className={
                          servicio.estado === "ACTIVO"
                            ? "servicios-badge activo"
                            : "servicios-badge inactivo"
                        }
                      >
                        {servicio.estado === "ACTIVO"
                          ? "Activo"
                          : "Inactivo"}
                      </span>
                    </td>

                    <td>
                      <div className="servicios-acciones">

                        <button
                          type="button"
                          className="servicios-btn-editar"
                          onClick={() => editarServicio(servicio)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="servicios-btn-eliminar"
                          onClick={() => eliminarServicio(servicio.id)}
                        >
                          Eliminar
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

    </div>
  );
}

export default Servicios;
