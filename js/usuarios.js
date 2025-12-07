// usuarios.js
import {
    auth,
    db,
    // Auth
    onAuthStateChanged,
    verifyBeforeUpdateEmail,
    // Firestore
    collection,
    getDocs,
    updateDoc,
    doc,
    query,
    where
} from "./firebase.js";  // <--- Usa tu archivo firebase.js

let usuariosCargados = []; // Lista de usuarios cargados

// 🔐 Verificar que el usuario actual sea admin
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        alert("⚠️ Debes iniciar sesión como administrador.");
        window.location.href = "login.html";
        return;
    }

    try {
        // Buscar rol en Firestore
        const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn("⚠️ No se encontró el usuario en Firestore.");
            alert("❌ No tienes permisos para acceder a esta página.");
            window.location.href = "index.html";
            return;
        }

        const datos = querySnapshot.docs[0].data();
        console.log("Usuario actual:", datos);

        if (datos.rol === "admin") {
            console.log("✅ Acceso concedido. Bienvenido admin.");
            cargarUsuarios();
        } else {
            alert("❌ No tienes permisos para acceder a esta página.");
            window.location.href = "index.html";
        }
    } catch (error) {
        console.error("Error verificando rol de usuario:", error);
        alert("⚠️ Ocurrió un error al verificar permisos.");
        window.location.href = "index.html";
    }
});

// 📦 Cargar todos los usuarios
async function cargarUsuarios() {
    const tabla = document.querySelector("#tablaUsuarios tbody");
    tabla.innerHTML = "<tr><td colspan='5'>Cargando...</td></tr>";

    const usuariosRef = collection(db, "usuarios");
    const snapshot = await getDocs(usuariosRef);
    usuariosCargados = [];

    snapshot.forEach((docu) => {
        usuariosCargados.push({ id: docu.id, ...docu.data() });
    });

    mostrarUsuarios(usuariosCargados);
}

// 🧩 Mostrar usuarios en tabla
function mostrarUsuarios(lista) {
    const tabla = document.querySelector("#tablaUsuarios tbody");
    tabla.innerHTML = "";

    if (lista.length === 0) {
        tabla.innerHTML = "<tr><td colspan='5'>No se encontraron usuarios.</td></tr>";
        return;
    }

    lista.forEach((u) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${u.nombre || "-"}</td>
            <td>${u.apellido || "-"}</td>
            <td><input type="email" value="${u.email}" data-uid="${u.uid}" class="input-email" style="width: 90%"></td>
            <td>
                <select class="input-rol" data-uid="${u.uid}">
                    <option value="usuario" ${u.rol === "usuario" ? "selected" : ""}>Usuario</option>
                    <option value="admin" ${u.rol === "admin" ? "selected" : ""}>Admin</option>
                </select>
            </td>
            <td><button class="btn-guardar" data-uid="${u.uid}">💾 Guardar</button></td>
        `;
        tabla.appendChild(fila);
    });

    // 🎯 Escuchar clics en los botones de guardar
    document.querySelectorAll(".btn-guardar").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const uid = e.target.getAttribute("data-uid");
            const nuevoEmail = document.querySelector(`.input-email[data-uid="${uid}"]`).value;
            const nuevoRol = document.querySelector(`.input-rol[data-uid="${uid}"]`).value;

            try {
                const q = query(collection(db, "usuarios"), where("uid", "==", uid));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const userDoc = snapshot.docs[0];
                    const ref = doc(db, "usuarios", userDoc.id);
                    const usuarioActual = auth.currentUser;

                    // 👮 Si el admin cambia SU PROPIO CORREO
                    if (usuarioActual.uid === uid && usuarioActual.email !== nuevoEmail) {
                        const modal = document.getElementById("modalReauth");
                        const inputPass = document.getElementById("inputPasswordReauth");
                        const btnConfirmar = document.getElementById("btnConfirmarReauth");
                        const btnCancelar = document.getElementById("btnCancelarReauth");

                        modal.classList.remove("hidden");
                        inputPass.value = "";
                        inputPass.focus();

                        const cerrarModal = () => modal.classList.add("hidden");
                        btnCancelar.onclick = cerrarModal;

                        btnConfirmar.onclick = async () => {
                            const pass = inputPass.value.trim();
                            if (!pass) {
                                alert("⚠️ Ingresa tu contraseña.");
                                return;
                            }

                            try {
                                const { EmailAuthProvider, reauthenticateWithCredential } =
                                    await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js");

                                const credencial = EmailAuthProvider.credential(usuarioActual.email, pass);
                                await reauthenticateWithCredential(usuarioActual, credencial);

                                // Enviar correo de verificación
                                await verifyBeforeUpdateEmail(usuarioActual, nuevoEmail);
                                alert("📧 Se envió un correo para confirmar el cambio de dirección.");
                                cerrarModal();
                            } catch (error) {
                                console.error("Error en reautenticación:", error);
                                alert("❌ Error: " + error.message);
                            }
                        };
                    }

                    // 🔄 Actualizar Firestore
                    await updateDoc(ref, { email: nuevoEmail, rol: nuevoRol });
                    alert("✅ Cambios guardados correctamente.");
                }
            } catch (error) {
                console.error("Error al actualizar usuario:", error);
                alert("❌ Error: " + error.message);
            }
        });
    });
}

// 🔍 Búsqueda dinámica
const buscador = document.getElementById("buscador");
buscador.addEventListener("input", () => {
    const texto = buscador.value.toLowerCase();
    const filtrados = usuariosCargados.filter(u =>
        (u.nombre && u.nombre.toLowerCase().includes(texto)) ||
        (u.email && u.email.toLowerCase().includes(texto))
    );
    mostrarUsuarios(filtrados);
});
