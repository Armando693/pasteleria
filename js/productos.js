// Importar Firebase ya inicializado
import {
    auth,
    db,
    signOut,
    onAuthStateChanged,
    collection,
    query,
    where,
    getDocs,
    doc
} from "./firebase.js";

// 🔐 Verificar Rol del Usuario
onAuthStateChanged(auth, async (user) => {
    const btnAgregar = document.getElementById("btnAgregarProducto");
    const btnEditar = document.getElementById("btnEditarProducto");

    if (!btnAgregar || !btnEditar) return;

    if (user) {
        // Buscar usuario por UID en Firestore
        const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
        const snap = await getDocs(q);

        if (!snap.empty) {
            const datos = snap.docs[0].data();
            const rol = datos.rol;

            // Mostrar botones solo si es admin
            if (rol === "admin") {
                btnAgregar.style.display = "block";
                btnEditar.style.display = "block";
            } else {
                btnAgregar.style.display = "none";
                btnEditar.style.display = "none";
            }
        } else {
            btnAgregar.style.display = "none";
            btnEditar.style.display = "none";
        }
    } else {
        btnAgregar.style.display = "none";
        btnEditar.style.display = "none";
    }
});

// 👤 Mostrar nombre y logout
document.addEventListener("DOMContentLoaded", () => {
    const btnLogout = document.getElementById("btnLogout");
    const loginItem = document.getElementById("login-item");
    const userNameItem = document.getElementById("user-name");
    const nombreSpan = document.getElementById("nombre-usuario");

    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (loginItem) loginItem.style.display = "none";
            if (btnLogout) btnLogout.style.display = "inline-block";

            const usuarioLocal = JSON.parse(localStorage.getItem("usuario")) || {};
            if (userNameItem && nombreSpan) {
                nombreSpan.textContent = usuarioLocal.nombre || "Usuario";
                userNameItem.style.display = "inline-block";
            }
        } else {
            if (loginItem) loginItem.style.display = "inline-block";
            if (btnLogout) btnLogout.style.display = "none";
            if (userNameItem) userNameItem.style.display = "none";
        }
    });

    // Logout
    if (btnLogout) {
        btnLogout.addEventListener("click", async () => {
            try {
                await signOut(auth);
                localStorage.clear();
                alert("👋 Sesión cerrada correctamente");
                window.location.href = "index.html";
            } catch (error) {
                alert("❌ Error al cerrar sesión: " + error.message);
            }
        });
    }
});

// 🛒 Botones de administración
document.getElementById("btnAgregarProducto")?.addEventListener("click", () => {
    window.location.href = "AgregarProducto.html";
});

document.getElementById("btnEditarProducto")?.addEventListener("click", () => {
    window.location.href = "panel_admin.html";
});

// 🍰 Cargar Productos
async function cargarProductos() {
    const contenedor = document.getElementById("productos-container");
    contenedor.innerHTML = "<p>Cargando productos...</p>";

    try {
        const snap = await getDocs(collection(db, "productos"));
        contenedor.innerHTML = "";

        snap.forEach((doc) => {
            const producto = doc.data();

            const card = document.createElement("div");
            card.classList.add("producto-item");
            card.setAttribute("data-categoria", producto.categoria);

            card.innerHTML = `
                <img src="${producto.imagen}" alt="${producto.nombre}">
                <h3>${producto.nombre}</h3>
                <p class="descripcion">${producto.descripcion}</p>
                <p class="ingredientes"><strong>Ingredientes:</strong> ${producto.ingredientes}</p>
                <div class="precio-carrito">
                    <p class="precio">$${producto.precio} MXN</p>
                    <button class="btn-agregar">
                        <i class="fas fa-shopping-cart"></i>
                    </button>
                </div>
            `;

            // Acción del botón
            card.querySelector(".btn-agregar").addEventListener("click", () => {
                addToCart(producto.nombre, parseFloat(producto.precio));
            });

            contenedor.appendChild(card);
        });

    } catch (error) {
        console.error("Error al cargar productos:", error);
        contenedor.innerHTML = "<p>Error al cargar los productos 😢</p>";
    }
}

cargarProductos();
