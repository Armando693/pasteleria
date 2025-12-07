// Importar Firebase desde firebase.js
import {
    auth,
    db,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    updateProfile,
    addDoc,
    collection,
} from "./firebase.js";

// Referencias al formulario
const form = document.getElementById("registroForm");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const errorMensaje = document.getElementById("errorMensaje");

// Evento submit
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validar contraseñas
    if (password.value !== confirmPassword.value) {
        errorMensaje.textContent = "Las contraseñas no coinciden.";
        return;
    }

    errorMensaje.textContent = "";

    // Obtener datos del formulario
    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const email = document.getElementById("email").value.trim();
    const pass = password.value;

    try {
        // Crear usuario en Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // Enviar correo de verificación
        await sendEmailVerification(user);
        alert("Se ha enviado un correo de verificación. Por favor, verifica tu correo antes de iniciar sesión.");

        // Actualizar perfil (nombre completo)
        await updateProfile(user, {
            displayName: `${nombre} ${apellido}`,
        });

        // Guardar datos en Firestore
        await addDoc(collection(db, "usuarios"), {
            uid: user.uid,
            nombre: nombre,
            apellido: apellido,
            email: email,
            creadoEn: new Date(),
            rol: "usuario",     // Default
            verificado: false
        });

        alert("Registro exitoso 🎉");

        // 🔒 Cerrar sesión hasta que verifique su correo
        await auth.signOut();

        // Redirigir al login
        window.location.href = "login.html";

    } catch (error) {
        console.error("Error en registro:", error);
        errorMensaje.textContent = "Error al registrar: " + error.message;
    }
});
