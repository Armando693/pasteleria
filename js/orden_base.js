import {
    auth,
    db,
    onAuthStateChanged,
    signOut,
    collection,
    addDoc
} from "./firebase.js";

const loginItem = document.getElementById("login-item");
const btnLogout = document.getElementById("btnLogout");
const userNameItem = document.getElementById("user-name");
const nombreUsuarioSpan = document.getElementById("nombre-usuario");

const formOrden = document.getElementById("form-orden");

onAuthStateChanged(auth, (user) => {
    if (user) {
        mostrarPanelUsuario(user);
    } else {
        ocultarPanelUsuario();
        verificarAccesoPedido();
    }
});

function mostrarPanelUsuario(user) {
    if (loginItem) loginItem.style.display = "none";
    if (btnLogout) btnLogout.style.display = "inline-block";

    if (userNameItem && nombreUsuarioSpan) {
        const nombre =
            user.displayName ||
            localStorage.getItem("nombreUsuario") ||
            "Usuario";

        nombreUsuarioSpan.textContent = nombre;
        userNameItem.style.display = "inline-block";
    }

    autocompletarFormulario(user);
}

function ocultarPanelUsuario() {
    if (loginItem) loginItem.style.display = "inline-block";
    if (btnLogout) btnLogout.style.display = "none";
    if (userNameItem) userNameItem.style.display = "none";
}

function verificarAccesoPedido() {
    // Si estamos en la página de pedidos, obligar inicio de sesión
    if (formOrden) {
        alert("⚠️ Debes iniciar sesión para hacer un pedido.");
        window.location.href = "login.html";
    }
}

function autocompletarFormulario(user) {
    const nombreInput = document.getElementById("nombre");
    const emailInput = document.getElementById("email");

    const savedNombre = localStorage.getItem("nombreUsuario");
    const savedEmail = localStorage.getItem("correoUsuario");

    if (nombreInput) nombreInput.value = savedNombre || user.displayName || "";
    if (emailInput) emailInput.value = savedEmail || user.email || "";
}

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

if (formOrden) {
    formOrden.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Validación reCAPTCHA
        const recaptchaResponse = grecaptcha.getResponse();
        if (!recaptchaResponse) {
            alert("⚠️ Por favor verifica el CAPTCHA.");
            return;
        }

        // Validar carrito
        if (cart.length === 0) {
            alert("⚠️ Tu carrito está vacío.");
            return;
        }

        // Obtener valores
        const nombre = document.getElementById("nombre").value;
        const telefono = document.getElementById("telefono").value;
        const email = document.getElementById("email").value;
        const fechaEntrega = document.getElementById("fecha-entrega").value;
        const horaEntrega = document.getElementById("hora-entrega").value;
        const direccion = document.getElementById("direccion").value;
        const mensaje = document.getElementById("mensaje").value;
        const metodoPago = document.getElementById("metodo-pago").value;

        try {
            await addDoc(collection(db, "pedidos"), {
                nombre,
                telefono,
                email,
                fechaEntrega,
                horaEntrega,
                direccion,
                mensaje,
                metodoPago,
                productos: cart,
                extras: extrasSeleccionados,
                subtotal: cart.reduce((sum, p) => sum + p.precio * p.cantidad, 0),
                totalExtras,
                total:
                    cart.reduce((sum, p) => sum + p.precio * p.cantidad, 0) +
                    totalExtras,
                fechaRegistro: new Date().toISOString(),
                recaptchaVerified: true
            });

            alert("🎉 Pedido enviado correctamente. ¡Gracias por confiar en Cuyecitos!");

            // Limpiar todo
            cart = [];
            extrasSeleccionados = [];
            totalExtras = 0;

            updateCart();
            updateExtrasTotal();
            updateOrderSummary();

            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

            formOrden.reset();
            grecaptcha.reset();

        } catch (error) {
            console.error("Error al guardar pedido:", error);
            alert("❌ Ocurrió un error al enviar tu pedido.");
        }
    });
}
