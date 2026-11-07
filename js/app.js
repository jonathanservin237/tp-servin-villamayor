// ---------- 1. Configuración ----------
const URL_UBICACIONES = "https://rickandmortyapi.com/api/location";
const TEXTO_DESCONOCIDO = "Desconocido";
const CLAVE_STORAGE = "rick_morty_ultima_busqueda_b";

// ---------- 2. Selección de elementos del DOM ----------
const formularioBusqueda = document.querySelector("#formulario-busqueda");
const campoNombre = document.querySelector("#campo-nombre");
const campoTipo = document.querySelector("#campo-tipo");
const contadorResultados = document.querySelector("#contador-resultados");
const botonBuscar = document.querySelector("#boton-buscar");
const mensajeEstado = document.querySelector("#mensaje-estado");
const contenedorResultados = document.querySelector("#contenedor-resultados");

// ---------- 3. Acceso a la API (Sin modificar el DOM) ----------
const construirUrlBusqueda = (criterios) => {
  const url = new URL(URL_UBICACIONES);

  if (criterios.nombre) {
    url.searchParams.set("name", criterios.nombre);
  }
  if (criterios.tipo) {
    url.searchParams.set("type", criterios.tipo);
  }

  return url;
};

const buscarUbicaciones = async (criterios) => {
  const url = construirUrlBusqueda(criterios);
  const respuesta = await fetch(url);

  // Status 404: La API responde 404 cuando no hay coincidencias
  if (respuesta.status === 404) {
    return { total: 0, ubicaciones: [] };
  }

  // Cualquier otro código fuera de 200-299 es un error HTTP
  if (!respuesta.ok) {
    throw new Error(`El servidor respondió con el código ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  return {
    total: datos.info.count,
    ubicaciones: datos.results,
  };
};

// ---------- 4. Formateo de datos ----------
const textoSeguro = (valor) => {
  if (!valor || valor === "" || valor === "unknown") {
    return TEXTO_DESCONOCIDO;
  }
  return valor;
};

// ---------- 5. Renderizado seguro con createElement y textContent ----------
const crearDato = (etiqueta, valor) => {
  const termino = document.createElement("dt");
  termino.textContent = etiqueta;

  const descripcion = document.createElement("dd");
  descripcion.textContent = valor;

  return [termino, descripcion];
};

const crearTarjeta = (ubicacion) => {
  const tarjeta = document.createElement("article");
  tarjeta.classList.add("tarjeta");

  const titulo = document.createElement("h2");
  titulo.textContent = textoSeguro(ubicacion.name);

  const listaDatos = document.createElement("dl");
  const cantidadResidentes = ubicacion.residents?.length ?? 0;

  listaDatos.append(
    ...crearDato("Tipo", textoSeguro(ubicacion.type)),
    ...crearDato("Dimensión", textoSeguro(ubicacion.dimension)),
    ...crearDato("Residentes", `${cantidadResidentes}`)
  );

  tarjeta.append(titulo, listaDatos);
  return tarjeta;
};

const mostrarUbicaciones = (ubicaciones) => {
  contenedorResultados.textContent = "";
  ubicaciones.forEach((ubicacion) => {
    contenedorResultados.append(crearTarjeta(ubicacion));
  });
};

const actualizarContador = (total, mostrados) => {
  if (total === 0) {
    contadorResultados.hidden = true;
    contadorResultados.textContent = "";
    return;
  }

  contadorResultados.hidden = false;
  contadorResultados.textContent = `${total} ubicaciones encontradas · se muestran ${mostrados}`;
};

// ---------- 6. Estados de la interfaz ----------
const mostrarMensaje = (texto, esError = false) => {
  mensajeEstado.textContent = texto;
  mensajeEstado.classList.toggle("error", esError);
};

const activarCarga = (estaCargando) => {
  botonBuscar.disabled = estaCargando;
  botonBuscar.textContent = estaCargando ? "Buscando…" : "Buscar";
  contenedorResultados.setAttribute("aria-busy", String(estaCargando));
};

// ---------- 7. Persistencia con localStorage ----------
const guardarBusquedaStorage = (criterios) => {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(criterios));
};

const obtenerBusquedaStorage = () => {
  const guardado = localStorage.getItem(CLAVE_STORAGE);
  if (!guardado) return null;
  try {
    return JSON.parse(guardado);
  } catch {
    return null;
  }
};

// ---------- 8. Lógica principal de búsqueda ----------
const ejecutarBusqueda = async (criterios, guardar = true) => {
  // Verificar si hay al menos un criterio activo
  if (!criterios.nombre && !criterios.tipo) {
    mostrarMensaje("Por favor, ingresa un nombre o un tipo de ubicación para buscar.", true);
    actualizarContador(0, 0);
    contenedorResultados.textContent = "";
    return;
  }

  activarCarga(true);
  mostrarMensaje("Buscando ubicaciones…");
  contenedorResultados.textContent = "";
  actualizarContador(0, 0);

  try {
    const { total, ubicaciones } = await buscarUbicaciones(criterios);

    if (ubicaciones.length === 0) {
      mostrarMensaje("No se encontraron ubicaciones que coincidan con la búsqueda.");
      return;
    }

    mostrarUbicaciones(ubicaciones);
    actualizarContador(total, ubicaciones.length);
    mostrarMensaje("");

    if (guardar) {
      guardarBusquedaStorage(criterios);
    }
  } catch (error) {
    console.error("Error al buscar ubicaciones:", error);

    const mensaje =
      error instanceof TypeError
        ? "No se pudo conectar con la API. Revisa tu conexión a internet e inténtalo de nuevo."
        : `Ocurrió un problema con el servidor (${error.message}).`;

    mostrarMensaje(mensaje, true);
  } finally {
    activarCarga(false);
  }
};

const manejarBusqueda = (evento) => {
  evento.preventDefault();
  const criterios = {
    nombre: campoNombre.value.trim(),
    tipo: campoTipo.value.trim(),
  };
  ejecutarBusqueda(criterios, true);
};

// ---------- 9. Inicialización y restauración de localStorage ----------
const inicializarAplicacion = () => {
  const criteriosGuardados = obtenerBusquedaStorage();
  if (criteriosGuardados) {
    campoNombre.value = criteriosGuardados.nombre ?? "";
    campoTipo.value = criteriosGuardados.tipo ?? "";
    if (criteriosGuardados.nombre || criteriosGuardados.tipo) {
      ejecutarBusqueda(criteriosGuardados, false);
    }
  }
};

// ---------- 10. Registro de eventos ----------
formularioBusqueda.addEventListener("submit", manejarBusqueda);
document.addEventListener("DOMContentLoaded", inicializarAplicacion);
