// Importar todo desde firebase.js
import {
    auth,
    db,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    doc,
    getDoc
} from "./firebase.js";


// --- INICIO DE SESIÓN ---
const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        // 🔐 Iniciar sesión
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Validar verificación
        if (!user.emailVerified) {
            alert("⚠️ Debes verificar tu correo antes de ingresar.");
            await signOut(auth);
            return;
        }

        // 🔎 Buscar datos del usuario en Firestore (doc por UID)
        const ref = doc(db, "usuarios", user.uid);
        const snap = await getDoc(ref);

        let nombreUsuario = email;
        let rolUsuario = "usuario";

        if (snap.exists()) {
            const datos = snap.data();
            nombreUsuario = datos.nombre || email;
            rolUsuario = datos.rol || "usuario";
        }

        // 💾 Guardar en localStorage
        const usuario = {
            uid: user.uid,
            email: email,
            nombre: nombreUsuario,
            rol: rolUsuario
        };

        localStorage.setItem("usuario", JSON.stringify(usuario));

        alert(`¡Bienvenido, ${nombreUsuario}! 🎉`);
        window.location.href = "index.html";

    } catch (error) {
        alert("❌ Error al iniciar sesión: " + error.message);
        console.error(error);
    }
});


// --- REESTABLECER CONTRASEÑA ---
const resetLink = document.getElementById("resetPasswordLink");

resetLink.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = prompt("💌 Ingresa tu correo para restablecer la contraseña:");
    if (!email) return;

    try {
        await sendPasswordResetEmail(auth, email);
        alert("✅ Se envió un correo para restablecer tu contraseña.");
    } catch (error) {
        alert("❌ Error: " + error.message);
    }
});


// --- SI YA HAY SESIÓN INICIADA ---
window.addEventListener("DOMContentLoaded", () => {
    const usuarioGuardado = localStorage.getItem("usuario");

    if (usuarioGuardado) {
        console.log("Usuario ya logueado:", JSON.parse(usuarioGuardado).email);
    }
});
