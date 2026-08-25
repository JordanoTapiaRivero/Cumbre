import { useEffect, useState } from 'react'
import './Login.css'
import { supabase } from '../lib/supabaseClient'
import fondo from '../assets/fondo.jpg'

function Login({ onLogin }) {
  const [modoRegistro, setModoRegistro] = useState(false)

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
  const manejarAtras = () => {
    setModoRegistro(false)
    setError('')
    setNombre('')
    setEmail('')
    setPassword('')
    setConfirmarPassword('')
  }

  window.addEventListener('popstate', manejarAtras)

  return () => {
    window.removeEventListener('popstate', manejarAtras)
  }
}, [])

  const manejarLogin = async (e) => {
  e.preventDefault()
  setError('')

  if (!email.trim() || !password.trim()) {
    setError('Debes completar todos los campos.')
    return
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  })

  if (error) {
    setError('Correo o contraseña incorrectos.')
    return
  }

  onLogin(data.user)
}

  const manejarRegistro = async (e) => {
    e.preventDefault()
    setError('')

    if (
      !nombre.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmarPassword.trim()
    ) {
      setError('Debes completar todos los campos.')
      return
    }

    if (password !== confirmarPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 6) {
      setError(
        'La contraseña debe tener al menos 6 caracteres.'
      )
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          nombre: nombre.trim()
        }
      }
    })

    if (error) {
      setError(error.message)
      return
    }

    console.log('USUARIO CREADO:', data)

    if (data.session) {
      onLogin(data.user)
    } else {
      setError(
        'Cuenta creada. Revisa tu correo para confirmar tu cuenta.'
      )
    }
  }

 const cambiarModo = () => {
  if (!modoRegistro) {
    window.history.pushState(
      { registro: true },
      '',
      '#registro'
    )
    
    setModoRegistro(true)
  } else {
    window.history.back()
  }

  setError('')
  setNombre('')
  setEmail('')
  setPassword('')
  setConfirmarPassword('')
}

  return (
  <div
    className="login-page"
    style={{
      backgroundImage: `url(${fondo})`
    }}
  >
    <div className="login-overlay"></div>

    <div className="login-container">

      <div className="login-brand">
        <h1>Cumbre</h1>

        <div className="brand-divider"></div>

        <p>Organiza · Prioriza · Avanza</p>
      </div>

      <form
        className="login-card"
        onSubmit={
          modoRegistro
            ? manejarRegistro
            : manejarLogin
        }
      >
        <div className="login-header">
          <h2>
            {modoRegistro
              ? 'Crear cuenta'
              : 'Iniciar sesión'}
          </h2>

          <p>
            {modoRegistro
              ? 'Crea tu cuenta para comenzar a organizar tus tareas.'
              : 'Continúa organizando tus tareas.'}
          </p>
        </div>

        {modoRegistro && (
          <div className="login-field">
            <label htmlFor="nombre">
              Nombre
            </label>

            <input
              id="nombre"
              type="text"
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) =>
                setNombre(e.target.value)
              }
              required
            />
          </div>
        )}

        <div className="login-field">
          <label htmlFor="email">
            Correo electrónico
          </label>

          <input
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />
        </div>

        <div className="login-field">
          <label htmlFor="password">
            Contraseña
          </label>

          <input
            id="password"
            type="password"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />
        </div>

        {modoRegistro && (
          <div className="login-field">
            <label htmlFor="confirmarPassword">
              Confirmar contraseña
            </label>

            <input
              id="confirmarPassword"
              type="password"
              placeholder="Repite tu contraseña"
              value={confirmarPassword}
              onChange={(e) =>
                setConfirmarPassword(
                  e.target.value
                )
              }
              required
            />
          </div>
        )}

        {error && (
          <p className="login-error">
            {error}
          </p>
        )}

        <button
          className="login-button"
          type="submit"
        >
          {modoRegistro
            ? 'Crear cuenta'
            : 'Iniciar sesión'}
        </button>

        <div className="login-register">
          <span>
            {modoRegistro
              ? '¿Ya tienes una cuenta?'
              : '¿No tienes una cuenta?'}
          </span>

          <button
            type="button"
            className="register-link"
            onClick={cambiarModo}
          >
            {modoRegistro
              ? 'Iniciar sesión'
              : 'Crear cuenta'}
          </button>
        </div>
      </form>

      <p className="login-footer">
        Tu espacio personal para organizar tus tareas.
      </p>

    </div>
  </div>
)
}
export default Login