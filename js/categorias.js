(() => {
    const contenidoPlatos = document.getElementById("contenido-platos");
    const buscarForm = document.getElementById("buscarForm");
    const buscarInput = document.getElementById("buscarInput");

    const API_BASE = "https://www.themealdb.com/api/json/v1/1";
    const API_TRADUCCION = "https://api.mymemory.translated.net/get";

    const MAPA_CATEGORIAS = {
        "categoria-carne": { titulo: "Platos con carne", mealdb: ["Beef"] },
        "categoria-pollo": { titulo: "Platos con pollo", mealdb: ["Chicken"] },
        "categoria-postres": { titulo: "Postres", mealdb: ["Dessert"] },
        "categoria-pasta": { titulo: "Pasta / Fideos", mealdb: ["Pasta"] },
        "categoria-tarta": { titulo: "Tartas y Empanadas", mealdb: ["Side"] },
        "categoria-mariscos": { titulo: "Mariscos y Pescados", mealdb: ["Seafood"] },
        "categoria-entradas": { titulo: "Entradas", mealdb: ["Starter"] },
        "categoria-desayunos": { titulo: "Desayunos", mealdb: ["Breakfast"] },
        "categoria-vegana": { titulo: "Comida Vegana", mealdb: ["Vegan"] },
        "categoria-vegetariana": { titulo: "Comida Vegetariana", mealdb: ["Vegetarian"] },
        "categoria-mas": { titulo: "Más recetas", mealdb: ["Miscellaneous", "Pork", "Lamb", "Goat"] },
    };

    const LIMITE_POR_CATEGORIA_EN_TODO = 4;

    const cacheListasPorCategoria = new Map();
    const cacheDetallePorId = new Map();

    let vistaActual = { tipo: "categoria", valor: "categoria-todo" };

    function quitarDuplicados(recetas) {
        const vistos = new Map();
        recetas.forEach((r) => vistos.set(r.id, r));
        return [...vistos.values()];
    }

    function mapearMeal(meal) {
        return {
            id: meal.idMeal,
            nombre: meal.strMeal,
            imagen: meal.strMealThumb,
        };
    }

    function extraerIngredientes(meal) {
        const ingredientes = [];
        for (let i = 1; i <= 20; i++) {
            const nombre = meal[`strIngredient${i}`];
            const medida = meal[`strMeasure${i}`];
            if (!nombre || !nombre.trim()) continue;

            const nombreLimpio = nombre.trim();
            const medidaLimpia = medida ? medida.trim() : "";

            ingredientes.push({
                nombre: nombreLimpio,
                medida: medidaLimpia,
                imagen: `https://www.themealdb.com/images/ingredients/${encodeURIComponent(nombreLimpio)}-Small.png`,
            });
        }
        return ingredientes;
    }

    function detalleDesdeMeal(meal) {
        return {
            id: meal.idMeal,
            titulo: meal.strMeal,
            imagen: meal.strMealThumb,
            descripcion: meal.strInstructions,
            ingredientes: extraerIngredientes(meal),
        };
    }

    async function obtenerListaPorCategoria(nombreMealdb) {
        if (cacheListasPorCategoria.has(nombreMealdb)) {
            return cacheListasPorCategoria.get(nombreMealdb);
        }

        const respuesta = await fetch(`${API_BASE}/filter.php?c=${encodeURIComponent(nombreMealdb)}`);
        if (!respuesta.ok) throw new Error(`No se pudo cargar la categoría "${nombreMealdb}"`);

        const datos = await respuesta.json();
        const lista = (datos.meals || []).map(mapearMeal);

        cacheListasPorCategoria.set(nombreMealdb, lista);
        return lista;
    }

    async function obtenerDetalleReceta(idMeal) {
        if (cacheDetallePorId.has(idMeal)) {
            return cacheDetallePorId.get(idMeal);
        }

        const respuesta = await fetch(`${API_BASE}/lookup.php?i=${encodeURIComponent(idMeal)}`);
        if (!respuesta.ok) throw new Error("No se pudo cargar el detalle de la receta");

        const datos = await respuesta.json();
        const meal = (datos.meals || [])[0];
        if (!meal) return null;

        const detalle = detalleDesdeMeal(meal);
        cacheDetallePorId.set(idMeal, detalle);
        return detalle;
    }

    async function buscarRecetasEnApi(texto) {
        const respuesta = await fetch(`${API_BASE}/search.php?s=${encodeURIComponent(texto)}`);
        if (!respuesta.ok) throw new Error("No se pudo realizar la búsqueda");

        const datos = await respuesta.json();
        const meals = datos.meals || [];

        meals.forEach((meal) => {
            if (!cacheDetallePorId.has(meal.idMeal)) {
                cacheDetallePorId.set(meal.idMeal, detalleDesdeMeal(meal));
            }
        });

        return meals.map(mapearMeal);
    }

    function partirEnTrozos(texto, maxLargo = 450) {
        const oraciones = texto.split(/(?<=[.!?])\s+/);
        const trozos = [];
        let actual = "";

        oraciones.forEach((oracion) => {
            if ((actual + " " + oracion).trim().length > maxLargo && actual) {
                trozos.push(actual.trim());
                actual = oracion;
            } else {
                actual = (actual + " " + oracion).trim();
            }
        });
        if (actual) trozos.push(actual.trim());
        return trozos.length ? trozos : [texto];
    }

    async function traducirTrozo(texto, origen, destino) {
        if (!texto || !texto.trim()) return texto;
        const url = `${API_TRADUCCION}?q=${encodeURIComponent(texto)}&langpair=${origen}|${destino}`;
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error("Error del servicio de traducción");
        const datos = await respuesta.json();
        return datos?.responseData?.translatedText || texto;
    }

    async function traducirTexto(texto, origen = "en", destino = "es") {
        const trozos = partirEnTrozos(texto);
        const traducidos = await Promise.all(trozos.map((t) => traducirTrozo(t, origen, destino)));
        return traducidos.join(" ");
    }

    async function traducirReceta(detalle) {
        if (detalle.tituloEs) return detalle;

        const [tituloEs, descripcionEs, ingredientesEs] = await Promise.all([
            traducirTexto(detalle.titulo),
            traducirTexto(detalle.descripcion),
            Promise.all(detalle.ingredientes.map((ing) => traducirTexto(ing.nombre))),
        ]);

        detalle.tituloEs = tituloEs;
        detalle.descripcionEs = descripcionEs;
        detalle.ingredientesEs = ingredientesEs;
        return detalle;
    }

    function marcarBotonActivo(idBoton) {
        document.querySelectorAll(".col-lg-3 .btn").forEach((btn) => btn.classList.remove("activa"));
        const boton = idBoton && document.getElementById(idBoton);
        if (boton) boton.classList.add("activa");
    }

    function mostrarCargando(titulo) {
        contenidoPlatos.innerHTML = `
            <h3 class="mb-4">${titulo}</h3>
            <div class="spinner-recetario"></div>
            <p class="text-muted">Cargando recetas...</p>
        `;
    }

    function mostrarError(titulo, mensaje) {
        contenidoPlatos.innerHTML = `
            <h3 class="mb-4">${titulo}</h3>
            <p class="text-danger">${mensaje}</p>
        `;
    }

    function mostrarMensaje(titulo, mensaje, botonHtml = "") {
        contenidoPlatos.innerHTML = `
            <h3 class="mb-4">${titulo}</h3>
            <p class="text-muted">${mensaje}</p>
            ${botonHtml}
        `;
    }

    function renderizarListado(titulo, recetas) {
        if (recetas.length === 0) {
            mostrarMensaje(titulo, "No se encontraron recetas.");
            return;
        }

        let html = `<h3 class="mb-4">${titulo}</h3><div class="grid-recetas">`;

        recetas.forEach((receta) => {
            const esFav = window.Favoritos && window.Favoritos.esFavorito(receta.id);
            html += `
                <div class="card mb-3 shadow-sm receta-card position-relative" data-id="${receta.id}">
                    <button type="button"
                            class="btn btn-favorito position-absolute top-0 end-0 m-2"
                            data-id="${receta.id}"
                            title="Guardar en favoritos">
                        <span class="icono-favorito">${esFav ? "❤️" : "🤍"}</span>
                    </button>

                    <div class="row g-0 align-items-center">
                        <div class="col-md-8">
                            <div class="card-body">
                                <h4 class="card-title">${receta.nombre}</h4>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <img
                                src="${receta.imagen}"
                                class="img-fluid rounded-end w-100 receta-img"
                                alt="${receta.nombre}">
                        </div>
                    </div>
                </div>
            `;
        });

        html += "</div>";
        contenidoPlatos.innerHTML = html;

        document.querySelectorAll(".receta-card").forEach((card) => {
            card.addEventListener("click", () => abrirModalReceta(card.dataset.id));
        });

        document.querySelectorAll(".btn-favorito").forEach((boton) => {
            boton.addEventListener("click", (evento) => {
                evento.stopPropagation();
                manejarClickFavorito(boton.dataset.id, boton.querySelector(".icono-favorito"));
            });
        });
    }

    function manejarClickFavorito(idMeal, iconoEl) {
        if (!window.Favoritos || !window.Favoritos.estaLogueado()) {
            bootstrap.Modal.getOrCreateInstance(document.getElementById("authModal")).show();
            return;
        }

        const esFavAhora = window.Favoritos.toggle(idMeal);
        if (iconoEl) iconoEl.textContent = esFavAhora ? "❤️" : "🤍";

        if (vistaActual.tipo === "favoritos" && !esFavAhora) {
            cargarFavoritos();
        }
    }

    async function cargarFavoritos() {
        vistaActual = { tipo: "favoritos", valor: "categoria-favoritos" };
        marcarBotonActivo("categoria-favoritos");

        if (!window.Favoritos || !window.Favoritos.estaLogueado()) {
            mostrarMensaje(
                "Mis Favoritos",
                "Inicia sesión para guardar y ver tus recetas favoritas.",
                `<button class="btn btn-login w-auto px-4" data-bs-toggle="modal" data-bs-target="#authModal">Iniciar sesión</button>`
            );
            return;
        }

        const ids = window.Favoritos.listar();
        if (ids.length === 0) {
            mostrarMensaje("Mis Favoritos", "Aún no agregaste recetas. Toca el ♡ de una receta para guardarla aquí.");
            return;
        }

        mostrarCargando("Mis Favoritos");
        try {
            const detalles = await Promise.all(ids.map((id) => obtenerDetalleReceta(id).catch(() => null)));
            const recetas = quitarDuplicados(
                detalles
                    .filter(Boolean)
                    .map((d) => ({ id: d.id, nombre: d.titulo, imagen: d.imagen }))
            );
            renderizarListado("Mis Favoritos", recetas);
        } catch (error) {
            mostrarError("Mis Favoritos", "No se pudieron cargar tus favoritos. Intenta nuevamente.");
            console.error(error);
        }
    }

    document.addEventListener("favoritos:actualizados", () => {
        if (!window.Favoritos) return;

        if (vistaActual.tipo === "favoritos") {
            cargarFavoritos();
            return;
        }

        document.querySelectorAll(".btn-favorito .icono-favorito").forEach((icono) => {
            const idMeal = icono.closest(".btn-favorito").dataset.id;
            icono.textContent = window.Favoritos.esFavorito(idMeal) ? "❤️" : "🤍";
        });

        const idModalAbierto = document.getElementById("modalFavoritoBtn")?.dataset.id;
        const iconoModal = document.getElementById("modalFavoritoIcono");
        if (iconoModal && idModalAbierto) {
            iconoModal.textContent = window.Favoritos.esFavorito(idModalAbierto) ? "❤️" : "🤍";
        }
    });

    function pintarDetalleModal(detalle, enEspanol) {
        document.getElementById("modalTitulo").innerText = enEspanol ? detalle.tituloEs : detalle.titulo;
        document.getElementById("modalImagen").src = detalle.imagen;
        document.getElementById("modalImagen").alt = detalle.titulo;
        document.getElementById("modalDescripcion").innerText = enEspanol ? detalle.descripcionEs : detalle.descripcion;

        const lista = document.getElementById("modalIngredientes");
        lista.innerHTML = "";
        detalle.ingredientes.forEach((ingrediente, i) => {
            const nombreMostrado = enEspanol ? detalle.ingredientesEs[i] : ingrediente.nombre;
            const medida = ingrediente.medida ? ` <span class="text-muted">(${ingrediente.medida})</span>` : "";
            lista.innerHTML += `
                <li class="list-group-item d-flex align-items-center">
                    <img
                        src="${ingrediente.imagen}"
                        width="50" height="50"
                        class="rounded me-3"
                        style="object-fit:cover;"
                        onerror="this.style.display='none'">
                    <strong>${nombreMostrado}</strong>${medida}
                </li>
            `;
        });
    }

    async function abrirModalReceta(idMeal) {
        document.getElementById("modalTitulo").innerText = "Cargando...";
        document.getElementById("modalImagen").src = "";
        document.getElementById("modalDescripcion").innerText = "";
        document.getElementById("modalIngredientes").innerHTML = "";

        const modalFavoritoBtn = document.getElementById("modalFavoritoBtn");
        const modalFavoritoIcono = document.getElementById("modalFavoritoIcono");
        const modalTraducirBtn = document.getElementById("modalTraducirBtn");

        modalFavoritoBtn.dataset.id = idMeal;
        modalFavoritoIcono.textContent = window.Favoritos && window.Favoritos.esFavorito(idMeal) ? "❤️" : "🤍";
        modalFavoritoBtn.onclick = () => manejarClickFavorito(idMeal, modalFavoritoIcono);

        modalTraducirBtn.textContent = "🌐 Traducir";
        modalTraducirBtn.disabled = false;

        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalReceta"));
        modal.show();

        try {
            const detalle = await obtenerDetalleReceta(idMeal);
            if (!detalle) {
                document.getElementById("modalTitulo").innerText = "Receta no encontrada";
                return;
            }

            pintarDetalleModal(detalle, false);

            let mostrandoEspanol = false;
            modalTraducirBtn.onclick = async () => {
                if (!mostrandoEspanol) {
                    modalTraducirBtn.disabled = true;
                    modalTraducirBtn.textContent = "Traduciendo...";
                    try {
                        await traducirReceta(detalle);
                        mostrandoEspanol = true;
                        pintarDetalleModal(detalle, true);
                        modalTraducirBtn.textContent = "🌐 Ver en inglés";
                    } catch (error) {
                        console.error(error);
                        modalTraducirBtn.textContent = "🌐 Traducir";
                        alert("No se pudo traducir la receta en este momento. Intenta de nuevo.");
                    } finally {
                        modalTraducirBtn.disabled = false;
                    }
                } else {
                    mostrandoEspanol = false;
                    pintarDetalleModal(detalle, false);
                    modalTraducirBtn.textContent = "🌐 Traducir";
                }
            };
        } catch (error) {
            document.getElementById("modalTitulo").innerText = "Error al cargar la receta";
            console.error(error);
        }
    }

    async function cargarCategoria(idBoton) {
        const config = MAPA_CATEGORIAS[idBoton];
        if (!config) return;

        vistaActual = { tipo: "categoria", valor: idBoton };
        marcarBotonActivo(idBoton);
        mostrarCargando(config.titulo);

        try {
            const listas = await Promise.all(config.mealdb.map(obtenerListaPorCategoria));
            const recetas = quitarDuplicados(listas.flat());
            renderizarListado(config.titulo, recetas);
        } catch (error) {
            mostrarError(config.titulo, "No se pudieron cargar las recetas. Intenta nuevamente.");
            console.error(error);
        }
    }

    async function cargarTodo() {
        vistaActual = { tipo: "categoria", valor: "categoria-todo" };
        marcarBotonActivo("categoria-todo");
        mostrarCargando("Todos los platillos");

        try {
            const nombresUnicos = [...new Set(Object.values(MAPA_CATEGORIAS).flatMap((c) => c.mealdb))];
            const listas = await Promise.all(nombresUnicos.map(obtenerListaPorCategoria));
            const recetas = quitarDuplicados(
                listas.flatMap((lista) => lista.slice(0, LIMITE_POR_CATEGORIA_EN_TODO))
            );
            renderizarListado("Todos los platillos", recetas);
        } catch (error) {
            mostrarError("Todos los platillos", "No se pudieron cargar las recetas. Intenta nuevamente.");
            console.error(error);
        }
    }

    async function realizarBusqueda(texto) {
        const consulta = texto.trim();
        if (!consulta) {
            cargarTodo();
            return;
        }

        vistaActual = { tipo: "busqueda", valor: consulta };
        marcarBotonActivo(null);
        mostrarCargando(`Resultados para "${consulta}"`);

        try {
            const recetas = await buscarRecetasEnApi(consulta);
            renderizarListado(`Resultados para "${consulta}"`, recetas);
        } catch (error) {
            mostrarError(`Resultados para "${consulta}"`, "No se pudo completar la búsqueda. Intenta nuevamente.");
            console.error(error);
        }

        const menu = document.getElementById("menu");
        if (menu && menu.classList.contains("show")) {
            bootstrap.Collapse.getOrCreateInstance(menu).hide();
        }
    }

    let timerBusqueda = null;
    if (buscarInput) {
        buscarInput.addEventListener("input", () => {
            if (timerBusqueda) clearTimeout(timerBusqueda);
            const valor = buscarInput.value;
            timerBusqueda = setTimeout(() => realizarBusqueda(valor), 450);
        });
    }
    if (buscarForm) {
        buscarForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (timerBusqueda) clearTimeout(timerBusqueda);
            realizarBusqueda(buscarInput.value);
        });
    }

    document.getElementById("categoria-todo")?.addEventListener("click", cargarTodo);
    document.getElementById("categoria-favoritos")?.addEventListener("click", cargarFavoritos);

    Object.keys(MAPA_CATEGORIAS).forEach((idBoton) => {
        document.getElementById(idBoton)?.addEventListener("click", () => cargarCategoria(idBoton));
    });

    cargarTodo();
})();
