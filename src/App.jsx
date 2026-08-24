import { useEffect, useState } from 'react'
import './App.css'
import fondo from './assets/fondo.jpg'
import Login from './components/Login'
import { supabase } from './lib/supabaseClient'

function App() {
  const [usuario, setUsuario] = useState(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)

  const [tarea, setTarea] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const [tareas, setTareas] = useState(() => {
    const guardadas = localStorage.getItem('tareas')
    return guardadas ? JSON.parse(guardadas) : []
  })

  const [tareasRealizadas, setTareasRealizadas] = useState(() => {
    const guardadas = localStorage.getItem('tareasRealizadas')
    return guardadas ? JSON.parse(guardadas) : []
  })

  const [tareasEliminadas, setTareasEliminadas] = useState(() => {
    const guardadas = localStorage.getItem('tareasEliminadas')
    return guardadas ? JSON.parse(guardadas) : []
  })

  const [menuAbierto, setMenuAbierto] = useState(false)
  const [seccion, setSeccion] = useState('inicio')

  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('exito')

  const [prioridad, setPrioridad] = useState('')
  const [fechaLimite, setFechaLimite] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todas')

  const [menuTareaAbierto, setMenuTareaAbierto] = useState(null)

  const [tareaEditando, setTareaEditando] = useState(null)
  const [nombreEditado, setNombreEditado] = useState('')
  const [descripcionEditada, setDescripcionEditada] = useState('')
  const [prioridadEditada, setPrioridadEditada] = useState('media')
  const [fechaEditada, setFechaEditada] = useState('')

  useEffect(() => {
  const cargarSesion = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession()

    setUsuario(session?.user ?? null)
    setCargandoSesion(false)
  }

  cargarSesion()

  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUsuario(session?.user ?? null)
    }
  )

  return () => {
    subscription.unsubscribe()
  }
}, [])

  const [
    tareaRealizadaSeleccionada,
    setTareaRealizadaSeleccionada
  ] = useState(null)

  const [
    tareaEliminarDefinitivamente,
    setTareaEliminarDefinitivamente
  ] = useState(null)

  const [tareaSeleccionada, setTareaSeleccionada] = useState(null)
  const [tareaEliminar, setTareaEliminar] = useState(null)

  const [
    confirmarVaciarPapelera,
    setConfirmarVaciarPapelera
  ] = useState(false)

  const [, setFechaActual] = useState('')

  /* =========================
     FECHA DE HOY
  ========================= */

  const obtenerFechaHoy = () => {
    const hoy = new Date()

    const año = hoy.getFullYear()
    const mes = String(hoy.getMonth() + 1).padStart(2, '0')
    const dia = String(hoy.getDate()).padStart(2, '0')

    return `${año}-${mes}-${dia}`
  }

  /* =========================
     MENSAJES
  ========================= */

  const mostrarMensaje = (texto, tipo = 'exito') => {
    setTipoMensaje(tipo)
    setMensaje(texto)

    setTimeout(() => {
      setMensaje('')
    }, 3000)
  }

  /* =========================
     AGREGAR TAREA
  ========================= */

  const agregarTarea = () => {
    if (
      tarea.trim() === '' ||
      prioridad === '' ||
      fechaLimite === ''
    ) {
      mostrarMensaje(
        '⚠ Debes completar el nombre, la prioridad y la fecha.',
        'error'
      )

      return
    }

    const hoy = obtenerFechaHoy()

    if (fechaLimite < hoy) {
      mostrarMensaje(
        '⚠ Coloque una fecha correcta. No puede seleccionar una fecha anterior a hoy.',
        'error'
      )

      return
    }

    const nuevaTarea = {
      id: crypto.randomUUID(),
      nombre: tarea.trim(),
      descripcion: descripcion.trim(),
      completada: false,
      prioridad,
      fechaLimite,
      fechaCreacion: new Date().toISOString()
    }

    setTareas((anteriores) => [
      ...anteriores,
      nuevaTarea
    ])

    mostrarMensaje(
      `✓ ${tarea.trim()} ha sido agregada`
    )

    setTarea('')
    setDescripcion('')
    setPrioridad('')
    setFechaLimite('')
  }

  /* =========================
     COMPLETAR TAREA
  ========================= */

  const completarTarea = (id) => {
    const tareaCompletada = tareas.find(
      (item) => item.id === id
    )

    if (!tareaCompletada) {
      return
    }

    setTareas((anteriores) =>
      anteriores.map((item) =>
        item.id === id
          ? {
              ...item,
              completada: true
            }
          : item
      )
    )

    mostrarMensaje(
      `✓ ${tareaCompletada.nombre} ha sido completada`
    )

    setTimeout(() => {
      setTareasRealizadas((anteriores) => [
        ...anteriores,
        {
          ...tareaCompletada,
          completada: true,
          fechaCompletada: new Date().toISOString()
        }
      ])

      setTareas((anteriores) =>
        anteriores.filter(
          (item) => item.id !== id
        )
      )
    }, 3000)
  }

  /* =========================
     ORDENAR TAREAS
  ========================= */

  const ordenarTareas = (lista) => {
    const ordenPrioridad = {
      alta: 1,
      media: 2,
      baja: 3
    }

    return [...lista].sort(
      (a, b) =>
        ordenPrioridad[a.prioridad] -
        ordenPrioridad[b.prioridad]
    )
  }

  /* =========================
     NOMBRE PRIORIDAD
  ========================= */

  const obtenerNombrePrioridad = (prioridadTarea) => {
    const nombres = {
      baja: 'Prioridad baja',
      media: 'Prioridad media',
      alta: 'Prioridad alta'
    }

    return nombres[prioridadTarea] || ''
  }

  /* =========================
     ESTADO DE FECHA
  ========================= */

  const obtenerEstadoFecha = (fechaLimiteTarea) => {
    if (!fechaLimiteTarea) {
      return 'sin-fecha'
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const fecha = new Date(
      `${fechaLimiteTarea}T00:00:00`
    )

    const diferenciaMs = fecha - hoy

    const diferenciaDias = Math.round(
      diferenciaMs /
        (1000 * 60 * 60 * 24)
    )

    if (diferenciaDias < 0) {
      return 'vencida'
    }

    if (diferenciaDias === 0) {
      return 'hoy'
    }

    if (diferenciaDias <= 3) {
      return 'proxima'
    }

    return 'a-tiempo'
  }

  /* =========================
     TEXTO FECHA
  ========================= */

  const obtenerTextoFecha = (fecha) => {
    if (!fecha) {
      return ''
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const fechaTarea = new Date(
      `${fecha}T00:00:00`
    )

    const diferenciaDias = Math.round(
      (fechaTarea - hoy) /
        (1000 * 60 * 60 * 24)
    )

    if (diferenciaDias === 0) {
      return 'Vence hoy'
    }

    if (diferenciaDias === 1) {
      return 'Falta 1 día'
    }

    if (diferenciaDias > 1) {
      return `Faltan ${diferenciaDias} días`
    }

    if (diferenciaDias === -1) {
      return 'Vencida hace 1 día'
    }

    return `Vencida hace ${Math.abs(
      diferenciaDias
    )} días`
  }

  /* =========================
     FORMATEAR FECHA
  ========================= */

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return ''
    }

    return new Date(
      `${fecha}T00:00:00`
    ).toLocaleDateString('es-CL')
  }

  /* =========================
     FECHA CREACIÓN
  ========================= */

  const formatearFechaCreacion = (fecha) => {
    if (!fecha) {
      return 'No registrada'
    }

    return new Date(fecha).toLocaleDateString(
      'es-CL',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    )
  }

  /* =========================
     FECHA COMPLETADA
  ========================= */

  const obtenerTextoFechaCompletada = (
    fechaCompletada
  ) => {
    if (!fechaCompletada) {
      return ''
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const fecha = new Date(fechaCompletada)
    fecha.setHours(0, 0, 0, 0)

    const diferenciaDias = Math.round(
      (hoy - fecha) /
        (1000 * 60 * 60 * 24)
    )

    if (diferenciaDias === 0) {
      return 'Completada hoy'
    }

    if (diferenciaDias === 1) {
      return 'Completada ayer'
    }

    return `Completada hace ${diferenciaDias} días`
  }

  /* =========================
     FECHA ELIMINADA
  ========================= */

  const obtenerTextoFechaEliminada = (
    fechaEliminada
  ) => {
    if (!fechaEliminada) {
      return ''
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const fecha = new Date(fechaEliminada)
    fecha.setHours(0, 0, 0, 0)

    const diferenciaDias = Math.round(
      (hoy - fecha) /
        (1000 * 60 * 60 * 24)
    )

    if (diferenciaDias === 0) {
      return 'Eliminada hoy'
    }

    if (diferenciaDias === 1) {
      return 'Eliminada ayer'
    }

    return `Eliminada hace ${diferenciaDias} días`
  }

  /* =========================
     BUSCADOR
  ========================= */

  const filtrarTareas = (lista) => {
    return lista.filter((item) => {
      const nombre = item.nombre || ''
      const textoDescripcion =
        item.descripcion || ''

      const textoBusqueda =
        busqueda.toLowerCase()

      return (
        nombre
          .toLowerCase()
          .includes(textoBusqueda) ||
        textoDescripcion
          .toLowerCase()
          .includes(textoBusqueda)
      )
    })
  }

  /* =========================
     FILTROS
  ========================= */

  const aplicarFiltro = (lista) => {
    if (filtro === 'todas') {
      return lista
    }

    if (
      filtro === 'alta' ||
      filtro === 'media' ||
      filtro === 'baja'
    ) {
      return lista.filter(
        (item) =>
          item.prioridad === filtro
      )
    }

    if (filtro === 'vencidas') {
      return lista.filter(
        (item) =>
          obtenerEstadoFecha(
            item.fechaLimite
          ) === 'vencida'
      )
    }

    return lista
  }

  /* =========================
     EDITAR
  ========================= */

  const abrirEditarTarea = (item) => {
    setTareaEditando(item)

    setNombreEditado(item.nombre)

    setDescripcionEditada(
      item.descripcion || ''
    )

    setPrioridadEditada(
      item.prioridad
    )

    setFechaEditada(
      item.fechaLimite || ''
    )

    setMenuTareaAbierto(null)
  }

  const guardarEdicion = () => {
    if (!tareaEditando) {
      return
    }

    if (
      nombreEditado.trim() === '' ||
      prioridadEditada === '' ||
      fechaEditada === ''
    ) {
      mostrarMensaje(
        '⚠ Debes completar todos los campos obligatorios.',
        'error'
      )

      return
    }

    if (
      fechaEditada <
      obtenerFechaHoy()
    ) {
      mostrarMensaje(
        '⚠ Coloque una fecha correcta.',
        'error'
      )

      return
    }

    setTareas((anteriores) =>
      anteriores.map((item) =>
        item.id === tareaEditando.id
          ? {
              ...item,
              nombre:
                nombreEditado.trim(),
              descripcion:
                descripcionEditada.trim(),
              prioridad:
                prioridadEditada,
              fechaLimite:
                fechaEditada
            }
          : item
      )
    )

    setTareaEditando(null)

    mostrarMensaje(
      '✓ Tarea actualizada correctamente'
    )
  }

  /* =========================
     ELIMINAR
  ========================= */

  const abrirEliminarTarea = (item) => {
    setTareaEliminar(item)
    setMenuTareaAbierto(null)
  }

  const confirmarEliminar = () => {
    if (!tareaEliminar) {
      return
    }

    setTareas((anteriores) =>
      anteriores.filter(
        (item) =>
          item.id !== tareaEliminar.id
      )
    )

    setTareasEliminadas((anteriores) => [
      ...anteriores,
      {
        ...tareaEliminar,
        completada: false,
        fechaEliminada:
          new Date().toISOString()
      }
    ])

    mostrarMensaje(
      `✓ ${tareaEliminar.nombre} fue movida a la papelera`
    )

    setTareaEliminar(null)
  }

  /* =========================
     RESTAURAR
  ========================= */

  const restaurarTarea = (id) => {
    const tareaRestaurada =
      tareasEliminadas.find(
        (item) => item.id === id
      )

    if (!tareaRestaurada) {
      return
    }

    const {
      fechaEliminada,
      ...tareaSinFechaEliminada
    } = tareaRestaurada

    setTareas((anteriores) => [
      ...anteriores,
      tareaSinFechaEliminada
    ])

    setTareasEliminadas((anteriores) =>
      anteriores.filter(
        (item) => item.id !== id
      )
    )

    mostrarMensaje(
      `✓ ${tareaRestaurada.nombre} fue restaurada`
    )
  }

  /* =========================
     ELIMINAR DEFINITIVAMENTE
  ========================= */

  const eliminarDefinitivamente = (item) => {
    setTareaEliminarDefinitivamente(item)
  }

  const confirmarEliminarDefinitivamente =
    () => {
      if (
        !tareaEliminarDefinitivamente
      ) {
        return
      }

      setTareasEliminadas(
        (anteriores) =>
          anteriores.filter(
            (item) =>
              item.id !==
              tareaEliminarDefinitivamente.id
          )
      )

      mostrarMensaje(
        `✓ ${tareaEliminarDefinitivamente.nombre} fue eliminada definitivamente`
      )

      setTareaEliminarDefinitivamente(
        null
      )
    }

  /* =========================
     VACIAR PAPELERA
  ========================= */

  const vaciarPapelera = () => {
    setTareasEliminadas([])

    setConfirmarVaciarPapelera(
      false
    )

    mostrarMensaje(
      '✓ La papelera fue vaciada correctamente'
    )
  }

  /* =========================
     CERRAR MENÚ
  ========================= */

  useEffect(() => {
    const cerrarMenuTarea = (e) => {
      if (
        !e.target.closest(
          '.task-menu-container'
        )
      ) {
        setMenuTareaAbierto(null)
      }
    }

    document.addEventListener(
      'mousedown',
      cerrarMenuTarea
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        cerrarMenuTarea
      )
    }
  }, [])

  /* =========================
     CAMBIO DE DÍA
  ========================= */

  useEffect(() => {
    const programarCambioDeDia = () => {
      const ahora = new Date()

      const proximaMedianoche =
        new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate() + 1,
          0,
          0,
          0,
          0
        )

      const tiempoRestante =
        proximaMedianoche.getTime() -
        ahora.getTime()

      return setTimeout(() => {
        setFechaActual(
          obtenerFechaHoy()
        )

        programarCambioDeDia()
      }, tiempoRestante)
    }

    setFechaActual(
      obtenerFechaHoy()
    )

    const temporizador =
      programarCambioDeDia()

    return () => {
      clearTimeout(temporizador)
    }
  }, [])

  /* =========================
     LOCAL STORAGE
  ========================= */

  useEffect(() => {
    localStorage.setItem(
      'tareas',
      JSON.stringify(tareas)
    )
  }, [tareas])

  useEffect(() => {
    localStorage.setItem(
      'tareasRealizadas',
      JSON.stringify(
        tareasRealizadas
      )
    )
  }, [tareasRealizadas])

  useEffect(() => {
    localStorage.setItem(
      'tareasEliminadas',
      JSON.stringify(
        tareasEliminadas
      )
    )
  }, [tareasEliminadas])

  /* =========================
     DATOS DASHBOARD
  ========================= */

  const tareasVencidas =
    tareas.filter(
      (item) =>
        obtenerEstadoFecha(
          item.fechaLimite
        ) === 'vencida'
    ).length

  const tareasAltaPrioridad =
    tareas.filter(
      (item) =>
        item.prioridad === 'alta'
    ).length

  const totalTareas =
    tareas.length +
    tareasRealizadas.length

  const porcentajeCompletado =
    totalTareas === 0
      ? 0
      : Math.round(
          (
            tareasRealizadas.length /
            totalTareas
          ) * 100
        )

  const proximasTareas = [
    ...tareas
  ]
    .filter(
      (item) =>
        item.fechaLimite
    )
    .sort(
      (a, b) =>
        new Date(
          `${a.fechaLimite}T00:00:00`
        ) -
        new Date(
          `${b.fechaLimite}T00:00:00`
        )
    )
    .slice(0, 3)

  const tareasDeHoy =
    tareas.filter(
      (item) =>
        item.fechaLimite ===
        obtenerFechaHoy()
    )

  const tareasCompletadasHoy =
    tareasRealizadas.filter((item) => {
      if (!item.fechaCompletada) {
        return false
      }

      const fechaCompletada =
        new Date(
          item.fechaCompletada
        )

      const hoy = new Date()

      return (
        fechaCompletada.getFullYear() ===
          hoy.getFullYear() &&
        fechaCompletada.getMonth() ===
          hoy.getMonth() &&
        fechaCompletada.getDate() ===
          hoy.getDate()
      )
    }).length

    if (cargandoSesion) {
  return null
}

    if (!usuario) {
  return (
    <Login
      onLogin={setUsuario}
    />
  )
}

  return (
  <div
    className="app"
    style={{
      backgroundImage: `linear-gradient(
        rgba(255, 255, 255, 0.12),
        rgba(255, 255, 255, 0.12)
      ), url(${fondo})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    }}
  >

      {/* =========================
          MENSAJES
      ========================= */}

      {mensaje && (
        <div
          className={`toast toast-${tipoMensaje}`}
        >
          {mensaje}
        </div>
      )}

      {/* =========================
          HEADER
      ========================= */}

      <header className="header">

        <h1>
          Flujo de tareas
        </h1>

        <p>
          Gestiona tus tareas de forma simple.
        </p>

        <button
          className="menu-button"
          onClick={() =>
            setMenuAbierto(
              !menuAbierto
            )
          }
          aria-label="Abrir menú"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line
              x1="4"
              y1="6"
              x2="20"
              y2="6"
            />

            <line
              x1="4"
              y1="12"
              x2="20"
              y2="12"
            />

            <line
              x1="4"
              y1="18"
              x2="20"
              y2="18"
            />
          </svg>
        </button>

      </header>

      {/* =========================
          MENÚ
      ========================= */}

      <div
        className={`menu-overlay ${
          menuAbierto
            ? 'open'
            : ''
        }`}
      >

        <aside className="sidebar">

          <div className="sidebar-header">

            <h2>
              Menú
            </h2>

            <button
              className="close-menu"
              onClick={() =>
                setMenuAbierto(false)
              }
            >
              ✕
            </button>

          </div>

          <button
            className="sidebar-option"
            onClick={() => {
              setSeccion('inicio')
              setMenuAbierto(false)
            }}
          >
            🏠 Inicio
          </button>

          <button
            className="sidebar-option"
            onClick={() => {
              setSeccion('pendientes')
              setMenuAbierto(false)
            }}
          >
            📋 Mis tareas
          </button>

          <button
            className="sidebar-option"
            onClick={() => {
              setSeccion('realizadas')
              setMenuAbierto(false)
            }}
          >
            ✅ Tareas realizadas
          </button>

          <button
            className="sidebar-option"
            onClick={() => {
              setSeccion('papelera')
              setMenuAbierto(false)
            }}
          >
            🗑️ Papelera
          </button>

          <div className="sidebar-divider"></div>

<button
  className="sidebar-option sidebar-logout"
  onClick={async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error(
        'Error al cerrar sesión:',
        error.message
      )
      return
    }

    setUsuario(null)
    setMenuAbierto(false)
  }}
>
  🚪 Cerrar sesión
</button>

        </aside>

        <div
          className="overlay-background"
          onClick={() =>
            setMenuAbierto(false)
          }
        />

      </div>

      <main className="container">

        {/* =========================
            INICIO
        ========================= */}

        {seccion === 'inicio' && (
          <>

            {tareas.length === 0 &&
            tareasRealizadas.length === 0 ? (

              <section className="welcome-empty">

                <div className="welcome-icon">
                  👋
                </div>

                <h2>
                  Bienvenido a TaskFlow
                </h2>

                <p>
                  Parece que todavía no tienes
                  tareas. Crea tu primera tarea
                  y comienza a organizar tu día.
                </p>

                <button
                  className="welcome-button"
                  onClick={() =>
                    setSeccion('pendientes')
                  }
                >
                  + Crear primera tarea
                </button>

              </section>

            ) : (

              <section className="dashboard">

                <div className="dashboard-welcome">

                  <div>

                    <h2>
                      ¡Hola! 👋
                    </h2>

                    <p>
                      Aquí tienes un resumen
                      de tus tareas.
                    </p>

                  </div>

                  <div className="dashboard-actions">

                    <button
                      className="dashboard-primary"
                      onClick={() =>
                        setSeccion('pendientes')
                      }
                    >
                      + Nueva tarea
                    </button>

                    <button
                      className="dashboard-secondary"
                      onClick={() =>
                        setSeccion('pendientes')
                      }
                    >
                      Ver tareas
                    </button>

                  </div>

                </div>

                <h2 className="dashboard-section-title">
                  Resumen
                </h2>

                <div className="dashboard-grid">

                  <div className="dashboard-card dashboard-pendientes">

                    <div className="dashboard-icon-box">
                      📋
                    </div>

                    <span className="dashboard-number">
                      {tareas.length}
                    </span>

                    <span className="dashboard-title">
                      Tareas pendientes
                    </span>

                  </div>

                  <div className="dashboard-card dashboard-realizadas">

                    <div className="dashboard-icon-box">
                      ✅
                    </div>

                    <span className="dashboard-number">
                      {tareasRealizadas.length}
                    </span>

                    <span className="dashboard-title">
                      Tareas realizadas
                    </span>

                  </div>

                  <div className="dashboard-card dashboard-vencidas">

                    <div className="dashboard-icon-box">
                      ⏰
                    </div>

                    <span className="dashboard-number">
                      {tareasVencidas}
                    </span>

                    <span className="dashboard-title">
                      Tareas vencidas
                    </span>

                  </div>

                  <div className="dashboard-card dashboard-alta">

                    <div className="dashboard-icon-box">
                      🔥
                    </div>

                    <span className="dashboard-number">
                      {tareasAltaPrioridad}
                    </span>

                    <span className="dashboard-title">
                      Prioridad alta
                    </span>

                  </div>

                </div>

                {/* PROGRESO */}

                <div className="progress-section">

                  <div className="progress-header">

                    <span>
                      Progreso general
                    </span>

                    <span>
                      {porcentajeCompletado}%
                    </span>

                  </div>

                  <div className="progress-bar">

                    <div
                      className="progress-fill"
                      style={{
                        width:
                          `${porcentajeCompletado}%`
                      }}
                    />

                  </div>

                  <p>
                    {tareasRealizadas.length}{' '}
                    de {totalTareas} tareas completadas
                  </p>

                </div>

                {/* PARA HOY */}

                <div className="today-section">

                  <div className="today-header">

                    <div>

                      <h2>
                        Para hoy
                      </h2>

                      <p>
                        {tareasDeHoy.length === 0
                          ? 'No tienes tareas que venzan hoy.'
                          : `Tienes ${tareasDeHoy.length} ${
                              tareasDeHoy.length === 1
                                ? 'tarea'
                                : 'tareas'
                            } para hoy.`}
                      </p>

                    </div>

                    <div className="today-icon">
                      📅
                    </div>

                  </div>

                  {tareasDeHoy.length === 0 ? (

                    <div className="today-empty">

                      <span>
                        🎉
                      </span>

                      <div>

                        <strong>
                          Todo tranquilo por hoy
                        </strong>

                        <p>
                          No tienes tareas con
                          vencimiento para hoy.
                        </p>

                      </div>

                    </div>

                  ) : (

                    tareasDeHoy.map(
                      (item) => (

                        <div
                          className={`today-task today-${item.prioridad}`}
                          key={item.id}
                          onClick={() =>
                            setTareaSeleccionada(item)
                          }
                        >

                          <div className="today-task-info">

                            <span className="today-task-name">
                              {item.nombre}
                            </span>

                            <div className="today-task-details">

                              <span
                                className={`prioridad prioridad-${item.prioridad}`}
                              >
                                {obtenerNombrePrioridad(
                                  item.prioridad
                                )}
                              </span>

                              <span className="today-badge">
                                Vence hoy
                              </span>

                            </div>

                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setTareaSeleccionada(item)
                            }}
                          >
                            Ver tarea
                          </button>

                        </div>

                      )
                    )

                  )}

                </div>

                {/* PRÓXIMAS */}

                <div className="upcoming-section">

                  <div className="upcoming-header">

                    <h2>
                      Próximas tareas
                    </h2>

                    <button
                      onClick={() =>
                        setSeccion('pendientes')
                      }
                    >
                      Ver todas
                    </button>

                  </div>

                  {proximasTareas.length === 0 ? (

                    <p className="empty-message">
                      🎉 No tienes tareas pendientes.
                    </p>

                  ) : (

                    proximasTareas.map(
                      (item) => (

                        <div
                          className="upcoming-task"
                          key={item.id}
                          onClick={() =>
                            setTareaSeleccionada(item)
                          }
                        >

                          <div className="upcoming-info">

                            <span className="upcoming-name">
                              {item.nombre}
                            </span>

                            <div className="upcoming-details">

                              <span
                                className={`prioridad prioridad-${item.prioridad}`}
                              >
                                {obtenerNombrePrioridad(
                                  item.prioridad
                                )}
                              </span>

                              <div className="task-date-info">

                                <span
                                  className={`fecha-limite fecha-${obtenerEstadoFecha(
                                    item.fechaLimite
                                  )}`}
                                >
                                  📅{' '}
                                  {formatearFecha(
                                    item.fechaLimite
                                  )}
                                </span>

                                <span
                                  className={`fecha-texto texto-${obtenerEstadoFecha(
                                    item.fechaLimite
                                  )}`}
                                >
                                  {obtenerTextoFecha(
                                    item.fechaLimite
                                  )}
                                </span>

                              </div>

                            </div>

                          </div>

                          <button
                            className="upcoming-open"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTareaSeleccionada(item)
                            }}
                          >
                            Ver
                          </button>

                        </div>

                      )
                    )

                  )}

                </div>

              </section>

            )}

          </>
        )}

        {/* =========================
            MIS TAREAS
        ========================= */}

        {seccion === 'pendientes' && (
          <>

            <section className="task-form">

              <h2>
                Nueva tarea
              </h2>

              <div className="task-form-main">

                <input
                  type="text"
                  placeholder="Escribe una tarea..."
                  value={tarea}
                  onChange={(e) =>
                    setTarea(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      agregarTarea()
                    }
                  }}
                />

                {/* DESCRIPCIÓN NUEVA */}

                <textarea
                  className="task-description-input"
                  placeholder="Descripción opcional..."
                  value={descripcion}
                  onChange={(e) =>
                    setDescripcion(
                      e.target.value
                    )
                  }
                  maxLength={300}
                />

                <div className="task-description-footer">
                  <span>
                    Opcional
                  </span>

                  <span>
                    {descripcion.length}/300
                  </span>
                </div>

                <div className="task-form-row task-form-options">

                  <select
                    value={prioridad}
                    onChange={(e) =>
                      setPrioridad(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Selecciona prioridad
                    </option>

                    <option value="baja">
                      Baja
                    </option>

                    <option value="media">
                      Media
                    </option>

                    <option value="alta">
                      Alta
                    </option>
                  </select>

                  <input
                    type="date"
                    value={fechaLimite}
                    min={obtenerFechaHoy()}
                    onChange={(e) =>
                      setFechaLimite(
                        e.target.value
                      )
                    }
                  />

                  <button
                    onClick={agregarTarea}
                  >
                    Agregar tarea
                  </button>

                </div>

              </div>

            </section>

            <section className="task-list">

              <h2>
                Mis tareas
              </h2>

              {/* BUSCADOR */}

              <div className="search-container">

                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                  />

                  <line
                    x1="21"
                    y1="21"
                    x2="16.65"
                    y2="16.65"
                  />
                </svg>

                <input
                  type="text"
                  placeholder="Buscar tarea o descripción..."
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(
                      e.target.value
                    )
                  }
                />

              </div>

              {/* FILTROS */}

              <div className="filters">

                {[
                  ['todas', 'Todas'],
                  ['alta', 'Alta'],
                  ['media', 'Media'],
                  ['baja', 'Baja'],
                  ['vencidas', 'Vencidas']
                ].map(
                  ([valor, texto]) => (

                    <button
                      key={valor}
                      className={
                        filtro === valor
                          ? 'filter-button active'
                          : 'filter-button'
                      }
                      onClick={() =>
                        setFiltro(valor)
                      }
                    >
                      {texto}
                    </button>

                  )
                )}

              </div>

              {tareas.length === 0 ? (

                <p className="empty-message">
                  No tienes tareas pendientes.
                </p>

              ) : (

                ordenarTareas(
                  aplicarFiltro(
                    filtrarTareas(tareas)
                  )
                ).map((item) => (

                  <div
                    className={`task-card task-priority-${item.prioridad}`}
                    key={item.id}
                    onClick={() =>
                      setTareaSeleccionada(item)
                    }
                  >

                    <div className="task-info">

                      <span className="task-name">
                        {item.nombre}
                      </span>

                      <span
                        className={`prioridad prioridad-${item.prioridad}`}
                      >
                        {obtenerNombrePrioridad(
                          item.prioridad
                        )}
                      </span>

                      {item.fechaLimite && (

                        <span
                          className={`fecha-limite fecha-${obtenerEstadoFecha(
                            item.fechaLimite
                          )}`}
                        >
                          📅{' '}
                          {formatearFecha(
                            item.fechaLimite
                          )}
                        </span>

                      )}

                    </div>

                    <div className="task-actions">

                      <button
                        className={
                          item.completada
                            ? 'btn-completado'
                            : 'btn-completar'
                        }
                        onClick={(e) => {
                          e.stopPropagation()

                          completarTarea(
                            item.id
                          )
                        }}
                        disabled={
                          item.completada
                        }
                      >
                        {item.completada
                          ? 'Completado'
                          : 'Completar'}
                      </button>

                      <div className="task-menu-container">

                        <button
                          className="task-menu-button"
                          onClick={(e) => {
                            e.stopPropagation()

                            setMenuTareaAbierto(
                              menuTareaAbierto ===
                                item.id
                                ? null
                                : item.id
                            )
                          }}
                        >
                          ⋮
                        </button>

                        <div
                          className={`task-dropdown ${
                            menuTareaAbierto ===
                            item.id
                              ? 'open'
                              : ''
                          }`}
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                        >

                          <button
                            onClick={(e) => {
                              e.stopPropagation()

                              abrirEditarTarea(
                                item
                              )
                            }}
                          >
                            ✏️ Editar
                          </button>

                          <button
                            className="delete-option"
                            onClick={(e) => {
                              e.stopPropagation()

                              abrirEliminarTarea(
                                item
                              )
                            }}
                          >
                            🗑️ Eliminar
                          </button>

                        </div>

                      </div>

                    </div>

                  </div>

                ))

              )}

            </section>

          </>
        )}

        {/* =========================
            REALIZADAS
        ========================= */}

        {seccion === 'realizadas' && (

          <section className="task-list">

            <div className="completed-header">

              <div className="completed-header-icon">
                🎉
              </div>

              <div className="completed-header-info">

                <h2>
                  Buen trabajo 🔥
                </h2>

                <p>
                  Has completado{' '}
                  <strong>
                    {tareasRealizadas.length}
                  </strong>{' '}
                  {tareasRealizadas.length === 1
                    ? 'tarea en total'
                    : 'tareas en total'}
                </p>

                <span className="completed-today">
                  ✓ {tareasCompletadasHoy}{' '}
                  {tareasCompletadasHoy === 1
                    ? 'completada hoy'
                    : 'completadas hoy'}
                </span>

              </div>

            </div>

            <h2 className="completed-list-title">
              Historial
            </h2>

            {tareasRealizadas.length === 0 ? (

              <p className="empty-message">
                Aún no tienes tareas realizadas.
              </p>

            ) : (

              tareasRealizadas.map(
                (item) => (

                  <div
                    className="task-card task-completed task-completed-clickable"
                    key={item.id}
                    onClick={() =>
                      setTareaRealizadaSeleccionada(item)
                    }
                  >

                    <div className="task-info">

                      <span className="task-name">
                        {item.nombre}
                      </span>

                      <span
                        className={`prioridad prioridad-${item.prioridad}`}
                      >
                        {obtenerNombrePrioridad(
                          item.prioridad
                        )}
                      </span>

                      {item.fechaLimite && (

                        <span className="fecha-limite">
                          📅{' '}
                          {formatearFecha(
                            item.fechaLimite
                          )}
                        </span>

                      )}

                      {item.fechaCompletada && (

                        <span className="completed-date">
                          ✓{' '}
                          {obtenerTextoFechaCompletada(
                            item.fechaCompletada
                          )}
                        </span>

                      )}

                    </div>

                    <span
                      className="completed-label completed-label-static"
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                    >
                      Completado
                    </span>

                  </div>

                )
              )

            )}

          </section>

        )}

        {/* =========================
            PAPELERA
        ========================= */}

        {seccion === 'papelera' && (

          <section className="task-list">

            <div className="trash-header">

              <div>

                <h2>
                  Papelera
                </h2>

                <p>
                  Las tareas eliminadas permanecerán
                  aquí hasta que las elimines
                  definitivamente.
                </p>

              </div>

              {tareasEliminadas.length > 0 && (

                <button
                  className="btn-vaciar-papelera"
                  onClick={() =>
                    setConfirmarVaciarPapelera(
                      true
                    )
                  }
                >
                  🗑️ Vaciar papelera
                </button>

              )}

            </div>

            {tareasEliminadas.length === 0 ? (

              <p className="empty-message">
                No tienes tareas eliminadas.
              </p>

            ) : (

              tareasEliminadas.map(
                (item) => (

                  <div
                    className="task-card"
                    key={item.id}
                  >

                    <div className="task-info">

                      <span className="task-name">
                        {item.nombre}
                      </span>

                      <span
                        className={`prioridad prioridad-${item.prioridad}`}
                      >
                        {obtenerNombrePrioridad(
                          item.prioridad
                        )}
                      </span>

                      {item.fechaLimite && (

                        <span
                          className={`fecha-limite fecha-${obtenerEstadoFecha(
                            item.fechaLimite
                          )}`}
                        >
                          📅{' '}
                          {formatearFecha(
                            item.fechaLimite
                          )}
                        </span>

                      )}

                      <span className="deleted-date">
                        🗑️{' '}
                        {item.fechaEliminada
                          ? obtenerTextoFechaEliminada(
                              item.fechaEliminada
                            )
                          : 'Fecha de eliminación no registrada'}
                      </span>

                    </div>

                    <div className="trash-actions">

                      <button
                        className="btn-restaurar"
                        onClick={() =>
                          restaurarTarea(
                            item.id
                          )
                        }
                      >
                        Restaurar
                      </button>

                      <button
                        className="btn-eliminar-definitivo"
                        onClick={() =>
                          eliminarDefinitivamente(
                            item
                          )
                        }
                      >
                        Eliminar definitivamente
                      </button>

                    </div>

                  </div>

                )
              )

            )}

          </section>

        )}

      </main>

      {/* =========================
          MODAL DETALLE TAREA PENDIENTE
      ========================= */}

      {tareaSeleccionada && (

        <div
          className="modal-overlay"
          onClick={() =>
            setTareaSeleccionada(null)
          }
        >

          <div
            className="task-detail-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="task-detail-header">

              <div>

                <span className="task-detail-label">
                  Detalles de la tarea
                </span>

                <h2>
                  {tareaSeleccionada.nombre}
                </h2>

              </div>

              <button
                className="task-detail-close"
                onClick={() =>
                  setTareaSeleccionada(null)
                }
              >
                ✕
              </button>

            </div>

            {/* DESCRIPCIÓN */}

            <div className="task-detail-description">

              <div className="task-detail-description-header">

                <span>
                  📝
                </span>

                <strong>
                  Descripción
                </strong>

              </div>

              <p
                className={
                  tareaSeleccionada.descripcion
                    ? ''
                    : 'task-description-empty'
                }
              >
                {tareaSeleccionada.descripcion ||
                  'Sin descripción'}
              </p>

            </div>

            <div className="task-detail-grid">

              {/* PRIORIDAD */}

              <div className="task-detail-item">

                <span className="task-detail-icon">
                  🔥
                </span>

                <div>

                  <span className="task-detail-title">
                    Prioridad
                  </span>

                  <span
                    className={`prioridad prioridad-${tareaSeleccionada.prioridad}`}
                  >
                    {obtenerNombrePrioridad(
                      tareaSeleccionada.prioridad
                    )}
                  </span>

                </div>

              </div>

              {/* ESTADO */}

              <div className="task-detail-item">

                <span className="task-detail-icon">
                  📊
                </span>

                <div>

                  <span className="task-detail-title">
                    Estado
                  </span>

                  <span
                    className={`task-detail-status status-${obtenerEstadoFecha(
                      tareaSeleccionada.fechaLimite
                    )}`}
                  >
                    {obtenerEstadoFecha(
                      tareaSeleccionada.fechaLimite
                    ) === 'vencida'
                      ? 'Vencida'
                      : obtenerEstadoFecha(
                          tareaSeleccionada.fechaLimite
                        ) === 'hoy'
                      ? 'Vence hoy'
                      : obtenerEstadoFecha(
                          tareaSeleccionada.fechaLimite
                        ) === 'proxima'
                      ? 'Próxima'
                      : 'A tiempo'}
                  </span>

                </div>

              </div>

              {/* FECHA LÍMITE */}

              <div className="task-detail-item">

                <span className="task-detail-icon">
                  📅
                </span>

                <div>

                  <span className="task-detail-title">
                    Fecha límite
                  </span>

                  <strong>
                    {formatearFecha(
                      tareaSeleccionada.fechaLimite
                    )}
                  </strong>

                  <span
                    className={`task-detail-time texto-${obtenerEstadoFecha(
                      tareaSeleccionada.fechaLimite
                    )}`}
                  >
                    {obtenerTextoFecha(
                      tareaSeleccionada.fechaLimite
                    )}
                  </span>

                </div>

              </div>

              {/* CREACIÓN */}

              <div className="task-detail-item">

                <span className="task-detail-icon">
                  🕐
                </span>

                <div>

                  <span className="task-detail-title">
                    Creada
                  </span>

                  <strong>
                    {formatearFechaCreacion(
                      tareaSeleccionada.fechaCreacion
                    )}
                  </strong>

                </div>

              </div>

            </div>

            <div className="task-detail-actions">

              <button
                className="task-detail-complete"
                onClick={() => {
                  completarTarea(
                    tareaSeleccionada.id
                  )

                  setTareaSeleccionada(
                    null
                  )
                }}
              >
                ✓ Completar
              </button>

              <button
                className="task-detail-edit"
                onClick={() => {
                  abrirEditarTarea(
                    tareaSeleccionada
                  )

                  setTareaSeleccionada(
                    null
                  )
                }}
              >
                ✏️ Editar
              </button>

              <button
                className="task-detail-delete"
                onClick={() => {
                  abrirEliminarTarea(
                    tareaSeleccionada
                  )

                  setTareaSeleccionada(
                    null
                  )
                }}
              >
                🗑️ Eliminar
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =========================
          MODAL EDITAR
      ========================= */}

      {tareaEditando && (

        <div className="modal-overlay">

          <div className="modal">

            <h2>
              Editar tarea
            </h2>

            <label>
              Nombre
            </label>

            <input
              type="text"
              value={nombreEditado}
              onChange={(e) =>
                setNombreEditado(
                  e.target.value
                )
              }
            />

            <label>
              Descripción
              <span className="optional-label">
                {' '}(opcional)
              </span>
            </label>

            <textarea
              className="edit-description-input"
              value={descripcionEditada}
              placeholder="Agrega una descripción..."
              maxLength={300}
              onChange={(e) =>
                setDescripcionEditada(
                  e.target.value
                )
              }
            />

            <div className="edit-description-count">
              {descripcionEditada.length}/300
            </div>

            <label>
              Prioridad
            </label>

            <select
              value={prioridadEditada}
              onChange={(e) =>
                setPrioridadEditada(
                  e.target.value
                )
              }
            >
              <option value="baja">
                Baja
              </option>

              <option value="media">
                Media
              </option>

              <option value="alta">
                Alta
              </option>
            </select>

            <label>
              Fecha límite
            </label>

            <input
              type="date"
              value={fechaEditada}
              min={obtenerFechaHoy()}
              onChange={(e) =>
                setFechaEditada(
                  e.target.value
                )
              }
            />

            <div className="modal-actions">

              <button
                className="btn-cancelar"
                onClick={() =>
                  setTareaEditando(null)
                }
              >
                Cancelar
              </button>

              <button
                className="btn-guardar"
                onClick={guardarEdicion}
              >
                Guardar cambios
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =========================
          MODAL ELIMINAR
      ========================= */}

      {tareaEliminar && (

        <div className="modal-overlay">

          <div className="modal modal-delete">

            <div className="delete-icon">
              🗑️
            </div>

            <h2>
              Eliminar tarea
            </h2>

            <p>
              ¿Seguro que quieres eliminar{' '}
              <strong>
                "{tareaEliminar.nombre}"
              </strong>
              ?
            </p>

            <p className="delete-warning">
              La tarea será enviada a la papelera.
            </p>

            <div className="modal-actions">

              <button
                className="btn-cancelar"
                onClick={() =>
                  setTareaEliminar(null)
                }
              >
                Cancelar
              </button>

              <button
                className="btn-eliminar"
                onClick={confirmarEliminar}
              >
                Eliminar
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =========================
          MODAL ELIMINAR DEFINITIVAMENTE
      ========================= */}

      {tareaEliminarDefinitivamente && (

        <div className="modal-overlay">

          <div className="modal modal-delete">

            <div className="delete-icon">
              🗑️
            </div>

            <h2>
              Eliminar definitivamente
            </h2>

            <p>
              ¿Seguro que quieres eliminar{' '}
              <strong>
                "{tareaEliminarDefinitivamente.nombre}"
              </strong>
              ?
            </p>

            <p className="delete-warning">
              Esta acción no se puede deshacer.
            </p>

            <div className="modal-actions">

              <button
                className="btn-cancelar"
                onClick={() =>
                  setTareaEliminarDefinitivamente(
                    null
                  )
                }
              >
                Cancelar
              </button>

              <button
                className="btn-eliminar"
                onClick={
                  confirmarEliminarDefinitivamente
                }
              >
                Eliminar definitivamente
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =========================
          MODAL VACIAR PAPELERA
      ========================= */}

      {confirmarVaciarPapelera && (

        <div className="modal-overlay">

          <div className="modal modal-delete">

            <div className="delete-icon">
              🗑️
            </div>

            <h2>
              Vaciar papelera
            </h2>

            <p>
              ¿Seguro que quieres eliminar
              definitivamente{' '}
              <strong>
                {tareasEliminadas.length}{' '}
                {tareasEliminadas.length === 1
                  ? 'tarea'
                  : 'tareas'}
              </strong>
              ?
            </p>

            <p className="delete-warning">
              Esta acción no se puede deshacer.
            </p>

            <div className="modal-actions">

              <button
                className="btn-cancelar"
                onClick={() =>
                  setConfirmarVaciarPapelera(
                    false
                  )
                }
              >
                Cancelar
              </button>

              <button
                className="btn-eliminar"
                onClick={vaciarPapelera}
              >
                Vaciar papelera
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =========================
          MODAL DETALLE TAREA REALIZADA
      ========================= */}

      {tareaRealizadaSeleccionada && (

        <div
          className="modal-overlay"
          onClick={() =>
            setTareaRealizadaSeleccionada(
              null
            )
          }
        >

          <div
            className="task-detail-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="task-detail-header">

              <div>

                <span className="task-detail-label">
                  Tarea realizada
                </span>

                <h2>
                  {
                    tareaRealizadaSeleccionada.nombre
                  }
                </h2>

              </div>

              <button
                className="task-detail-close"
                onClick={() =>
                  setTareaRealizadaSeleccionada(
                    null
                  )
                }
              >
                ✕
              </button>

            </div>

            {/* DESCRIPCIÓN */}

            <div className="task-detail-description">

              <div className="task-detail-description-header">

                <span>
                  📝
                </span>

                <strong>
                  Descripción
                </strong>

              </div>

              <p
                className={
                  tareaRealizadaSeleccionada.descripcion
                    ? ''
                    : 'task-description-empty'
                }
              >
                {
                  tareaRealizadaSeleccionada.descripcion ||
                  'Sin descripción'
                }
              </p>

            </div>

            <div className="task-detail-grid">

              {/* PRIORIDAD */}

              <div className="task-detail-item">

                <span className="task-detail-icon">
                  🔥
                </span>

                <div>

                  <span className="task-detail-title">
                    Prioridad
                  </span>

                  <span
                    className={`prioridad prioridad-${tareaRealizadaSeleccionada.prioridad}`}
                  >
                    {obtenerNombrePrioridad(
                      tareaRealizadaSeleccionada.prioridad
                    )}
                  </span>

                </div>

              </div>

              {/* FECHA LÍMITE */}

              <div className="task-detail-item">

                <span className="task-detail-icon">
                  📅
                </span>

                <div>

                  <span className="task-detail-title">
                    Fecha límite
                  </span>

                  <strong>
                    {
                      tareaRealizadaSeleccionada.fechaLimite
                        ? formatearFecha(
                            tareaRealizadaSeleccionada.fechaLimite
                          )
                        : 'Sin fecha'
                    }
                  </strong>

                </div>

              </div>

              {/* FECHA CREACIÓN */}

              <div className="task-detail-item">

                <span className="task-detail-icon">
                  🕐
                </span>

                <div>

                  <span className="task-detail-title">
                    Creada
                  </span>

                  <strong>
                    {formatearFechaCreacion(
                      tareaRealizadaSeleccionada.fechaCreacion
                    )}
                  </strong>

                </div>

              </div>

              {/* COMPLETADA */}

              <div className="task-detail-item completed-detail-item">

                <span className="task-detail-icon">
                  ✅
                </span>

                <div>

                  <span className="task-detail-title">
                    Completada
                  </span>

                  <strong>
                    {
                      tareaRealizadaSeleccionada.fechaCompletada
                        ? formatearFechaCreacion(
                            tareaRealizadaSeleccionada.fechaCompletada
                          )
                        : 'Fecha no registrada'
                    }
                  </strong>

                  {
                    tareaRealizadaSeleccionada.fechaCompletada && (

                      <span className="completed-detail-relative">
                        {obtenerTextoFechaCompletada(
                          tareaRealizadaSeleccionada.fechaCompletada
                        )}
                      </span>

                    )
                  }

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default App