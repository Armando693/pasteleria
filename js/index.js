// Importar desde firebase.js
import {
    auth,
    signOut,
    onAuthStateChanged,
    db,
    collection,
    query,
    where,
    getDocs
} from "./firebase.js";

const btnLogout = document.getElementById("btnLogout");
const loginItem = document.getElementById("login-item");
const userNameItem = document.getElementById("user-name");
const nombreUsuarioSpan = document.getElementById("nombre-usuario");
const hamburger = document.getElementById("hamburgerAdmin");
const adminMenu = document.getElementById("adminMenu");

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Ocultar icono de login
        if (loginItem) loginItem.style.display = "none";
        if (btnLogout) btnLogout.style.display = "inline-block";

        // Mostrar nombre del usuario
        if (userNameItem && nombreUsuarioSpan) {
            const nombre = user.displayName || localStorage.getItem("nombreUsuario") || "Usuario";
            nombreUsuarioSpan.textContent = nombre;
            userNameItem.style.display = "inline-block";
        }

        // 🔍 Obtener rol del usuario desde Firestore
        const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();

            // ✔ Solo admins ven el menú hamburguesa
            if (data.rol === "admin") {
                if (hamburger) hamburger.classList.add("show");
            }
        }

    } else {
        // Usuario NO logueado
        if (loginItem) loginItem.style.display = "inline-block";
        if (btnLogout) btnLogout.style.display = "none";
        if (userNameItem) userNameItem.style.display = "none";

        // Ocultar hamburguesa
        if (hamburger) hamburger.classList.remove("show");
        if (adminMenu) adminMenu.classList.add("show");
    }
});

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

if (hamburger) {
    hamburger.addEventListener("click", () => {
        adminMenu.classList.toggle("show");
    });
}
