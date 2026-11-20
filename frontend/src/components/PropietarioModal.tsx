import { useState } from 'react'
import axios from 'axios'
import { X, UserPlus, Save } from 'lucide-react'

interface PropietarioModalProps {
  onClose: () => void
  onSuccess: () => void
}

interface FormularioPropietario {
  nombres: string
  apellidos: string
  dni: string
  telefono: string
  correo: string
  direccion: string
}

export default function PropietarioModal({
  onClose,
  onSuccess,
}: PropietarioModalProps) {
  const [formulario, setFormulario] = useState<FormularioPropietario>({
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    correo: '',
    direccion: '',
  })

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const actualizarCampo = (
    campo: keyof FormularioPropietario,
    valor: string
  ) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }))
  }

  const registrarPropietario = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()
    setError('')

    const nombres = formulario.nombres.trim()
    const apellidos = formulario.apellidos.trim()
    const dni = formulario.dni.trim()
    const telefono = formulario.telefono.trim()
    const correo = formulario.correo.trim()
    const direccion = formulario.direccion.trim()

    if (!nombres || !apellidos || !dni || !telefono) {
      setError('Completa todos los campos obligatorios.')
      return
    }

    if (!/^\d{8}$/.test(dni)) {
      setError('El DNI debe contener exactamente 8 números.')
      return
    }

    if (!/^\d{9}$/.test(telefono)) {
      setError('El teléfono debe contener 9 números.')
      return
    }

    if (
      correo &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
    ) {
      setError('Ingresa un correo electrónico válido.')
      return
    }

    try {
      setGuardando(true)

      const token = localStorage.getItem('token')

      if (!token) {
        setError('No existe una sesión activa.')
        return
      }

      await axios.post(
        'http://localhost:4000/api/propietarios',
        {
          nombres,
          apellidos,
          dni,
          telefono,
          correo: correo || null,
          direccion: direccion || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      onSuccess()
      onClose()
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.message ||
            'No se pudo registrar el propietario.'
        )
      } else {
        setError('Ocurrió un error inesperado.')
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="propietario-modal-overlay">
      <div
        className="propietario-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="propietario-modal-title"
      >
        <div className="propietario-modal-header">
          <div className="propietario-modal-title">
            <div className="propietario-modal-icon">
              <UserPlus size={22} />
            </div>

            <div>
              <h2 id="propietario-modal-title">
                Nuevo propietario
              </h2>
              <p>Registra un nuevo cliente de la clínica.</p>
            </div>
          </div>

          <button
            type="button"
            className="propietario-modal-close"
            onClick={onClose}
            disabled={guardando}
            aria-label="Cerrar formulario"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={registrarPropietario}>
          <div className="propietario-modal-body">
            <div className="propietario-form-grid">
              <div className="propietario-form-group">
                <label htmlFor="nombres">
                  Nombres <span>*</span>
                </label>

                <input
                  id="nombres"
                  value={formulario.nombres}
                  onChange={(e) =>
                    actualizarCampo('nombres', e.target.value)
                  }
                  placeholder="Ingrese los nombres"
                  maxLength={100}
                  required
                />
              </div>

              <div className="propietario-form-group">
                <label htmlFor="apellidos">
                  Apellidos <span>*</span>
                </label>

                <input
                  id="apellidos"
                  value={formulario.apellidos}
                  onChange={(e) =>
                    actualizarCampo('apellidos', e.target.value)
                  }
                  placeholder="Ingrese los apellidos"
                  maxLength={100}
                  required
                />
              </div>

              <div className="propietario-form-group">
                <label htmlFor="dni">
                  DNI <span>*</span>
                </label>

                <input
                  id="dni"
                  value={formulario.dni}
                  onChange={(e) =>
                    actualizarCampo(
                      'dni',
                      e.target.value.replace(/\D/g, '').slice(0, 8)
                    )
                  }
                  placeholder="8 dígitos"
                  inputMode="numeric"
                  maxLength={8}
                  required
                />
              </div>

              <div className="propietario-form-group">
                <label htmlFor="telefono">
                  Teléfono <span>*</span>
                </label>

                <input
                  id="telefono"
                  value={formulario.telefono}
                  onChange={(e) =>
                    actualizarCampo(
                      'telefono',
                      e.target.value.replace(/\D/g, '').slice(0, 9)
                    )
                  }
                  placeholder="9 dígitos"
                  inputMode="numeric"
                  maxLength={9}
                  required
                />
              </div>

              <div className="propietario-form-group propietario-form-full">
                <label htmlFor="correo">
                  Correo electrónico
                </label>

                <input
                  id="correo"
                  type="email"
                  value={formulario.correo}
                  onChange={(e) =>
                    actualizarCampo('correo', e.target.value)
                  }
                  placeholder="ejemplo@correo.com"
                  maxLength={150}
                />
              </div>

              <div className="propietario-form-group propietario-form-full">
                <label htmlFor="direccion">
                  Dirección
                </label>

                <input
                  id="direccion"
                  value={formulario.direccion}
                  onChange={(e) =>
                    actualizarCampo('direccion', e.target.value)
                  }
                  placeholder="Ingrese la dirección"
                  maxLength={250}
                />
              </div>
            </div>

            {error && (
              <div className="propietario-modal-error">
                {error}
              </div>
            )}
          </div>

          <div className="propietario-modal-footer">
            <button
              type="button"
              className="propietario-modal-cancel"
              onClick={onClose}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="propietario-modal-submit"
              disabled={guardando}
            >
              <Save size={17} />
              {guardando ? 'Guardando...' : 'Registrar propietario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
