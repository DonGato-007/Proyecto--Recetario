// frontend/js/auth.js
// Módulo de creación de cuenta (registro), parte del módulo de Autenticación
// (/auth/*) definido en CONTRATO_API.md. Vive dentro del mismo modal de login
// (pestaña "Crear cuenta") y reutiliza la sesión/UI expuestas por login.js
// en `window.RecetarioAuth`, sin duplicar esa lógica.

(() => {
  const auth = window.RecetarioAuth;

  if (!auth) {
    // login.js no se cargó (o se cargó después) — sin sesión compartida no
    // podemos continuar, para evitar duplicar lógica de sesión aquí.
    console.error("auth.js requiere que login.js se cargue primero.");
    return;
  }

  const { API_BASE_URL, guardarSesion, mostrarUsuarioLogueado, cerrarModalAuth } = auth;

  // Elementos del DOM
  const registerForm = document.getElementById("registerForm");
  const nombreInput = document.getElementById("registerNombre");
  const emailInput = document.getElementById("registerEmail");
  const passwordInput = document.getElementById("registerPassword");
  const registerError = document.getElementById("registerError");
  const registerBtn = document.getElementById("registerBtn");

  // ---------- UI ----------

  function mostrarError(mensaje) {
    if (!registerError) return;
    registerError.textContent = mensaje;
    registerError.classList.remove("oculto");
  }

  function ocultarError() {
    if (!registerError) return;
    registerError.textContent = "";
    registerError.classList.add("oculto");
  }

  function ponerCargando(cargando) {
    if (!registerBtn) return;
    registerBtn.disabled = cargando;
    registerBtn.textContent = cargando ? "Creando cuenta..." : "Crear cuenta";
  }

  // ---------- Llamada al API: POST /auth/register (CONTRATO_API.md) ----------
  // Body: { email, password, nombre } · Respuesta 201: { usuario_id, email, nombre, token }
  // Errores: 400 (falta email/password o password < 8 caracteres), 409 (email ya registrado)

  async function registerRequest(email, password, nombre) {
    const respuesta = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, nombre }),
    });

    let datos = {};
    try {
      datos = await respuesta.json();
    } catch (_) {
      // Respuesta sin cuerpo JSON válido
    }

    if (!respuesta.ok) {
      throw new Error(datos.error || "No se pudo crear la cuenta. Intenta nuevamente.");
    }

    return datos; // { usuario_id, email, nombre, token }
  }

  // ---------- Flujo principal ----------

  function manejarSubmitRegistro(evento) {
    evento.preventDefault();
    ocultarError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const nombre = nombreInput.value.trim();

    if (!email || !password) {
      mostrarError("Completa correo y contraseña.");
      return;
    }

    if (password.length < 8) {
      mostrarError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    ponerCargando(true);

    registerRequest(email, password, nombre)
      .then((datos) => {
        // El backend deja al usuario logueado de inmediato tras registrarse.
        guardarSesion(datos);
        mostrarUsuarioLogueado(datos.nombre, datos.email);
        registerForm.reset();
        cerrarModalAuth();
      })
      .catch((error) => {
        mostrarError(error.message);
      })
      .finally(() => {
        ponerCargando(false);
      });
  }

  // ---------- Inicialización ----------

  if (registerForm) {
    registerForm.addEventListener("submit", manejarSubmitRegistro);
  }
})();
