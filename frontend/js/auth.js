const API_BASE = "https://apigeneral-ehtt.onrender.com";
const ESPERA_GUARDADO_MS = 10000; // 3s sin cambios -> recién se guarda

// Estado local simple (nada de frameworks, solo variables + localStorage)

let usuarioActual = null; // { usuario_id, email, nombre }
let favoritos = [];       // array de ids de recetas favoritas
let timerGuardado = null; // referencia al setTimeout del debounce

function getToken() {
    return localStorage.getItem("token");
}
function setToken(token) {
    localStorage.setItem("token", token);
}
function borrarToken() {
    localStorage.removeItem("token");
}

async function apiFetch(path, { method = "GET", body } = {}) {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        // El contrato dice que todo error viene como { error: "..." }
        throw new Error(data.error || "Error inesperado");
    }
    return data;
}

// MÓDULO AUTH (/auth/*)

async function registrar(email, password, nombre) {
    const data = await apiFetch("/auth/register", {
        method: "POST",
        body: { email, password, nombre },
    });
    setToken(data.token);
    usuarioActual = data;
    return data;
}

async function iniciarSesion(email, password) {
    const data = await apiFetch("/auth/login", {
        method: "POST",
        body: { email, password },
    });
    setToken(data.token);
    usuarioActual = data;
    return data;
}

async function obtenerSesion() {
    // Confirma que el token siga siendo válido y trae los datos del usuario
    const data = await apiFetch("/auth/me");
    usuarioActual = data;
    return data;
}

function cerrarSesion() {
    borrarToken();
    usuarioActual = null;
    favoritos = [];
    localStorage.removeItem("favoritos_cache");
    if (timerGuardado) clearTimeout(timerGuardado);
    actualizarUISesion();
    avisarFavoritosActualizados();
}

// MÓDULO CONFIG (/config/*) -> usado para guardar los favoritos

async function cargarFavoritosDesdeServidor() {
    try {
        const data = await apiFetch("/config/actual");
        favoritos = Array.isArray(data.contenido?.favoritos)
            ? data.contenido.favoritos
            : [];
    } catch (err) {
        // 404 = todavía no ha guardado nada -> empieza en blanco, no es error real
        favoritos = [];
    }
    localStorage.setItem("favoritos_cache", JSON.stringify(favoritos));
    avisarFavoritosActualizados();
    return favoritos;
}

async function guardarFavoritosEnServidor() {
    await apiFetch("/config/guardar", {
        method: "POST",
        body: { contenido: { favoritos } },
    });
}

// Reinicia el contador cada vez que hay un cambio (esto es el "debounce")
function programarGuardadoFavoritos() {
    if (timerGuardado) clearTimeout(timerGuardado);
    timerGuardado = setTimeout(() => {
        guardarFavoritosEnServidor().catch((err) =>
            console.error("No se pudo guardar favoritos:", err.message)
        );
    }, ESPERA_GUARDADO_MS);
}

function esFavorito(recetaId) {
    return favoritos.includes(recetaId);
}

// Agrega o quita un id del array local y agenda el guardado (no manda nada aún)
function toggleFavorito(recetaId) {
    if (esFavorito(recetaId)) {
        favoritos = favoritos.filter((id) => id !== recetaId);
    } else {
        favoritos.push(recetaId);
    }
    // Guardamos también en localStorage como caché por si el usuario
    // recarga la página antes de que se dispare el guardado en servidor.
    localStorage.setItem("favoritos_cache", JSON.stringify(favoritos));
    programarGuardadoFavoritos();
    avisarFavoritosActualizados();
    return esFavorito(recetaId);
}

// Avisa a quien esté escuchando (categorias.js) que la lista de favoritos
// cambió, para que pueda repintar los corazones sin conocer estas variables.
function avisarFavoritosActualizados() {
    document.dispatchEvent(new CustomEvent("favoritos:actualizados"));
}

// Se expone para que categorias.js (o quien pinte las recetas) lo use
window.Favoritos = {
    toggle: toggleFavorito,
    esFavorito,
    listar: () => favoritos,
    estaLogueado: () => !!getToken(),
};

// UI: conectar lo de arriba con el HTML que ya existe en index.html

function actualizarUISesion() {
    const loginNavBtn = document.getElementById("loginNavBtn");
    const userInfo = document.getElementById("userInfo");
    const userNombre = document.getElementById("userNombre");

    if (usuarioActual) {
        loginNavBtn.classList.add("oculto");
        userInfo.classList.remove("oculto");
        userNombre.textContent = usuarioActual.nombre || usuarioActual.email;
    } else {
        loginNavBtn.classList.remove("oculto");
        userInfo.classList.add("oculto");
        userNombre.textContent = "";
    }
}

function mostrarError(elId, mensaje) {
    const el = document.getElementById(elId);
    el.textContent = mensaje;
    el.classList.remove("oculto");
}

function ocultarError(elId) {
    document.getElementById(elId).classList.add("oculto");
}

document.addEventListener("DOMContentLoaded", () => {
    // --- Al cargar la página: si hay token guardado, intenta recuperar sesión ---
    if (getToken()) {
        // Mientras confirma con el server, muestra la caché local de favoritos
        const cache = localStorage.getItem("favoritos_cache");
        if (cache) favoritos = JSON.parse(cache);

        obtenerSesion()
            .then(() => {
                actualizarUISesion();
                return cargarFavoritosDesdeServidor();
            })
            .catch(() => {
                // token vencido/ inválido -> se limpia todo
                cerrarSesion();
            });
    }

    // --- Formulario de login ---
    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        ocultarError("loginError");
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        try {
            await iniciarSesion(email, password);
            await cargarFavoritosDesdeServidor();
            actualizarUISesion();
            bootstrap.Modal.getInstance(document.getElementById("authModal"))?.hide();
            loginForm.reset();
        } catch (err) {
            mostrarError("loginError", err.message);
        }
    });

    // --- Formulario de registro ---
    const registerForm = document.getElementById("registerForm");
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        ocultarError("registerError");
        const nombre = document.getElementById("registerNombre").value;
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;
        try {
            await registrar(email, password, nombre);
            // /auth/register ya deja al usuario logueado
            favoritos = [];
            actualizarUISesion();
            bootstrap.Modal.getInstance(document.getElementById("authModal"))?.hide();
            registerForm.reset();
        } catch (err) {
            mostrarError("registerError", err.message);
        }
    });

    // --- Logout ---
    document.getElementById("logoutBtn").addEventListener("click", cerrarSesion);
});