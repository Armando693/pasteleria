// ===== ACTUALIZACIÓN DEL RESUMEN =====
function updateOrderSummary() {
    console.log('Actualizando resumen del pedido...');

    const resumenItems = document.getElementById('resumen-items');
    const resumenExtras = document.getElementById('resumen-extras');
    const resumenSubtotal = document.getElementById('resumen-subtotal');
    const resumenExtrasTotal = document.getElementById('resumen-extras-total');
    const resumenTotal = document.getElementById('resumen-total');

    // Actualizar productos
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
                const resumenItem = document.createElement('div');
                resumenItem.className = 'resumen-item-alt';
                resumenItem.innerHTML = `
                    <div class="resumen-item-content-alt">
                        <div class="resumen-item-info">
                            <strong>${item.producto}</strong>
                            <span>Cantidad: ${item.cantidad}</span>
                        </div>
                        <div class="resumen-item-precio">
                            $${item.precio * item.cantidad} MXN
                        </div>
                        <button class="remove-resumen-item-alt" data-index="${index}" title="Eliminar">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                resumenItems.appendChild(resumenItem);
            });

            // Configurar eventos para eliminar productos
            setupResumenEvents();
        }
    }

    // Actualizar extras
    if (resumenExtras) {
        resumenExtras.innerHTML = '';

        if (extrasSeleccionados.length > 0) {
            const extrasTitle = document.createElement('h5');
            extrasTitle.textContent = 'Personalización:';
            extrasTitle.style.marginBottom = '15px';
            extrasTitle.style.color = '#333';
            resumenExtras.appendChild(extrasTitle);

            extrasSeleccionados.forEach((extra, index) => {
                const extraItem = document.createElement('div');
                extraItem.className = 'extra-resumen-item-alt';
                extraItem.innerHTML = `
                    <div class="extra-resumen-content-alt">
                        <span>${extra.nombre}</span>
                        <span>+$${extra.precio} MXN</span>
                        <button class="remove-extra-item-alt" data-index="${index}" title="Eliminar extra">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                resumenExtras.appendChild(extraItem);
            });

            // Configurar eventos para eliminar extras
            setupExtrasResumenEvents();
        }
    }

    // Actualizar totales
    const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const totalFinal = subtotal + totalExtras;

    if (resumenSubtotal) {
        resumenSubtotal.textContent = `$${subtotal} MXN`;
    }

    if (resumenExtrasTotal) {
        resumenExtrasTotal.textContent = `$${totalExtras} MXN`;
    }

    if (resumenTotal) {
        resumenTotal.textContent = `$${totalFinal} MXN`;
    }

    console.log('Resumen actualizado. Productos:', cart.length, 'Extras:', extrasSeleccionados.length);
}

function setupResumenEvents() {
    const resumenItems = document.getElementById('resumen-items');
    if (resumenItems) {
        resumenItems.addEventListener('click', function (e) {
            const target = e.target;
            const resumenItem = target.closest('.resumen-item-alt');

            if (!resumenItem) return;

            const items = Array.from(resumenItems.querySelectorAll('.resumen-item-alt'));
            const currentIndex = items.indexOf(resumenItem);

            if (target.classList.contains('remove-resumen-item-alt') || target.closest('.remove-resumen-item-alt')) {
                removeFromCart(currentIndex);
            }
        });
    }
}

function setupExtrasResumenEvents() {
    const resumenExtras = document.getElementById('resumen-extras');
    if (resumenExtras) {
        resumenExtras.addEventListener('click', function (e) {
            const target = e.target;
            const extraItem = target.closest('.extra-resumen-item-alt');

            if (!extraItem) return;

            const items = Array.from(resumenExtras.querySelectorAll('.extra-resumen-item-alt'));
            const currentIndex = items.indexOf(extraItem);

            if (target.classList.contains('remove-extra-item-alt') || target.closest('.remove-extra-item-alt')) {
                removeExtra(currentIndex);
            }
        });
    }
}

// ===== FORMULARIO DE ORDEN =====
function setupOrderForm() {
    const formOrden = document.getElementById('form-orden');
    if (formOrden) {
        formOrden.addEventListener('submit', function (e) {
            e.preventDefault();

            if (cart.length === 0) {
                alert('Tu carrito está vacío. Agrega algunos productos antes de realizar el pedido.');
                return;
            }

            const formData = new FormData(this);
            const ordenData = {
                nombre: formData.get('nombre'),
                telefono: formData.get('telefono'),
                email: formData.get('email'),
                fechaEntrega: formData.get('fecha-entrega'),
                horaEntrega: formData.get('hora-entrega'),
                direccion: formData.get('direccion'),
                mensaje: formData.get('mensaje'),
                productos: cart,
                extras: extrasSeleccionados,
                subtotal: cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
                totalExtras: totalExtras,
                total: cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0) + totalExtras
            };

            const mensajeConfirmacion = `
¡Pedido realizado con éxito!

Resumen del pedido:
- Productos: ${ordenData.productos.length} artículo(s)
- Extras: ${ordenData.extras.length} opción(es) seleccionada(s)
- Subtotal: $${ordenData.subtotal} MXN
- Extras: $${ordenData.totalExtras} MXN
- Total: $${ordenData.total} MXN

Te contactaremos pronto al ${ordenData.telefono} para confirmar los detalles de entrega.
            `;

            alert(mensajeConfirmacion);

            // Limpiar todo
            cart = [];
            extrasSeleccionados = [];
            totalExtras = 0;
            updateCart();
            updateExtrasTotal();
            updateOrderSummary();

            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });

            this.reset();
        });
    }
}


// ===== AUTOCOMPLETAR DATOS DEL USUARIO =====
document.addEventListener("DOMContentLoaded", function () {
    const usuarioGuardado = localStorage.getItem("usuario");

    if (usuarioGuardado) {
        const usuario = JSON.parse(usuarioGuardado);
        const nombreInput = document.querySelector('input[name="nombre"]');
        const emailInput = document.querySelector('input[name="email"]');

        if (nombreInput && usuario.nombre) nombreInput.value = usuario.nombre;
        if (emailInput && usuario.email) emailInput.value = usuario.email;
    }
});







