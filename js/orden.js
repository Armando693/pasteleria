function updateOrderSummary() {
    console.log('Actualizando resumen del pedido...');

    const resumenItems = document.getElementById('resumen-items');
    const resumenExtras = document.getElementById('resumen-extras');
    const resumenSubtotal = document.getElementById('resumen-subtotal');
    const resumenExtrasTotal = document.getElementById('resumen-extras-total');
    const resumenTotal = document.getElementById('resumen-total');

    // -------- Productos --------
    if (resumenItems) {
        resumenItems.innerHTML = '';

        if (cart.length === 0) {
            resumenItems.innerHTML = `
                <div class="empty-cart-message">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Tu carrito está vacío</p>
                    <a href="productos.html" class="btn btn-outline">Ver Productos</a>
                </div>
            `;
        } else {
            cart.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'resumen-item-alt';
                div.dataset.index = index;

                div.innerHTML = `
                    <div class="resumen-item-content-alt">
                        <div class="resumen-item-info">
                            <strong>${item.producto}</strong>
                            <span>Cantidad: ${item.cantidad}</span>
                        </div>
                        <div class="resumen-item-precio">
                            $${item.precio * item.cantidad} MXN
                        </div>
                        <button class="remove-resumen-item-alt" title="Eliminar">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                resumenItems.appendChild(div);
            });
        }
    }

    // -------- Extras --------
    if (resumenExtras) {
        resumenExtras.innerHTML = '';

        if (extrasSeleccionados.length > 0) {
            const title = document.createElement('h5');
            title.textContent = 'Personalización:';
            title.style.marginBottom = '15px';
            resumenExtras.appendChild(title);

            extrasSeleccionados.forEach((extra, index) => {
                const div = document.createElement('div');
                div.className = 'extra-resumen-item-alt';
                div.dataset.index = index;

                div.innerHTML = `
                    <div class="extra-resumen-content-alt">
                        <span>${extra.nombre}</span>
                        <span>+$${extra.precio} MXN</span>
                        <button class="remove-extra-item-alt" title="Eliminar extra">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;

                resumenExtras.appendChild(div);
            });
        }
    }

    // -------- Totales --------
    const subtotal = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    const extras = totalExtras || 0;
    const totalFinal = subtotal + extras;

    if (resumenSubtotal) resumenSubtotal.textContent = `$${subtotal} MXN`;
    if (resumenExtrasTotal) resumenExtrasTotal.textContent = `$${extras} MXN`;
    if (resumenTotal) resumenTotal.textContent = `$${totalFinal} MXN`;

    console.log(`Resumen actualizado. Productos: ${cart.length}, Extras: ${extrasSeleccionados.length}`);
}

// =======================
// EVENTOS CON DELEGACIÓN (evita listeners duplicados)
// =======================
document.addEventListener("click", (e) => {
    // Eliminar productos
    if (e.target.closest(".remove-resumen-item-alt")) {
        const index = e.target.closest(".resumen-item-alt").dataset.index;
        removeFromCart(parseInt(index));
    }

    // Eliminar extras
    if (e.target.closest(".remove-extra-item-alt")) {
        const index = e.target.closest(".extra-resumen-item-alt").dataset.index;
        removeExtra(parseInt(index));
    }
});

// =======================
// MÉTODO DE PAGO + AUTOCOMPLETE SESIÓN
// =======================
document.addEventListener("DOMContentLoaded", () => {

    // --- Método de pago ---
    const metodoPago = document.getElementById("metodo-pago");
    const opcionesTarjeta = document.getElementById("opciones-tarjeta");
    const infoTransferencia = document.getElementById("info-transferencia");

    if (metodoPago) {
        metodoPago.addEventListener("change", () => {
            opcionesTarjeta.style.display = metodoPago.value === "tarjeta" ? "block" : "none";
            infoTransferencia.style.display = metodoPago.value === "transferencia" ? "block" : "none";
        });
    }

    // --- Autocompletar datos del usuario ---
    const usuarioGuardado = localStorage.getItem("usuario");

    if (usuarioGuardado) {
        const usuario = JSON.parse(usuarioGuardado);
        const nombreInput = document.querySelector('input[name="nombre"]');
        const emailInput = document.querySelector('input[name="email"]');

        if (nombreInput) nombreInput.value = usuario.nombre || "";
        if (emailInput) emailInput.value = usuario.email || "";
    }
});
