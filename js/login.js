(() => {
  const API_BASE_URL = "https://apigeneral-ehtt.onrender.com";

  const STORAGE_KEYS = {
    token: "recetario_token",
    usuarioId: "recetario_usuario_id",
    email: "recetario_email",
    nombre: "recetario_nombre",
  };

  const authModalEl = document.getElementById("authModal");
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const loginError = document.getElementById("loginError");
  const loginBtn = document.getElementById("loginBtn");

  const loginNavBtn = document.getElementById("loginNavBtn");
  const userInfo = document.getElementById("userInfo");
  const userNombre = document.getElementById("userNombre");
  const logoutBtn = document.getElementById("logoutBtn");

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

  function mostrarInvitado() {
    if (loginNavBtn) loginNavBtn.classList.remove("oculto");
    if (userInfo) userInfo.classList.add("oculto");
  }

  function mostrarUsuarioLogueado(nombre, email) {
    if (loginNavBtn) loginNavBtn.classList.add("oculto");
    if (userInfo) {
      userInfo.classList.remove("oculto");
      if (userNombre) userNombre.textContent = nombre || email || "Usuario";
    }
  }

  function cerrarModalAuth() {
    if (!authModalEl || typeof bootstrap === "undefined") return;
    const modal = bootstrap.Modal.getOrCreateInstance(authModalEl);
    modal.hide();
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

    }

    if (!respuesta.ok) {
      throw new Error(datos.error || "No se pudo iniciar sesión. Intenta nuevamente.");
    }

    return datos;
  }

  async function meRequest(token) {
    const respuesta = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!respuesta.ok) {
      throw new Error("Sesión inválida o expirada");
    }

    return respuesta.json();
  }

  async function verificarSesionAlCargar() {
    const token = obtenerToken();

    if (!token) {
      mostrarInvitado();
      return;
    }

    try {
      const datos = await meRequest(token);
      localStorage.setItem(STORAGE_KEYS.email, datos.email || "");
      localStorage.setItem(STORAGE_KEYS.nombre, datos.nombre || "");
      mostrarUsuarioLogueado(datos.nombre, datos.email);
    } catch (error) {
      limpiarSesion();
      mostrarInvitado();
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
        mostrarUsuarioLogueado(datos.nombre, datos.email);
        loginForm.reset();
        cerrarModalAuth();
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
    mostrarInvitado();
  }

  if (loginForm) {
    loginForm.addEventListener("submit", manejarSubmitLogin);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", manejarLogout);
  }
  verificarSesionAlCargar();
  window.RecetarioAuth = {
    API_BASE_URL,
    STORAGE_KEYS,
    guardarSesion,
    obtenerToken,
    limpiarSesion,
    mostrarUsuarioLogueado,
    cerrarModalAuth,
  };
})();
