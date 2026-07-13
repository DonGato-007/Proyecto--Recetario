// categoria todo
const categoriaTodo = document.getElementById("categoria-todo");
const contenidoPlatos = document.getElementById("contenido-platos");

const recetas = [
{
    titulo: "Lomo Saltado",
    descripcion: "Saltear la carne junto con la cebolla, tomate y ají amarillo. Servir acompañado de papas fritas y arroz.",
    imagen: "assets/lomo.jpg",
    ingredientes: [
        { nombre: "Carne de res", imagen: "assets/ingredientes/carne.jpg" },
        { nombre: "Tomate", imagen: "assets/ingredientes/tomate.jpg" },
        { nombre: "Cebolla", imagen: "assets/ingredientes/cebolla.jpg" },
        { nombre: "Papa", imagen: "assets/ingredientes/papa.jpg" }
    ]
},
{
    titulo: "Arroz con Pollo",
    descripcion: "Preparar el arroz con culantro, cocinar el pollo y servir acompañado de salsa criolla.",
    imagen: "assets/arroz-pollo.jpg",
    ingredientes: [
        { nombre: "Pollo", imagen: "assets/ingredientes/pollo.jpg" },
        { nombre: "Arroz", imagen: "assets/ingredientes/arroz.jpg" },
        { nombre: "Culantro", imagen: "assets/ingredientes/culantro.jpg" },
        { nombre: "Arvejas", imagen: "assets/ingredientes/arvejas.jpg" }
    ]
},
{
    titulo: "Cheesecake",
    descripcion: "Preparar la base de galleta, agregar la mezcla de queso y refrigerar antes de servir.",
    imagen: "assets/cheesecake.jpg",
    ingredientes: [
        { nombre: "Queso crema", imagen: "assets/ingredientes/queso.jpg" },
        { nombre: "Galletas", imagen: "assets/ingredientes/galletas.jpg" },
        { nombre: "Mantequilla", imagen: "assets/ingredientes/mantequilla.jpg" },
        { nombre: "Frutos rojos", imagen: "assets/ingredientes/frutos.jpg" }
    ]
}
];

categoriaTodo.addEventListener("click", () => {

    contenidoPlatos.innerHTML = "<h3 class='mb-4'>Todos los platillos</h3>";

    recetas.forEach((receta, index) => {

        contenidoPlatos.innerHTML += `
        <div class="card mb-3 shadow-sm receta-card"
             data-index="${index}"
             style="cursor:pointer;">

            <div class="row g-0 align-items-center">

                <div class="col-md-8">

                    <div class="card-body">

                        <h4 class="card-title">${receta.titulo}</h4>

                        <p class="card-text">
                            ${receta.descripcion}
                        </p>

                    </div>

                </div>

                <div class="col-md-4">

                    <img
                        src="${receta.imagen}"
                        class="img-fluid rounded-end w-100"
                        style="height:220px;object-fit:cover;"
                        alt="${receta.titulo}">

                </div>

            </div>

        </div>
        `;

    });

    document.querySelectorAll(".receta-card").forEach(card => {

        card.addEventListener("click", () => {

            const receta = recetas[card.dataset.index];

            document.getElementById("modalTitulo").innerText = receta.titulo;

            document.getElementById("modalImagen").src = receta.imagen;

            document.getElementById("modalDescripcion").innerText = receta.descripcion;

            const lista = document.getElementById("modalIngredientes");

            lista.innerHTML = "";

            receta.ingredientes.forEach(ingrediente => {

                lista.innerHTML += `
                    <li class="list-group-item d-flex align-items-center">

                        <img
                            src="${ingrediente.imagen}"
                            width="60"
                            height="60"
                            class="rounded me-3"
                            style="object-fit:cover;">

                        <strong>${ingrediente.nombre}</strong>

                    </li>
                `;

            });

            const modal = new bootstrap.Modal(
                document.getElementById("modalReceta")
            );

            modal.show();

        });

    });

});

