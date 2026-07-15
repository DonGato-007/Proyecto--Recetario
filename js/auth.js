const API_BASE = "https://apigeneral-ehtt.onrender.com";
const ESPERA_GUARDADO_MS = 10000;


let usuarioActual = null; 
let favoritos = [];       
let timerGuardado = null; 

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
        throw new Error(data.error || "Error inesperado");
    }
    return data;
}

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

async function cargarFavoritosDesdeServidor() {
    try {
        const data = await apiFetch("/config/actual");
        favoritos = Array.isArray(data.contenido?.favoritos)
            ? data.contenido.favoritos
            : [];
    } catch (err) {
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

function toggleFavorito(recetaId) {
    if (esFavorito(recetaId)) {
        favoritos = favoritos.filter((id) => id !== recetaId);
    } else {
        favoritos.push(recetaId);
    }
    localStorage.setItem("favoritos_cache", JSON.stringify(favoritos));
    programarGuardadoFavoritos();
    avisarFavoritosActualizados();
    return esFavorito(recetaId);
}
function avisarFavoritosActualizados() {
    document.dispatchEvent(new CustomEvent("favoritos:actualizados"));
}

window.Favoritos = {
    toggle: toggleFavorito,
    esFavorito,
    listar: () => favoritos,
    estaLogueado: () => !!getToken(),
};

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
    if (getToken()) {
        const cache = localStorage.getItem("favoritos_cache");
        if (cache) favoritos = JSON.parse(cache);

        obtenerSesion()
            .then(() => {
                actualizarUISesion();
                return cargarFavoritosDesdeServidor();
            })
            .catch(() => {
                cerrarSesion();
            });
    }

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
    const registerForm = document.getElementById("registerForm");
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        ocultarError("registerError");
        const nombre = document.getElementById("registerNombre").value;
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;
        try {
            await registrar(email, password, nombre);
            favoritos = [];
            localStorage.setItem("favoritos_cache", JSON.stringify(favoritos));
            actualizarUISesion();
            avisarFavoritosActualizados();
            bootstrap.Modal.getInstance(document.getElementById("authModal"))?.hide();
            registerForm.reset();
        } catch (err) {
            mostrarError("registerError", err.message);
        }
    });
    document.getElementById("logoutBtn").addEventListener("click", cerrarSesion);
});