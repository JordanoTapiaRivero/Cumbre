import { useEffect, useRef, useState } from 'react'
import './App.css'
import fondo from './assets/fondo.jpg'
import Login from './components/Login'
import { supabase } from './lib/supabaseClient'

function App() {
  const [usuario, setUsuario] = useState(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const formularioRef = useRef(null)
  const [splashActivo, setSplashActivo] = useState(true)

  const [tarea, setTarea] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const [tareas, setTareas] = useState([])
  const [tareasRealizadas, setTareasRealizadas] = useState([])
  const [tareasEliminadas, setTareasEliminadas] = useState([])

  const [menuAbierto, setMenuAbierto] = useState(false)
  const [seccion, setSeccion] = useState('inicio')

  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('exito')

  const [prioridad, setPrioridad] = useState('')
  const [fechaLimite, setFechaLimite] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [busquedaRealizadas, setBusquedaRealizadas] = useState('')

  const [paginaPendientes, setPaginaPendientes] = useState(1)
  const [paginaRealizadas, setPaginaRealizadas] = useState(1)
  const [paginaPapelera, setPaginaPapelera] = useState(1)

  const [menuTareaAbierto, setMenuTareaAbierto] = useState(null)

  const [tareaEditando, setTareaEditando] = useState(null)
  const [nombreEditado, setNombreEditado] = useState('')
  const [descripcionEditada, setDescripcionEditada] = useState('')
  const [prioridadEditada, setPrioridadEditada] = useState('media')
  const [fechaEditada, setFechaEditada] = useState('')

  useEffect(() => {
  const timerSplash = setTimeout(() => {
    setSplashActivo(false)
  }, 1200)

  return () => clearTimeout(timerSplash)
}, [])

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
useEffect(() => {
  if (!usuario) {
    setTareas([])
    setTareasRealizadas([])
    setTareasEliminadas([])
    return
  }
  const cargarTareas = async () => {
    const { data, error } = await supabase
      .from('Tareas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(
        'Error al cargar tareas:',
        error.message
      )
      return
    }

    const tareasFormateadas = data.map((item) => ({
      id: item.id,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      prioridad: item.prioridad,
      fechaLimite: item.fecha_limite,
      completada: item.estado === 'realizada',
      fechaCreacion: item.created_at,
      fechaCompletada: item.fecha_completada,
      fechaEliminada: item.fecha_eliminada
    }))

    setTareas(
      tareasFormateadas.filter(
        (_, index) => data[index].estado === 'pendiente'
      )
    )

    setTareasRealizadas(
      tareasFormateadas.filter(
        (_, index) => data[index].estado === 'realizada'
      )
    )

    setTareasEliminadas(
      tareasFormateadas.filter(
        (_, index) => data[index].estado === 'eliminada'
      )
    )
  }

  cargarTareas()
}, [usuario])

  const irACrearTarea = () => {
    setSeccion('pendientes')

    setTimeout(() => {
      formularioRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }, 100)
  }

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

  const [confirmarCerrarSesion, setConfirmarCerrarSesion] = useState(false)
  const [mostrarAvisoNotificaciones, setMostrarAvisoNotificaciones] = useState(false)
  const [activandoNotificaciones, setActivandoNotificaciones] = useState(false)

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
const agregarTarea = async () => {
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

  if (!usuario) {
    mostrarMensaje(
      '⚠ No hay un usuario conectado.',
      'error'
    )
    return
  }

  const { data, error } = await supabase
    .from('Tareas')
    .insert([
      {
        user_id: usuario.id,
        nombre: tarea.trim(),
        descripcion: descripcion.trim(),
        prioridad,
        fecha_limite: fechaLimite,
        estado: 'pendiente'
      }
    ])
    .select()
    .single()

  if (error) {
    console.error(
      'Error al crear tarea:',
      error.message
    )

    mostrarMensaje(
      '⚠ No se pudo crear la tarea.',
      'error'
    )

    return
  }

  const nuevaTarea = {
    id: data.id,
    nombre: data.nombre,
    descripcion: data.descripcion || '',
    completada: false,
    prioridad: data.prioridad,
    fechaLimite: data.fecha_limite,
    fechaCreacion: data.created_at,
    fechaCompletada: data.fecha_completada,
    fechaEliminada: data.fecha_eliminada
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

const completarTarea = async (id) => {
  const tareaCompletada = tareas.find(
    (item) => item.id === id
  )

  if (!tareaCompletada) {
    return
  }

  const fechaCompletada =
    new Date().toISOString()

  /* =========================
     ACTUALIZAR EN SUPABASE
  ========================= */

  const { error } = await supabase
    .from('Tareas')
    .update({
      estado: 'realizada',
      fecha_completada: fechaCompletada
    })
    .eq('id', id)

  if (error) {
    console.error(
      'Error al completar tarea:',
      error.message
    )

    mostrarMensaje(
      '⚠ No se pudo completar la tarea.',
      'error'
    )

    return
  }

  /* =========================
     ENVIAR CORREO
  ========================= */

  if (usuario?.email) {
  try {

    const { error: errorCorreo } =
      await supabase.functions.invoke(
        'enviar-correo-tarea',
        {
          body: {
            email: usuario.email,
            nombreTarea:
              tareaCompletada.nombre
          }
        }
      )

    if (errorCorreo) {
      console.error(
        'Error al enviar correo:',
        errorCorreo
      )
    }

  } catch (errorCorreo) {
    console.error(
      'Error inesperado al enviar correo:',
      errorCorreo
    )
  }
}
  /* =========================
     ACTUALIZAR INTERFAZ
  ========================= */

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
        fechaCompletada
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

  const guardarEdicion = async () => {
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

  if (fechaEditada < obtenerFechaHoy()) {
    mostrarMensaje(
      '⚠ Coloque una fecha correcta.',
      'error'
    )

    return
  }

  const { error } = await supabase
    .from('Tareas')
    .update({
      nombre: nombreEditado.trim(),
      descripcion: descripcionEditada.trim(),
      prioridad: prioridadEditada,
      fecha_limite: fechaEditada
    })
    .eq('id', tareaEditando.id)

  if (error) {
    console.error(
      'Error al editar tarea:',
      error.message
    )

    mostrarMensaje(
      '⚠ No se pudo actualizar la tarea.',
      'error'
    )

    return
  }

  setTareas((anteriores) =>
    anteriores.map((item) =>
      item.id === tareaEditando.id
        ? {
            ...item,
            nombre: nombreEditado.trim(),
            descripcion: descripcionEditada.trim(),
            prioridad: prioridadEditada,
            fechaLimite: fechaEditada
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

 const confirmarEliminar = async () => {
  if (!tareaEliminar) {
    return
  }

  const fechaEliminada =
    new Date().toISOString()

  const { error } = await supabase
    .from('Tareas')
    .update({
      estado: 'eliminada',
      fecha_eliminada: fechaEliminada
    })
    .eq('id', tareaEliminar.id)

  if (error) {
    console.error(
      'Error al mover tarea a papelera:',
      error.message
    )

    mostrarMensaje(
      '⚠ No se pudo mover la tarea a la papelera.',
      'error'
    )

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
      fechaEliminada
    }
  ])

  mostrarMensaje(
    `✓ ${tareaEliminar.nombre} fue movida a la papelera`
  )

  setTareaEliminar(null)
}
/* =========================
   RESTAURAR TAREA
========================= */

const restaurarTarea = async (id) => {
  const tareaRestaurada = tareasEliminadas.find(
    (item) => item.id === id
  )

  if (!tareaRestaurada) {
    return
  }

  const { error } = await supabase
    .from('Tareas')
    .update({
      estado: 'pendiente',
      fecha_eliminada: null
    })
    .eq('id', id)

  if (error) {
    console.error(
      'Error al restaurar tarea:',
      error.message
    )

    mostrarMensaje(
      '⚠ No se pudo restaurar la tarea.',
      'error'
    )

    return
  }

  setTareasEliminadas((anteriores) =>
    anteriores.filter(
      (item) => item.id !== id
    )
  )

  setTareas((anteriores) => [
    ...anteriores,
    {
      ...tareaRestaurada,
      completada: false,
      fechaEliminada: null
    }
  ])

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

  const confirmarEliminarDefinitivamente = async () => {
  if (!tareaEliminarDefinitivamente) {
    return
  }

  const { error } = await supabase
    .from('Tareas')
    .delete()
    .eq('id', tareaEliminarDefinitivamente.id)

  if (error) {
    console.error(
      'Error al eliminar definitivamente:',
      error.message
    )

    mostrarMensaje(
      '⚠ No se pudo eliminar la tarea definitivamente.',
      'error'
    )

    return
  }

  setTareasEliminadas((anteriores) =>
    anteriores.filter(
      (item) =>
        item.id !==
        tareaEliminarDefinitivamente.id
    )
  )

  mostrarMensaje(
    `✓ ${tareaEliminarDefinitivamente.nombre} fue eliminada definitivamente`
  )

  setTareaEliminarDefinitivamente(null)
}
/* =========================
   VACIAR PAPELERA
========================= */

const vaciarPapelera = async () => {
  if (tareasEliminadas.length === 0) {
    setConfirmarVaciarPapelera(false)
    return
  }

  const idsEliminados = tareasEliminadas.map(
    (item) => item.id
  )

  const { error } = await supabase
    .from('Tareas')
    .delete()
    .in('id', idsEliminados)

  if (error) {
    console.error(
      'Error al vaciar papelera:',
      error.message
    )

    mostrarMensaje(
      '⚠ No se pudo vaciar la papelera.',
      'error'
    )

    return
  }

  setTareasEliminadas([])
  setConfirmarVaciarPapelera(false)

  mostrarMensaje(
    '✓ La papelera fue vaciada correctamente'
  )
}

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


  /* =========================
     OBJETIVO DIARIO + RACHAS
  ========================= */

  const OBJETIVO_DIARIO = 3

  const obtenerClaveFechaLocal = (fecha) => {
    const fechaObjeto =
      fecha instanceof Date
        ? fecha
        : new Date(fecha)

    const año = fechaObjeto.getFullYear()
    const mes = String(
      fechaObjeto.getMonth() + 1
    ).padStart(2, '0')
    const dia = String(
      fechaObjeto.getDate()
    ).padStart(2, '0')

    return `${año}-${mes}-${dia}`
  }

  const completadasPorDia =
    tareasRealizadas.reduce(
      (acumulador, item) => {
        if (!item.fechaCompletada) {
          return acumulador
        }

        const clave =
          obtenerClaveFechaLocal(
            item.fechaCompletada
          )

        acumulador[clave] =
          (acumulador[clave] || 0) + 1

        return acumulador
      },
      {}
    )

  const hoyObjetivo = new Date()
  const claveHoy =
    obtenerClaveFechaLocal(
      hoyObjetivo
    )

  const completadasObjetivoHoy =
    completadasPorDia[claveHoy] || 0

  const porcentajeObjetivoHoy =
    Math.min(
      100,
      Math.round(
        (
          completadasObjetivoHoy /
          OBJETIVO_DIARIO
        ) * 100
      )
    )

  const tareasFaltantesObjetivo =
    Math.max(
      0,
      OBJETIVO_DIARIO -
        completadasObjetivoHoy
    )

  const diasObjetivoCumplido =
    new Set(
      Object.entries(
        completadasPorDia
      )
        .filter(
          ([, cantidad]) =>
            cantidad >= OBJETIVO_DIARIO
        )
        .map(([fecha]) => fecha)
    )

  const calcularRachaActual = () => {
    let fechaCursor = new Date()
    let racha = 0

    const hoyCumplido =
      diasObjetivoCumplido.has(
        obtenerClaveFechaLocal(
          fechaCursor
        )
      )

    if (!hoyCumplido) {
      fechaCursor.setDate(
        fechaCursor.getDate() - 1
      )
    }

    while (
      diasObjetivoCumplido.has(
        obtenerClaveFechaLocal(
          fechaCursor
        )
      )
    ) {
      racha += 1

      fechaCursor.setDate(
        fechaCursor.getDate() - 1
      )
    }

    return racha
  }

  const calcularMejorRacha = () => {
    const fechasCumplidas =
      Array.from(
        diasObjetivoCumplido
      ).sort()

    if (
      fechasCumplidas.length === 0
    ) {
      return 0
    }

    let mejorRacha = 1
    let rachaTemporal = 1

    for (
      let i = 1;
      i < fechasCumplidas.length;
      i += 1
    ) {
      const fechaAnterior =
        new Date(
          `${fechasCumplidas[i - 1]}T12:00:00`
        )

      const fechaActual =
        new Date(
          `${fechasCumplidas[i]}T12:00:00`
        )

      const diferenciaDias =
        Math.round(
          (
            fechaActual -
            fechaAnterior
          ) /
            (1000 * 60 * 60 * 24)
        )

      if (diferenciaDias === 1) {
        rachaTemporal += 1
      } else {
        rachaTemporal = 1
      }

      mejorRacha =
        Math.max(
          mejorRacha,
          rachaTemporal
        )
    }

    return mejorRacha
  }

  const rachaActual =
    calcularRachaActual()

  const mejorRacha =
    calcularMejorRacha()

  const inicioSemana = new Date()
  const diaSemana =
    inicioSemana.getDay()

  const diferenciaLunes =
    diaSemana === 0
      ? -6
      : 1 - diaSemana

  inicioSemana.setDate(
    inicioSemana.getDate() +
      diferenciaLunes
  )

  inicioSemana.setHours(
    0,
    0,
    0,
    0
  )

  const diasSemanaObjetivo =
    Array.from(
      { length: 7 },
      (_, index) => {
        const fecha =
          new Date(inicioSemana)

        fecha.setDate(
          inicioSemana.getDate() +
            index
        )

        const clave =
          obtenerClaveFechaLocal(
            fecha
          )

        const cantidad =
          completadasPorDia[
            clave
          ] || 0

        const hoy =
          obtenerClaveFechaLocal(
            new Date()
          )

        return {
          clave,
          letra:
            [
              'L',
              'M',
              'X',
              'J',
              'V',
              'S',
              'D'
            ][index],
          cantidad,
          cumplido:
            cantidad >=
            OBJETIVO_DIARIO,
          esHoy:
            clave === hoy,
          esFuturo:
            fecha >
            new Date(
              new Date().setHours(
                23,
                59,
                59,
                999
              )
            )
        }
      }
    )


  /* =========================
     PAGINACIÓN
  ========================= */

  const TAREAS_POR_PAGINA = 10

  const tareasPendientesFiltradas =
    ordenarTareas(
      aplicarFiltro(
        filtrarTareas(tareas)
      )
    )

  const tareasRealizadasFiltradas =
    tareasRealizadas.filter((item) => {
      const textoBusqueda =
        busquedaRealizadas
          .trim()
          .toLowerCase()

      if (textoBusqueda === '') {
        return true
      }

      return (
        (item.nombre || '')
          .toLowerCase()
          .includes(textoBusqueda) ||
        (item.descripcion || '')
          .toLowerCase()
          .includes(textoBusqueda)
      )
    })

  const totalPaginasPendientes =
    Math.max(
      1,
      Math.ceil(
        tareasPendientesFiltradas.length /
          TAREAS_POR_PAGINA
      )
    )

  const totalPaginasRealizadas =
    Math.max(
      1,
      Math.ceil(
        tareasRealizadasFiltradas.length /
          TAREAS_POR_PAGINA
      )
    )

  const totalPaginasPapelera =
    Math.max(
      1,
      Math.ceil(
        tareasEliminadas.length /
          TAREAS_POR_PAGINA
      )
    )

  const tareasPendientesPaginadas =
    tareasPendientesFiltradas.slice(
      (paginaPendientes - 1) *
        TAREAS_POR_PAGINA,
      paginaPendientes *
        TAREAS_POR_PAGINA
    )

  const tareasRealizadasPaginadas =
    tareasRealizadasFiltradas.slice(
      (paginaRealizadas - 1) *
        TAREAS_POR_PAGINA,
      paginaRealizadas *
        TAREAS_POR_PAGINA
    )

  const tareasPapeleraPaginadas =
    tareasEliminadas.slice(
      (paginaPapelera - 1) *
        TAREAS_POR_PAGINA,
      paginaPapelera *
        TAREAS_POR_PAGINA
    )

  useEffect(() => {
    setPaginaPendientes(1)
  }, [busqueda, filtro])

  useEffect(() => {
    setPaginaRealizadas(1)
  }, [busquedaRealizadas])

  useEffect(() => {
    setPaginaPendientes(
      (paginaActual) =>
        Math.min(
          paginaActual,
          totalPaginasPendientes
        )
    )
  }, [totalPaginasPendientes])

  useEffect(() => {
    setPaginaRealizadas(
      (paginaActual) =>
        Math.min(
          paginaActual,
          totalPaginasRealizadas
        )
    )
  }, [totalPaginasRealizadas])

  useEffect(() => {
    setPaginaPapelera(
      (paginaActual) =>
        Math.min(
          paginaActual,
          totalPaginasPapelera
        )
    )
  }, [totalPaginasPapelera])

  const obtenerPaginasVisibles = (
    paginaActual,
    totalPaginas
  ) => {
    if (totalPaginas <= 7) {
      return Array.from(
        { length: totalPaginas },
        (_, index) => index + 1
      )
    }

    if (paginaActual <= 4) {
      return [
        1,
        2,
        3,
        4,
        5,
        '...',
        totalPaginas
      ]
    }

    if (
      paginaActual >=
      totalPaginas - 3
    ) {
      return [
        1,
        '...',
        totalPaginas - 4,
        totalPaginas - 3,
        totalPaginas - 2,
        totalPaginas - 1,
        totalPaginas
      ]
    }

    return [
      1,
      '...',
      paginaActual - 1,
      paginaActual,
      paginaActual + 1,
      '...',
      totalPaginas
    ]
  }

  /* =========================
     NOTIFICACIONES PUSH
  ========================= */

  const convertirClaveVapid = (claveBase64) => {
    const relleno = '='.repeat((4 - (claveBase64.length % 4)) % 4)
    const base64 = (claveBase64 + relleno)
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    const datosCrudos = window.atob(base64)
    const salida = new Uint8Array(datosCrudos.length)

    for (let i = 0; i < datosCrudos.length; i += 1) {
      salida[i] = datosCrudos.charCodeAt(i)
    }

    return salida
  }

  const guardarSuscripcionPush = async (suscripcion) => {
    if (!usuario) throw new Error('No hay un usuario conectado.')

    const datos = suscripcion.toJSON()
    const endpoint = datos.endpoint
    const p256dh = datos.keys?.p256dh
    const auth = datos.keys?.auth

    if (!endpoint || !p256dh || !auth) {
      throw new Error('La suscripción Push está incompleta.')
    }

    const { data: existente, error: errorBusqueda } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', endpoint)
      .maybeSingle()

    if (errorBusqueda) throw errorBusqueda

    if (existente) {
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ user_id: usuario.id, p256dh, auth })
        .eq('id', existente.id)

      if (error) throw error
      return
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .insert([{ user_id: usuario.id, endpoint, p256dh, auth }])

    if (error) throw error
  }

  const registrarSuscripcionPush = async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('El navegador no admite Service Worker.')
    }

    const clavePublica = import.meta.env.VITE_VAPID_PUBLIC_KEY

    if (!clavePublica) {
      throw new Error('Falta VITE_VAPID_PUBLIC_KEY en las variables de entorno.')
    }

    const registro = await navigator.serviceWorker.ready
    let suscripcion = await registro.pushManager.getSubscription()

    if (!suscripcion) {
      suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertirClaveVapid(clavePublica)
      })
    }

    await guardarSuscripcionPush(suscripcion)
    return registro
  }

  const activarNotificaciones = async () => {
    if (activandoNotificaciones) return

    try {
      setActivandoNotificaciones(true)

      if (!('Notification' in window)) {
        mostrarMensaje('⚠ Este dispositivo no admite notificaciones.', 'error')
        return
      }

      const permiso = await Notification.requestPermission()

      if (permiso !== 'granted') {
        setMostrarAvisoNotificaciones(false)
        mostrarMensaje('⚠ Las notificaciones no fueron autorizadas.', 'error')
        return
      }

      const registro = await registrarSuscripcionPush()

      localStorage.removeItem('cumbre-notificaciones-pospuestas')
      setMostrarAvisoNotificaciones(false)

      await registro.showNotification('Cumbre 🏔️', {
        body: '¡Listo! Recibirás recordatorios de tus tareas y tu racha.',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png'
      })

      mostrarMensaje('✓ Notificaciones activadas correctamente')
    } catch (error) {
      console.error('Error al activar notificaciones:', error)
      mostrarMensaje('⚠ No se pudieron activar las notificaciones.', 'error')
    } finally {
      setActivandoNotificaciones(false)
    }
  }

  const posponerNotificaciones = () => {
    localStorage.setItem('cumbre-notificaciones-pospuestas', String(Date.now()))
    setMostrarAvisoNotificaciones(false)
  }

  useEffect(() => {
    if (!usuario || cargandoSesion) return

    if (!('Notification' in window) || !('serviceWorker' in navigator)) return

    let timer

    const prepararNotificaciones = async () => {
      if (Notification.permission === 'granted') {
        try {
          await registrarSuscripcionPush()
        } catch (error) {
          console.error('Error al registrar suscripción Push existente:', error)
        }
        return
      }

      if (Notification.permission === 'denied') return

      const ultimaPosposicion = Number(
        localStorage.getItem('cumbre-notificaciones-pospuestas') || 0
      )
      const sieteDias = 7 * 24 * 60 * 60 * 1000

      if (ultimaPosposicion && Date.now() - ultimaPosposicion < sieteDias) return

      timer = setTimeout(() => {
        setMostrarAvisoNotificaciones(true)
      }, 700)
    }

    prepararNotificaciones()

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [usuario, cargandoSesion])

  const renderPaginacion = (
    paginaActual,
    totalPaginas,
    cambiarPagina
  ) => {
    if (totalPaginas <= 1) {
      return null
    }

    const paginas =
      obtenerPaginasVisibles(
        paginaActual,
        totalPaginas
      )

    return (
      <nav
        className="pagination"
        aria-label="Paginación"
      >

        <button
          type="button"
          className="pagination-arrow"
          onClick={() =>
            cambiarPagina(
              paginaActual - 1
            )
          }
          disabled={
            paginaActual === 1
          }
          aria-label="Página anterior"
        >
          ‹
        </button>

        <div className="pagination-pages">

          {paginas.map(
            (pagina, index) =>
              pagina === '...' ? (

                <span
                  className="pagination-dots"
                  key={`dots-${index}`}
                >
                  …
                </span>

              ) : (

                <button
                  type="button"
                  key={pagina}
                  className={
                    pagina ===
                    paginaActual
                      ? 'pagination-number active'
                      : 'pagination-number'
                  }
                  onClick={() =>
                    cambiarPagina(
                      pagina
                    )
                  }
                  aria-current={
                    pagina ===
                    paginaActual
                      ? 'page'
                      : undefined
                  }
                >
                  {pagina}
                </button>

              )
          )}

        </div>

        <button
          type="button"
          className="pagination-arrow"
          onClick={() =>
            cambiarPagina(
              paginaActual + 1
            )
          }
          disabled={
            paginaActual ===
            totalPaginas
          }
          aria-label="Página siguiente"
        >
          ›
        </button>

      </nav>
    )
  }

    if (splashActivo || cargandoSesion) {
  return (
    <div className="cumbre-loading-screen">
      <div className="cumbre-loading-content">
        <div className="cumbre-loading-logo" aria-hidden="true">
          <svg viewBox="0 0 64 48">
            <path
              className="cumbre-loading-mountain-back"
              d="M2 43 L22 15 L34 31 L42 21 L62 43 Z"
            />
            <path
              className="cumbre-loading-mountain-front"
              d="M14 43 L38 7 L62 43 Z"
            />
            <path
              className="cumbre-loading-snow"
              d="M38 7 L29 21 L36 18 L40 24 L45 18 Z"
            />
          </svg>
        </div>

        <strong>Cumbre</strong>
        <span>Preparando tu espacio...</span>

        <div className="cumbre-loading-bar" aria-label="Cargando">
          <div className="cumbre-loading-bar-fill" />
        </div>
      </div>
    </div>
  )
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

  <div className="header-left">

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

    <div className="header-brand">

  <div className="cumbre-logo">
    <svg
      viewBox="0 0 64 48"
      aria-hidden="true"
    >
      <path
        className="mountain-back"
        d="M2 43 L22 15 L34 31 L42 21 L62 43 Z"
      />

      <path
        className="mountain-front"
        d="M14 43 L38 7 L62 43 Z"
      />

      <path
        className="mountain-snow"
        d="M38 7 L29 21 L36 18 L40 24 L45 18 Z"
      />
    </svg>
  </div>

  <div className="header-text">
    <h1>Cumbre</h1>
    <p>
      Gestiona tus tareas de forma simple.
    </p>
  </div>

</div>

  </div>

  <div className="header-user">
    <span>
      Bienvenido, {usuario?.user_metadata?.nombre || 'Usuario'}
    </span>

    <span className="header-user-icon">
      👤
    </span>
  </div>

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

          <div className="sidebar-brand">

            <div className="sidebar-brand-logo">
              <svg viewBox="0 0 64 48" aria-hidden="true">
                <path
                  className="sidebar-brand-mountain-back"
                  d="M2 43 L20 23 L29 32 L39 17 L62 43 Z"
                />
                <path
                  className="sidebar-brand-mountain-front"
                  d="M18 43 L39 10 L63 43 Z"
                />
                <path
                  className="sidebar-brand-snow"
                  d="M39 10 L33 20 L38 18 L41 23 L46 17 Z"
                />
              </svg>
            </div>

            <div>
              <strong>Cumbre</strong>
              <span>Tu espacio personal</span>
            </div>

            <button
              className="close-menu"
              onClick={() =>
                setMenuAbierto(false)
              }
              aria-label="Cerrar menú"
            >
              ✕
            </button>

          </div>

          <div className="sidebar-user-card">

            <div className="sidebar-user-avatar">
              {(usuario?.user_metadata?.nombre || 'U')
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="sidebar-user-info">
              <strong>
                {usuario?.user_metadata?.nombre || 'Usuario'}
              </strong>
              <span>
                {usuario?.email || ''}
              </span>
            </div>

          </div>

          <nav className="sidebar-nav">

            <span className="sidebar-section-label">
              Principal
            </span>

            <button
              className={`sidebar-option ${
                seccion === 'inicio'
                  ? 'active'
                  : ''
              }`}
              onClick={() => {
                setSeccion('inicio')
                setMenuAbierto(false)
              }}
            >
              <span className="sidebar-option-icon">⌂</span>
              <span>Inicio</span>
            </button>

            <button
              className={`sidebar-option ${
                seccion === 'pendientes'
                  ? 'active'
                  : ''
              }`}
              onClick={() => {
                setSeccion('pendientes')
                setMenuAbierto(false)
              }}
            >
              <span className="sidebar-option-icon">☷</span>
              <span>Mis tareas</span>

              {tareas.length > 0 && (
                <span className="sidebar-count">
                  {tareas.length}
                </span>
              )}
            </button>

            <button
              className={`sidebar-option ${
                seccion === 'realizadas'
                  ? 'active'
                  : ''
              }`}
              onClick={() => {
                setSeccion('realizadas')
                setMenuAbierto(false)
              }}
            >
              <span className="sidebar-option-icon">✓</span>
              <span>Tareas realizadas</span>

              {tareasRealizadas.length > 0 && (
                <span className="sidebar-count">
                  {tareasRealizadas.length}
                </span>
              )}
            </button>

            <span className="sidebar-section-label sidebar-section-secondary">
              Gestión
            </span>

            <button
              className={`sidebar-option ${
                seccion === 'papelera'
                  ? 'active'
                  : ''
              }`}
              onClick={() => {
                setSeccion('papelera')
                setMenuAbierto(false)
              }}
            >
              <span className="sidebar-option-icon">♲</span>
              <span>Papelera</span>

              {tareasEliminadas.length > 0 && (
                <span className="sidebar-count">
                  {tareasEliminadas.length}
                </span>
              )}
            </button>

          </nav>

          <div className="sidebar-footer">

            <button
              className="sidebar-option sidebar-logout"
              onClick={() => {
                setConfirmarCerrarSesion(true)
              }}
            >
              <span className="sidebar-option-icon">↪</span>
              <span>Cerrar sesión</span>
            </button>

          </div>

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
                  Bienvenido a Cumbre
                </h2>

                <p>
                  Parece que todavía no tienes
                  tareas. Crea tu primera tarea
                  y comienza a organizar tu día.
                </p>

                <button
                  className="welcome-button"
                  onClick={irACrearTarea}
                >
                  + Crear primera tarea
                </button>

              </section>

            ) : (

              <section className="dashboard">

                <div className="dashboard-welcome">

  <div className="welcome-main">

    <div className="welcome-mountain">
      <svg viewBox="0 0 120 80">
        <circle
          cx="35"
          cy="25"
          r="18"
          className="welcome-sun"
        />

        <path
          className="welcome-mountain-back"
          d="M0 70 L32 35 L50 52 L66 28 L105 70 Z"
        />

        <path
          className="welcome-mountain-front"
          d="M20 70 L62 15 L110 70 Z"
        />

        <path
          className="welcome-snow"
          d="M62 15 L49 34 L58 31 L64 39 L72 29 Z"
        />
      </svg>
    </div>

    <div className="dashboard-welcome-text">

      <h2>
        Hola, {usuario?.user_metadata?.nombre || 'Usuario'} 👋
      </h2>

      <p>
        Revisa tus tareas pendientes
        y continúa avanzando.
      </p>

    </div>

  </div>

  <button
    className="dashboard-primary"
    onClick={irACrearTarea}
  >
    + Nueva tarea
  </button>

</div>

                {/* OBJETIVO DIARIO + RACHA */}

                <section className="daily-goal-card">

                  <div className="daily-goal-main">

                    <div
                      className="daily-goal-circle"
                      style={{
                        '--goal-progress':
                          `${porcentajeObjetivoHoy * 3.6}deg`
                      }}
                    >

                      <div className="daily-goal-circle-inner">

                        <strong>
                          {completadasObjetivoHoy}/{OBJETIVO_DIARIO}
                        </strong>

                        <span>
                          Hoy
                        </span>

                      </div>

                    </div>

                    <div className="daily-goal-info">

                      <span className="daily-goal-kicker">
                        Objetivo diario
                      </span>

                      <h2>
                        {tareasFaltantesObjetivo === 0
                          ? '¡Objetivo completado! 🏔️'
                          : `Te ${
                              tareasFaltantesObjetivo === 1
                                ? 'falta'
                                : 'faltan'
                            } ${tareasFaltantesObjetivo} ${
                              tareasFaltantesObjetivo === 1
                                ? 'tarea'
                                : 'tareas'
                            }`}
                      </h2>

                      <p>
                        Completa {OBJETIVO_DIARIO} tareas al día
                        para mantener tu racha.
                      </p>

                      <div className="daily-goal-bar">
                        <div
                          className="daily-goal-bar-fill"
                          style={{
                            width:
                              `${porcentajeObjetivoHoy}%`
                          }}
                        />
                      </div>

                    </div>

                  </div>

                  <div className="daily-goal-stats">

                    <div className="daily-goal-stat">
                      <span>
                        🔥
                      </span>

                      <div>
                        <strong>
                          {rachaActual}
                        </strong>

                        <small>
                          Racha actual
                        </small>
                      </div>
                    </div>

                    <div className="daily-goal-stat">
                      <span>
                        🏆
                      </span>

                      <div>
                        <strong>
                          {mejorRacha}
                        </strong>

                        <small>
                          Mejor racha
                        </small>
                      </div>
                    </div>

                  </div>

                  <div className="daily-goal-week">

                    {diasSemanaObjetivo.map(
                      (dia) => (

                        <div
                          className={`daily-goal-day ${
                            dia.cumplido
                              ? 'completed'
                              : ''
                          } ${
                            dia.esHoy
                              ? 'today'
                              : ''
                          } ${
                            dia.esFuturo
                              ? 'future'
                              : ''
                          }`}
                          key={dia.clave}
                          title={`${dia.cantidad} tareas completadas`}
                        >

                          <span>
                            {dia.letra}
                          </span>

                          <strong>
                            {dia.cumplido
                              ? '✓'
                              : dia.esHoy
                                ? dia.cantidad
                                : '·'}
                          </strong>

                        </div>

                      )
                    )}

                  </div>

                </section>

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

               <div className="progress-section progress-premium">

  <div
    className="progress-circle"
    style={{
      '--progress':
        `${porcentajeCompletado * 3.6}deg`
    }}
  >

    <div className="progress-circle-inner">

      <strong>
        {porcentajeCompletado}%
      </strong>

      <span>
        Completado
      </span>

    </div>

  </div>

  <div className="progress-center">

    <h3>
      Progreso general
    </h3>

    <p>
      {tareasRealizadas.length} de {totalTareas} tareas completadas
    </p>

    <div className="progress-segments">

      {Array.from({ length: 10 }).map(
        (_, index) => {

          const segmentosActivos =
            Math.round(
              porcentajeCompletado / 10
            )

          return (
            <span
              key={index}
              className={
                index < segmentosActivos
                  ? 'progress-segment active'
                  : 'progress-segment'
              }
            />
          )
        }
      )}

    </div>

  </div>

  <div className="progress-mountain">

    <svg viewBox="0 0 180 110">

      <path
        className="progress-mountain-back"
        d="M0 100 L45 55 L70 76 L100 35 L160 100 Z"
      />

      <path
        className="progress-mountain-front"
        d="M45 100 L110 18 L180 100 Z"
      />

      <path
        className="progress-mountain-snow"
        d="M110 18 L92 42 L104 38 L112 49 L123 36 Z"
      />

      <path
        className="progress-trees"
        d="
          M20 100 L28 77 L36 100
          M38 100 L47 72 L56 100
          M132 100 L142 72 L152 100
          M150 100 L160 78 L170 100
        "
      />

    </svg>

  </div>

</div>

              {/* PARA HOY + PRÓXIMAS */}

<div className="dashboard-task-grid">

  {/* PARA HOY */}

  <section className="dashboard-list-card">

    <div className="dashboard-list-header">

      <div>

        <h2>
          <span className="dashboard-list-icon">
            📅
          </span>

          Para hoy
        </h2>

        <p>
          {tareasDeHoy.length === 0
            ? 'No tienes tareas pendientes'
            : `${tareasDeHoy.length} ${
                tareasDeHoy.length === 1
                  ? 'tarea pendiente'
                  : 'tareas pendientes'
              }`}
        </p>

      </div>

    </div>

    <div className="dashboard-list-content">

      {tareasDeHoy.length === 0 ? (

        <div className="dashboard-list-empty">

          <span>🎉</span>

          <div>
            <strong>
              Todo tranquilo por hoy
            </strong>

            <p>
              No tienes tareas que venzan hoy.
            </p>
          </div>

        </div>

      ) : (

        tareasDeHoy.map((item) => (

          <div
            className="dashboard-task-row"
            key={item.id}
            onClick={() =>
              setTareaSeleccionada(item)
            }
          >

            <span className="dashboard-task-dot" />

            <div className="dashboard-task-main">

              <strong>
                {item.nombre}
              </strong>

            </div>

            <span
              className={`dashboard-priority dashboard-priority-${item.prioridad}`}
            >
              {item.prioridad === 'alta' && '🔥 '}
              {item.prioridad === 'media' && '● '}
              {item.prioridad === 'baja' && '✓ '}

              {obtenerNombrePrioridad(
                item.prioridad
              )}
            </span>

            <span className="dashboard-task-date">
              Hoy
            </span>

          </div>

        ))

      )}

    </div>

    <button
      className="dashboard-list-link"
      onClick={() =>
        setSeccion('pendientes')
      }
    >
      <span>
        Ver todas mis tareas
      </span>

      <span>
        →
      </span>
    </button>

  </section>


  {/* PRÓXIMAS TAREAS */}

  <section className="dashboard-list-card">

    <div className="dashboard-list-header">

      <div>

        <h2>
          <span className="dashboard-list-icon">
            🗓️
          </span>

          Próximas tareas
        </h2>

        <p>
          {proximasTareas.length === 0
            ? 'No tienes tareas programadas'
            : `${proximasTareas.length} ${
                proximasTareas.length === 1
                  ? 'tarea programada'
                  : 'tareas programadas'
              }`}
        </p>

      </div>

    </div>

    <div className="dashboard-list-content">

      {proximasTareas.length === 0 ? (

        <div className="dashboard-list-empty">

          <span>🏔️</span>

          <div>
            <strong>
              Sin tareas próximas
            </strong>

            <p>
              Estás al día con tus tareas.
            </p>
          </div>

        </div>

      ) : (

        proximasTareas.map((item) => (

          <div
            className="dashboard-task-row"
            key={item.id}
            onClick={() =>
              setTareaSeleccionada(item)
            }
          >

            <span className="dashboard-task-dot" />

            <div className="dashboard-task-main">

              <strong>
                {item.nombre}
              </strong>

            </div>

            <span className="dashboard-task-date">
              {formatearFecha(
                item.fechaLimite
              )}
            </span>

            <span
              className={`dashboard-priority dashboard-priority-${item.prioridad}`}
            >
              {item.prioridad === 'alta' && '🔥 '}
              {item.prioridad === 'media' && '● '}
              {item.prioridad === 'baja' && '✓ '}

              {obtenerNombrePrioridad(
                item.prioridad
              )}
            </span>

          </div>

        ))

      )}

    </div>

    <button
      className="dashboard-list-link"
      onClick={() =>
        setSeccion('pendientes')
      }
    >
      <span>
        Ver todas las tareas
      </span>

      <span>
        →
      </span>
    </button>

  </section>

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

            {/* =========================
                RESUMEN MIS TAREAS
            ========================= */}

            <section className="tasks-page-overview">

              <div className="tasks-overview-progress">

                <div
                  className="tasks-overview-circle"
                  style={{
                    '--tasks-progress':
                      `${porcentajeCompletado * 3.6}deg`
                  }}
                >
                  <div className="tasks-overview-circle-inner">
                    <strong>
                      {porcentajeCompletado}%
                    </strong>

                    <span>
                      Completado
                    </span>
                  </div>
                </div>

                <div className="tasks-overview-info">

                  <span className="tasks-overview-kicker">
                    Tu progreso
                  </span>

                  <h2>
                    ¡Buen progreso, {usuario?.user_metadata?.nombre || 'Usuario'}! 🏔️
                  </h2>

                  <p>
                    {tareasRealizadas.length} de {totalTareas} tareas completadas.
                    Sigue avanzando hacia tu Cumbre.
                  </p>

                  <div className="tasks-overview-segments">
                    {Array.from({ length: 10 }).map(
                      (_, index) => {
                        const segmentosActivos =
                          Math.round(
                            porcentajeCompletado / 10
                          )

                        return (
                          <span
                            key={index}
                            className={
                              index < segmentosActivos
                                ? 'tasks-overview-segment active'
                                : 'tasks-overview-segment'
                            }
                          />
                        )
                      }
                    )}
                  </div>

                </div>

                <div className="tasks-overview-stats">

                  <div className="tasks-overview-stat">
                    <strong>
                      {tareas.length}
                    </strong>

                    <span>
                      Pendientes
                    </span>
                  </div>

                  <div className="tasks-overview-stat completed">
                    <strong>
                      {tareasRealizadas.length}
                    </strong>

                    <span>
                      Completadas
                    </span>
                  </div>

                </div>

              </div>

              <div className="tasks-overview-mountain">
                <svg
                  viewBox="0 0 180 100"
                  aria-hidden="true"
                >
                  <circle
                    cx="36"
                    cy="28"
                    r="16"
                    className="tasks-overview-sun"
                  />

                  <path
                    className="tasks-overview-mountain-back"
                    d="M0 92 L42 52 L68 74 L92 42 L150 92 Z"
                  />

                  <path
                    className="tasks-overview-mountain-front"
                    d="M38 92 L110 14 L180 92 Z"
                  />

                  <path
                    className="tasks-overview-snow"
                    d="M110 14 L92 37 L104 33 L112 44 L125 31 Z"
                  />
                </svg>
              </div>

            </section>

            <div className="tasks-workspace">

              <section
                className="task-form"
                ref={formularioRef}
              >

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

              <aside className="tasks-preview-card">

                <div className="tasks-preview-header">

                  <div>
                    <span className="tasks-preview-kicker">
                      Próximas
                    </span>

                    <h3>
                      Tareas próximas
                    </h3>
                  </div>

                  <span className="tasks-preview-count">
                    {proximasTareas.length}
                  </span>

                </div>

                <div className="tasks-preview-list">

                  {proximasTareas.length === 0 ? (

                    <div className="tasks-preview-empty">
                      <span>🏔️</span>

                      <p>
                        No tienes tareas próximas.
                      </p>
                    </div>

                  ) : (

                    proximasTareas.map((item) => (

                      <button
                        type="button"
                        className="tasks-preview-item"
                        key={item.id}
                        onClick={() =>
                          setTareaSeleccionada(item)
                        }
                      >

                        <span className="tasks-preview-dot" />

                        <span className="tasks-preview-name">
                          {item.nombre}
                        </span>

                        <span
                          className={`tasks-preview-priority tasks-preview-${item.prioridad}`}
                        >
                          {item.prioridad === 'alta'
                            ? 'Alta'
                            : item.prioridad === 'media'
                              ? 'Media'
                              : 'Baja'}
                        </span>

                        <span className="tasks-preview-date">
                          {formatearFecha(
                            item.fechaLimite
                          )}
                        </span>

                      </button>

                    ))

                  )}

                </div>

                <button
                  type="button"
                  className="tasks-preview-link"
                  onClick={() => {
                    setBusqueda('')
                    setFiltro('todas')
                  }}
                >
                  Ver todas mis tareas
                  <span>→</span>
                </button>

              </aside>

            </div>

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

                <div className="cumbre-empty-state">
                  <div className="cumbre-empty-icon">🏔️</div>

                  <strong>
                    Tu lista está despejada
                  </strong>

                  <p>
                    No tienes tareas pendientes.
                    Crea una nueva tarea cuando quieras
                    seguir avanzando hacia tu Cumbre.
                  </p>

                  <button
                    onClick={irACrearTarea}
                  >
                    + Nueva tarea
                  </button>
                </div>

              ) : tareasPendientesFiltradas.length === 0 ? (

                <div className="cumbre-empty-state cumbre-no-results">
                  <div className="cumbre-empty-icon">⌕</div>

                  <strong>
                    No encontramos resultados
                  </strong>

                  <p>
                    No hay tareas que coincidan con
                    tu búsqueda o con el filtro
                    seleccionado.
                  </p>

                  <button
                    onClick={() => {
                      setBusqueda('')
                      setFiltro('todas')
                    }}
                  >
                    Limpiar filtros
                  </button>
                </div>

              ) : (

                tareasPendientesPaginadas.map((item) => (

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

              {tareasPendientesFiltradas.length > 0 &&
                renderPaginacion(
                  paginaPendientes,
                  totalPaginasPendientes,
                  setPaginaPendientes
                )}

            </section>

          </>
        )}

        {/* =========================
            REALIZADAS
        ========================= */}

        {seccion === 'realizadas' && (

          <section className="completed-page">

            <div className="completed-hero">

              <div className="completed-hero-content">

                <div className="completed-hero-icon">
                  ✓
                </div>

                <div className="completed-hero-text">

                  <span className="completed-hero-kicker">
                    Tus logros
                  </span>

                  <h2>
                    ¡Excelente trabajo, {usuario?.user_metadata?.nombre || 'Usuario'}! 🎉
                  </h2>

                  <p>
                    Cada tarea completada es un paso más
                    hacia tu Cumbre.
                  </p>

                  <div className="completed-hero-stats">

                    <div className="completed-stat">
                      <strong>{tareasRealizadas.length}</strong>
                      <span>
                        {tareasRealizadas.length === 1
                          ? 'tarea completada'
                          : 'tareas completadas'}
                      </span>
                    </div>

                    <div className="completed-stat completed-stat-today">
                      <strong>{tareasCompletadasHoy}</strong>
                      <span>
                        {tareasCompletadasHoy === 1
                          ? 'completada hoy'
                          : 'completadas hoy'}
                      </span>
                    </div>

                  </div>

                </div>

              </div>

              <div className="completed-hero-mountain">

                <svg viewBox="0 0 190 110" aria-hidden="true">
                  <circle
                    cx="42"
                    cy="30"
                    r="17"
                    className="completed-sun"
                  />

                  <path
                    className="completed-mountain-back"
                    d="M0 100 L45 58 L72 78 L98 46 L160 100 Z"
                  />

                  <path
                    className="completed-mountain-front"
                    d="M42 100 L116 18 L190 100 Z"
                  />

                  <path
                    className="completed-mountain-snow"
                    d="M116 18 L98 42 L110 38 L118 49 L131 35 Z"
                  />
                </svg>

              </div>

            </div>

            <div className="completed-history">

              <div className="completed-history-header">

                <div>
                  <span className="completed-history-kicker">
                    Historial
                  </span>

                  <h2>
                    Tareas completadas
                  </h2>
                </div>

                <div className="completed-search">

                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line
                      x1="21"
                      y1="21"
                      x2="16.65"
                      y2="16.65"
                    />
                  </svg>

                  <input
                    type="text"
                    placeholder="Buscar en historial..."
                    value={busquedaRealizadas}
                    onChange={(e) =>
                      setBusquedaRealizadas(
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>

              {tareasRealizadas.length === 0 ? (

                <div className="cumbre-empty-state completed-empty-state">
                  <div className="cumbre-empty-icon">✓</div>

                  <strong>
                    Tu historial comienza aquí
                  </strong>

                  <p>
                    Cuando completes una tarea,
                    aparecerá en esta sección y
                    comenzará a sumar a tu progreso.
                  </p>

                  <button
                    onClick={() =>
                      setSeccion('pendientes')
                    }
                  >
                    Ver mis tareas
                  </button>
                </div>

              ) : (

                tareasRealizadasPaginadas.map((item) => (

                    <div
                      className="completed-history-row"
                      key={item.id}
                      onClick={() =>
                        setTareaRealizadaSeleccionada(item)
                      }
                    >

                      <div className="completed-check">
                        ✓
                      </div>

                      <div className="completed-task-main">

                        <strong>
                          {item.nombre}
                        </strong>

                        <div className="completed-task-meta">

                          <span
                            className={`completed-priority completed-priority-${item.prioridad}`}
                          >
                            {obtenerNombrePrioridad(
                              item.prioridad
                            )}
                          </span>

                          {item.fechaLimite && (
                            <span className="completed-task-date">
                              📅{' '}
                              {formatearFecha(
                                item.fechaLimite
                              )}
                            </span>
                          )}

                        </div>

                      </div>

                      <div className="completed-task-status">

                        <span className="completed-status-badge">
                          ✓{' '}
                          {item.fechaCompletada
                            ? obtenerTextoFechaCompletada(
                                item.fechaCompletada
                              )
                            : 'Completada'}
                        </span>

                        <span className="completed-open-arrow">
                          →
                        </span>

                      </div>

                    </div>

                  ))

              )}

              {tareasRealizadas.length > 0 &&
              tareasRealizadasFiltradas.length === 0 && (

                <div className="cumbre-empty-state cumbre-no-results completed-no-results">
                  <div className="cumbre-empty-icon">⌕</div>

                  <strong>
                    Sin coincidencias
                  </strong>

                  <p>
                    No encontramos tareas completadas
                    que coincidan con tu búsqueda.
                  </p>

                  <button
                    onClick={() =>
                      setBusquedaRealizadas('')
                    }
                  >
                    Limpiar búsqueda
                  </button>
                </div>

              )}

              {tareasRealizadasFiltradas.length > 0 &&
                renderPaginacion(
                  paginaRealizadas,
                  totalPaginasRealizadas,
                  setPaginaRealizadas
                )}

            </div>

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

              <div className="cumbre-empty-state trash-empty-state">
                <div className="cumbre-empty-icon">♲</div>

                <strong>
                  La papelera está vacía
                </strong>

                <p>
                  No tienes tareas eliminadas.
                  Cuando envíes una tarea a la papelera,
                  podrás restaurarla desde aquí.
                </p>
              </div>

            ) : (

              tareasPapeleraPaginadas.map(
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

                    <div className="task-menu-container">

  <button
    className="task-menu-button"
    onClick={(e) => {
      e.stopPropagation()

      setMenuTareaAbierto(
        menuTareaAbierto === item.id
          ? null
          : item.id
      )
    }}
  >
    ⋮
  </button>

  <div
    className={`task-dropdown ${
      menuTareaAbierto === item.id
        ? 'open'
        : ''
    }`}
    onClick={(e) =>
      e.stopPropagation()
    }
  >

    <button
      className="restore-option"
      onClick={() => {
        restaurarTarea(item.id)
        setMenuTareaAbierto(null)
      }}
    >
      ♻️ Restaurar
    </button>

    <button
      className="delete-option"
      onClick={() => {
        eliminarDefinitivamente(item)
        setMenuTareaAbierto(null)
      }}
    >
      🗑️ Eliminar definitivamente
    </button>

  </div>

</div>

                  </div>

                )
              )

            )}

            {tareasEliminadas.length > 0 &&
              renderPaginacion(
                paginaPapelera,
                totalPaginasPapelera,
                setPaginaPapelera
              )}

          </section>

        )}

      </main>

      {/* =========================
          CONFIRMAR CIERRE DE SESIÓN
      ========================= */}

      {confirmarCerrarSesion && (

        <div
          className="modal-overlay logout-confirm-overlay"
          onClick={() =>
            setConfirmarCerrarSesion(false)
          }
        >

          <div
            className="logout-confirm-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="logout-confirm-icon">
              ↪
            </div>

            <h3>
              ¿Cerrar sesión?
            </h3>

            <p>
              Tendrás que volver a iniciar sesión
              para continuar usando Cumbre.
            </p>

            <div className="logout-confirm-actions">

              <button
                className="logout-cancel-button"
                onClick={() =>
                  setConfirmarCerrarSesion(false)
                }
              >
                Cancelar
              </button>

              <button
                className="logout-confirm-button"
                onClick={async () => {
                  const { error } =
                    await supabase.auth.signOut()

                  if (error) {
                    console.error(
                      'Error al cerrar sesión:',
                      error.message
                    )
                    return
                  }

                  setConfirmarCerrarSesion(false)
                  setMenuAbierto(false)
                  setUsuario(null)
                }}
              >
                Sí, cerrar sesión
              </button>

            </div>

          </div>

        </div>

      )}

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

      {/* =========================
          AVISO DE NOTIFICACIONES
      ========================= */}

      {mostrarAvisoNotificaciones && (
        <div
          className="notification-prompt-overlay"
          onClick={posponerNotificaciones}
        >
          <div
            className="notification-prompt-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-prompt-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notification-prompt-icon">🔔</div>

            <div className="notification-prompt-copy">
              <span className="notification-prompt-kicker">
                Recordatorios de Cumbre
              </span>

              <h2 id="notification-prompt-title">
                Activa tus notificaciones
              </h2>

              <p>
                Cumbre puede avisarte cuando una tarea esté próxima a vencer
                y recordarte tu objetivo diario para que no pierdas tu racha.
              </p>
            </div>

            <div className="notification-prompt-actions">
              <button
                type="button"
                className="notification-prompt-later"
                onClick={posponerNotificaciones}
                disabled={activandoNotificaciones}
              >
                Ahora no
              </button>

              <button
                type="button"
                className="notification-prompt-activate"
                onClick={activarNotificaciones}
                disabled={activandoNotificaciones}
              >
                {activandoNotificaciones
                  ? 'Activando...'
                  : '🔔 Activar notificaciones'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App