const categorias = {
    "categoria-todo": {
        titulo: "Todos los platillos",
        recetas: recetas
    },

    "categoria-carne": {
        titulo: "Platos con carne",
        recetas: [
            recetas[0]
        ]
    },

    "categoria-pollo": {
        titulo: "Platos con pollo",
        recetas: [
            recetas[1]
        ]
    },

    "categoria-postres": {
        titulo: "Postres",
        recetas: [
            recetas[2]
        ]
    },

    "categoria-pasta": {
        titulo: "Pasta / Fideos",
        recetas: [
            {
                titulo: "Spaghetti a la Boloñesa",
                descripcion: "Pasta acompañada de una deliciosa salsa boloñesa.",
                imagen: "assets/spaghetti.jpg",
                ingredientes: [
                    { nombre: "Spaghetti", imagen: "assets/ingredientes/spaghetti.jpg" },
                    { nombre: "Carne molida", imagen: "assets/ingredientes/carne.jpg" },
                    { nombre: "Salsa de tomate", imagen: "assets/ingredientes/salsa.jpg" }
                ]
            }
        ]
    },

    "categoria-tarta": {
        titulo: "Tartas y Empanadas",
        recetas: [
            {
                titulo: "Empanada de Carne",
                descripcion: "Empanada rellena de carne sazonada y horneada.",
                imagen: "assets/empanada.jpg",
                ingredientes: [
                    { nombre: "Masa", imagen: "assets/ingredientes/masa.jpg" },
                    { nombre: "Carne", imagen: "assets/ingredientes/carne.jpg" },
                    { nombre: "Cebolla", imagen: "assets/ingredientes/cebolla.jpg" }
                ]
            }
        ]
    },

    "categoria-mariscos": {
        titulo: "Mariscos y Pescados",
        recetas: [
            {
                titulo: "Ceviche",
                descripcion: "Pescado fresco marinado con limón y acompañado de camote.",
                imagen: "assets/ceviche.jpg",
                ingredientes: [
                    { nombre: "Pescado", imagen: "assets/ingredientes/pescado.jpg" },
                    { nombre: "Limón", imagen: "assets/ingredientes/limon.jpg" },
                    { nombre: "Cebolla", imagen: "assets/ingredientes/cebolla.jpg" }
                ]
            }
        ]
    },

    "categoria-entradas": {
        titulo: "Entradas",
        recetas: [
            {
                titulo: "Papa a la Huancaína",
                descripcion: "Papas cocidas bañadas en salsa de ají amarillo y queso.",
                imagen: "assets/huancaina.jpg",
                ingredientes: [
                    { nombre: "Papa", imagen: "assets/ingredientes/papa.jpg" },
                    { nombre: "Queso", imagen: "assets/ingredientes/queso.jpg" },
                    { nombre: "Ají amarillo", imagen: "assets/ingredientes/aji.jpg" }
                ]
            }
        ]
    },

    "categoria-desayunos": {
        titulo: "Desayunos",
        recetas: [
            {
                titulo: "Panqueques",
                descripcion: "Panqueques esponjosos acompañados con miel.",
                imagen: "assets/panqueques.jpg",
                ingredientes: [
                    { nombre: "Harina", imagen: "assets/ingredientes/harina.jpg" },
                    { nombre: "Leche", imagen: "assets/ingredientes/leche.jpg" },
                    { nombre: "Huevo", imagen: "assets/ingredientes/huevo.jpg" }
                ]
            }
        ]
    },

    "categoria-vegana": {
        titulo: "Comida Vegana",
        recetas: [
            {
                titulo: "Ensalada Vegana",
                descripcion: "Ensalada fresca con vegetales y palta.",
                imagen: "assets/vegana.jpg",
                ingredientes: [
                    { nombre: "Lechuga", imagen: "assets/ingredientes/lechuga.jpg" },
                    { nombre: "Tomate", imagen: "assets/ingredientes/tomate.jpg" },
                    { nombre: "Palta", imagen: "assets/ingredientes/palta.jpg" }
                ]
            }
        ]
    },

    "categoria-vegetariana": {
        titulo: "Comida Vegetariana",
        recetas: [
            {
                titulo: "Tortilla de Verduras",
                descripcion: "Tortilla preparada con verduras frescas.",
                imagen: "assets/tortilla.jpg",
                ingredientes: [
                    { nombre: "Huevo", imagen: "assets/ingredientes/huevo.jpg" },
                    { nombre: "Espinaca", imagen: "assets/ingredientes/espinaca.jpg" },
                    { nombre: "Zanahoria", imagen: "assets/ingredientes/zanahoria.jpg" }
                ]
            }
        ]
    },

    "categoria-mas": {
        titulo: "Más recetas",
        recetas: [
            {
                titulo: "Pizza Casera",
                descripcion: "Pizza preparada con masa artesanal y queso mozzarella.",
                imagen: "assets/pizza.jpg",
                ingredientes: [
                    { nombre: "Harina", imagen: "assets/ingredientes/harina.jpg" },
                    { nombre: "Queso", imagen: "assets/ingredientes/queso.jpg" },
                    { nombre: "Tomate", imagen: "assets/ingredientes/tomate.jpg" }
                ]
            }
        ]
    }
};

Object.keys(categorias).forEach(id => {

    document.getElementById(id).addEventListener("click", () => {

        const categoria = categorias[id];

        contenidoPlatos.innerHTML = `<h3 class="mb-4">${categoria.titulo}</h3>`;

        categoria.recetas.forEach((receta, index) => {

            contenidoPlatos.innerHTML += `
                <div class="card mb-3 shadow-sm receta-card"
                     data-index="${index}"
                     style="cursor:pointer;">

                    <div class="row g-0 align-items-center">

                        <div class="col-md-8">
                            <div class="card-body">
                                <h4>${receta.titulo}</h4>
                                <p>${receta.descripcion}</p>
                            </div>
                        </div>

                        <div class="col-md-4">
                            <img src="${receta.imagen}"
                                 class="img-fluid rounded-end w-100"
                                 style="height:220px;object-fit:cover;">
                        </div>

                    </div>
                </div>
            `;
        });

        document.querySelectorAll(".receta-card").forEach(card => {

            card.addEventListener("click", () => {

                const receta = categoria.recetas[card.dataset.index];

                document.getElementById("modalTitulo").innerText = receta.titulo;
                document.getElementById("modalImagen").src = receta.imagen;
                document.getElementById("modalDescripcion").innerText = receta.descripcion;

                const lista = document.getElementById("modalIngredientes");
                lista.innerHTML = "";

                receta.ingredientes.forEach(ingrediente => {

                    lista.innerHTML += `
                        <li class="list-group-item d-flex align-items-center">
                            <img src="${ingrediente.imagen}"
                                 width="60"
                                 height="60"
                                 class="rounded me-3"
                                 style="object-fit:cover;">
                            <strong>${ingrediente.nombre}</strong>
                        </li>
                    `;

                });

                bootstrap.Modal.getOrCreateInstance(
                    document.getElementById("modalReceta")
                ).show();

            });

        });

    });

});