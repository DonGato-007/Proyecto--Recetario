
(() => {
    const categoriaTodo = document.getElementById("categoria-todo");
    const contenidoPlatos = document.getElementById("contenido-platos");

    const API_BASE = "https://www.themealdb.com/api/json/v1/1";

    // ---------- Mapeo: botón local -> categorías ----------
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

    // ---------- Caché en memoria (dura mientras la pestaña esté abierta) ----------
    const cacheListasPorCategoria = new Map(); 
    const cacheDetallePorId = new Map(); 

    // ---------- Llamadas a TheMealDB ----------

    async function obtenerListaPorCategoria(nombreMealdb) {
        if (cacheListasPorCategoria.has(nombreMealdb)) {
            return cacheListasPorCategoria.get(nombreMealdb);
        }

        const respuesta = await fetch(
            `${API_BASE}/filter.php?c=${encodeURIComponent(nombreMealdb)}`
        );

        if (!respuesta.ok) {
            throw new Error(`No se pudo cargar la categoría "${nombreMealdb}"`);
        }

        const datos = await respuesta.json();

      
        const lista = (datos.meals || []).map((meal) => ({
            id: meal.idMeal,
            nombre: meal.strMeal,
            imagen: meal.strMealThumb,
        }));

        cacheListasPorCategoria.set(nombreMealdb, lista);
        return lista;
    }

    async function obtenerDetalleReceta(idMeal) {
        if (cacheDetallePorId.has(idMeal)) {
            return cacheDetallePorId.get(idMeal);
        }

        const respuesta = await fetch(
            `${API_BASE}/lookup.php?i=${encodeURIComponent(idMeal)}`
        );

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar el detalle de la receta");
        }

        const datos = await respuesta.json();
        const meal = (datos.meals || [])[0];

        if (!meal) return null;

        const detalle = {
            titulo: meal.strMeal,
            imagen: meal.strMealThumb,
            descripcion: meal.strInstructions,
            ingredientes: extraerIngredientes(meal),
        };

        cacheDetallePorId.set(idMeal, detalle);
        return detalle;
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
                
                nombre: medidaLimpia ? `${nombreLimpio} (${medidaLimpia})` : nombreLimpio,

                imagen: `https://www.themealdb.com/images/ingredients/${encodeURIComponent(nombreLimpio)}-Small.png`,
            });
        }

        return ingredientes;
    }

    // ---------- Render ----------

    function mostrarCargando(titulo) {
        contenidoPlatos.innerHTML = `
      <h3 class="mb-4">${titulo}</h3>
      <p class="text-muted">Cargando recetas...</p>
    `;
    }

    function mostrarError(titulo, mensaje) {
        contenidoPlatos.innerHTML = `
      <h3 class="mb-4">${titulo}</h3>
      <p class="text-danger">${mensaje}</p>
    `;
    }

    function renderizarListado(titulo, recetas) {
        if (recetas.length === 0) {
            contenidoPlatos.innerHTML = `
        <h3 class="mb-4">${titulo}</h3>
        <p class="text-muted">No se encontraron recetas en esta categoría.</p>
      `;
            return;
        }

        let html = `<h3 class="mb-4">${titulo}</h3>`;

        recetas.forEach((receta) => {
            html += `
        <div class="card mb-3 shadow-sm receta-card"
             data-id="${receta.id}"
             style="cursor:pointer;">

          <div class="row g-0 align-items-center">

            <div class="col-md-8">
              <div class="card-body">
                <h4 class="card-title">${receta.nombre}</h4>
              </div>
            </div>

            <div class="col-md-4">
              <img
                src="${receta.imagen}"
                class="img-fluid rounded-end w-100"
                style="height:220px;object-fit:cover;"
                alt="${receta.nombre}">
            </div>

          </div>
        </div>
      `;
        });

        contenidoPlatos.innerHTML = html;

        document.querySelectorAll(".receta-card").forEach((card) => {
            card.addEventListener("click", () => abrirModalReceta(card.dataset.id));
        });
    }

    async function abrirModalReceta(idMeal) {
        document.getElementById("modalTitulo").innerText = "Cargando...";
        document.getElementById("modalImagen").src = "";
        document.getElementById("modalDescripcion").innerText = "";
        document.getElementById("modalIngredientes").innerHTML = "";

        const modal = bootstrap.Modal.getOrCreateInstance(
            document.getElementById("modalReceta")
        );
        modal.show();

        try {
            const detalle = await obtenerDetalleReceta(idMeal);

            if (!detalle) {
                document.getElementById("modalTitulo").innerText = "Receta no encontrada";
                return;
            }

            document.getElementById("modalTitulo").innerText = detalle.titulo;
            document.getElementById("modalImagen").src = detalle.imagen;
            document.getElementById("modalDescripcion").innerText = detalle.descripcion;

            const lista = document.getElementById("modalIngredientes");
            lista.innerHTML = "";

            detalle.ingredientes.forEach((ingrediente) => {
                lista.innerHTML += `
          <li class="list-group-item d-flex align-items-center">
            <img
              src="${ingrediente.imagen}"
              width="60"
              height="60"
              class="rounded me-3"
              style="object-fit:cover;"
              onerror="this.style.display='none'">
            <strong>${ingrediente.nombre}</strong>
          </li>
        `;
            });
        } catch (error) {
            document.getElementById("modalTitulo").innerText = "Error al cargar la receta";
            console.error(error);
        }
    }

    // ---------- Carga por categoría (botón individual) ----------

    async function cargarCategoria(idBoton) {
        const config = MAPA_CATEGORIAS[idBoton];
        if (!config) return;

        mostrarCargando(config.titulo);

        try {
          
            const listas = await Promise.all(
                config.mealdb.map((nombre) => obtenerListaPorCategoria(nombre))
            );
            const recetas = listas.flat();

            renderizarListado(config.titulo, recetas);
        } catch (error) {
            mostrarError(config.titulo, "No se pudieron cargar las recetas. Intenta nuevamente.");
            console.error(error);
        }
    }

    // ---------- Carga de "Todos los platillos" ----------

    async function cargarTodo() {
        mostrarCargando("Todos los platillos");

        try {
            const nombresUnicos = [
                ...new Set(Object.values(MAPA_CATEGORIAS).flatMap((c) => c.mealdb)),
            ];

            const listas = await Promise.all(
                nombresUnicos.map((nombre) => obtenerListaPorCategoria(nombre))
            );

            const recetas = listas.flatMap((lista) =>
                lista.slice(0, LIMITE_POR_CATEGORIA_EN_TODO)
            );

            renderizarListado("Todos los platillos", recetas);
        } catch (error) {
            mostrarError("Todos los platillos", "No se pudieron cargar las recetas. Intenta nuevamente.");
            console.error(error);
        }
    }

    // ---------- Inicialización ----------

    if (categoriaTodo) {
        categoriaTodo.addEventListener("click", cargarTodo);
    }

    Object.keys(MAPA_CATEGORIAS).forEach((idBoton) => {
        const boton = document.getElementById(idBoton);
        if (boton) {
            boton.addEventListener("click", () => cargarCategoria(idBoton));
        }
    });
})();