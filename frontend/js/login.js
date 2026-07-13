// frontend/js/login.js
// Maneja el login del usuario contra el módulo de Autenticación (/auth/*)
// definido en CONTRATO_API.md.

(() => {
  const API_BASE_URL = "https://apigeneral-ehtt.onrender.com";

  // Claves usadas en localStorage para persistir la sesión en el navegador.
  const STORAGE_KEYS = {
    token: "recetario_token",
    usuarioId: "recetario_usuario_id",
    email: "recetario_email",
    nombre: "recetario_nombre",
  };

  // Elementos del DOM
  const loginScreen = document.getElementById("login-screen");
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const loginError = document.getElementById("loginError");
  const loginBtn = document.getElementById("loginBtn");

  const userInfo = document.getElementById("userInfo");
  const userNombre = document.getElementById("userNombre");
  const logoutBtn = document.getElementById("logoutBtn");

  // ---------- Manejo de sesión en localStorage ----------

  function guardarSesion(datos) {
    localStorage.setItem(STORAGE_KEYS.token, datos.token);
    localStorage.setItem(STORAGE_KEYS.usuarioId, datos.usuario_id);
    localStorage.setItem(STORAGE_KEYS.email, datos.email || "");
    localStorage.setItem(STORAGE_KEYS.nombre, datos.nombre || "");
  }

  function obtenerToken() {
    return localStorage.getItem(STORAGE_KEYS.token);
  }

  function limpiarSesion() {
    Object.values(STORAGE_KEYS).forEach((clave) => localStorage.removeItem(clave));
  }

  // ---------- UI ----------

  function mostrarPantallaLogin() {
    if (loginScreen) loginScreen.classList.remove("oculto");
    if (userInfo) userInfo.classList.add("oculto");
  }

  function ocultarPantallaLogin(nombre, email) {
    if (loginScreen) loginScreen.classList.add("oculto");
    if (userInfo) {
      userInfo.classList.remove("oculto");
      if (userNombre) userNombre.textContent = nombre || email || "Usuario";
    }
  }

  function mostrarError(mensaje) {
    if (!loginError) return;
    loginError.textContent = mensaje;
    loginError.classList.remove("oculto");
  }

  function ocultarError() {
    if (!loginError) return;
    loginError.textContent = "";
    loginError.classList.add("oculto");
  }

  function ponerCargando(cargando) {
    if (!loginBtn) return;
    loginBtn.disabled = cargando;
    loginBtn.textContent = cargando ? "Ingresando..." : "Iniciar sesión";
  }

  // ---------- Llamadas al API ----------

  async function loginRequest(email, password) {
    const respuesta = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    let datos = {};
    try {
      datos = await respuesta.json();
    } catch (_) {
      // Respuesta sin cuerpo JSON válido
    }

    if (!respuesta.ok) {
      // 400: falta email/password | 401: credenciales inválidas
      throw new Error(datos.error || "No se pudo iniciar sesión. Intenta nuevamente.");
    }

    return datos; // { usuario_id, email, nombre, token }
  }

  async function meRequest(token) {
    const respuesta = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!respuesta.ok) {
      throw new Error("Sesión inválida o expirada");
    }

    return respuesta.json(); // { usuario_id, email, nombre }
  }

  // ---------- Flujo principal ----------

  async function verificarSesionAlCargar() {
    const token = obtenerToken();

    if (!token) {
      mostrarPantallaLogin();
      return;
    }

    try {
      const datos = await meRequest(token);
      // Refrescamos los datos guardados por si cambiaron en el servidor
      localStorage.setItem(STORAGE_KEYS.email, datos.email || "");
      localStorage.setItem(STORAGE_KEYS.nombre, datos.nombre || "");
      ocultarPantallaLogin(datos.nombre, datos.email);
    } catch (error) {
      // Token faltante, inválido o expirado -> se limpia y se pide login otra vez
      limpiarSesion();
      mostrarPantallaLogin();
    }
  }

  function manejarSubmitLogin(evento) {
    evento.preventDefault();
    ocultarError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      mostrarError("Completa correo y contraseña.");
      return;
    }

    ponerCargando(true);

    loginRequest(email, password)
      .then((datos) => {
        guardarSesion(datos);
        ocultarPantallaLogin(datos.nombre, datos.email);
        loginForm.reset();
      })
      .catch((error) => {
        mostrarError(error.message);
      })
      .finally(() => {
        ponerCargando(false);
      });
  }

  function manejarLogout() {
    limpiarSesion();
    mostrarPantallaLogin();
  }

  // ---------- Inicialización ----------

  if (loginForm) {
    loginForm.addEventListener("submit", manejarSubmitLogin);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", manejarLogout);
  }

  // El script se carga al final del <body>, así que el DOM ya existe.
  verificarSesionAlCargar();
})();