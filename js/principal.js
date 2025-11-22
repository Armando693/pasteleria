// Variables globales
let cart = [];
let cartCount = document.querySelector('.cart-count');
let cartItems = document.getElementById('cart-items');
let cartTotal = document.getElementById('cart-total');
let cartSidebar = document.getElementById('cart-sidebar');
let cartToggle = document.getElementById('cart-toggle');
let closeCart = document.getElementById('close-cart');
let checkoutBtn = document.getElementById('checkout-btn');

let chatbotContainer = document.getElementById('chatbot-container');
let chatbotToggle = document.getElementById('chatbot-toggle');
let closeChatbot = document.getElementById('close-chatbot');
let chatbotMessages = document.getElementById('chatbot-messages');
let chatbotInput = document.getElementById('chatbot-input');
let sendMessage = document.getElementById('send-message');

let extrasSeleccionados = [];
let totalExtras = 0;

let filtroBtns = document.querySelectorAll('.filtro-btn');

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
    console.log('Inicializando página...');

    // Cargar carrito desde localStorage
    loadCart();

    // Configurar eventos
    setupCartEvents();
    setupChatbotEvents();
    setupProductFilters();
    setupOrderForm();
    setupPersonalizacionEvents();

    // Cargar mapa
    loadSimpleMap();

    console.log('Página inicializada correctamente');
});


// ===== FUNCIONES DEL CARRITO =====
function setupCartEvents() {
    // Botones para agregar al carrito
    document.querySelectorAll('.btn-agregar').forEach(button => {
        button.addEventListener('click', function () {
            const producto = this.getAttribute('data-producto');
            const precio = parseInt(this.getAttribute('data-precio'));
            addToCart(producto, precio);
        });
    });

    // Abrir/cerrar carrito
    if (cartToggle) {
        cartToggle.addEventListener('click', function (e) {
            e.preventDefault();
            cartSidebar.classList.add('open');
        });
    }

    if (closeCart) {
        closeCart.addEventListener('click', function () {
            cartSidebar.classList.remove('open');
        });
    }

    // Botón de checkout
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
            if (cart.length === 0) {
                alert('Tu carrito está vacío. Agrega algunos productos antes de realizar el pedido.');
                return;
            }
            window.location.href = 'orden.html';
        });
    }
    // Cerrar carrito al hacer clic fuera de él
    document.addEventListener('click', function (e) {
        if (cartSidebar.classList.contains('open') &&
            !cartSidebar.contains(e.target) &&
            !e.target.closest('.cart-icon')) {
            cartSidebar.classList.remove('open');
        }
    });
}

function addToCart(producto, precio) {
    console.log('Agregando al carrito:', producto, precio);

    // Verificar si el producto ya está en el carrito
    const existingItem = cart.find(item => item.producto === producto);

    if (existingItem) {
        existingItem.cantidad += 1;
    } else {
        cart.push({
            producto: producto,
            precio: precio,
            cantidad: 1
        });
    }

    updateCart();
    showNotification(`${producto} agregado al carrito`);
}

function removeFromCart(index) {
    if (index >= 0 && index < cart.length) {
        const productoEliminado = cart[index].producto;
        cart.splice(index, 1);
        updateCart();
        showNotification(`${productoEliminado} eliminado del carrito`);
    }
}

function updateQuantity(index, change) {
    if (index >= 0 && index < cart.length) {
        cart[index].cantidad += change;

        if (cart[index].cantidad <= 0) {
            removeFromCart(index);
        } else {
            updateCart();
        }
    }
}

function updateCart() {
    // Actualizar contador
    const totalItems = cart.reduce((total, item) => total + item.cantidad, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }

    // Actualizar lista de productos en el carrito
    if (cartItems) {
        cartItems.innerHTML = '';

        if (cart.length === 0 && extrasSeleccionados.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>';
        } else {
            // Mostrar productos
            cart.forEach((item, index) => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <div class="cart-item-info">
                        <h4>${item.producto}</h4>
                        <p>$${item.precio} MXN</p>
                    </div>
                    <div class="cart-item-actions">
                        <button class="quantity-btn minus" data-index="${index}">-</button>
                        <span class="item-quantity">${item.cantidad}</span>
                        <button class="quantity-btn plus" data-index="${index}">+</button>
                        <button class="remove-item" data-index="${index}" title="Eliminar producto">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                cartItems.appendChild(cartItem);
            });

            // Mostrar extras en el carrito
            if (extrasSeleccionados.length > 0) {
                const extrasHeader = document.createElement('div');
                extrasHeader.className = 'cart-extras-header';
                extrasHeader.innerHTML = '<h4>Personalización:</h4>';
                cartItems.appendChild(extrasHeader);

                extrasSeleccionados.forEach((extra, index) => {
                    const extraItem = document.createElement('div');
                    extraItem.className = 'cart-item cart-extra-item';
                    extraItem.innerHTML = `
                        <div class="cart-item-info">
                            <h4>+ ${extra.nombre}</h4>
                            <p>+$${extra.precio} MXN</p>
                        </div>
                        <div class="cart-item-actions">
                            <button class="remove-extra" data-index="${index}" title="Eliminar extra">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    cartItems.appendChild(extraItem);
                });
            }

            // Configurar eventos para los botones del carrito
            setupCartItemEvents();
        }
    }

    // Actualizar total - ¡AHORA INCLUYE EXTRAS!
    const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const total = subtotal + totalExtras;

    if (cartTotal) {
        cartTotal.textContent = `$${total} MXN`;
    }

    // Actualizar resumen en página de orden
    updateOrderSummary();

    // Guardar carrito en localStorage
    saveCart();
}

function setupCartItemEvents() {
    // Usar event delegation en el contenedor del carrito
    if (cartItems) {
        cartItems.addEventListener('click', function (e) {
            const target = e.target;
            const cartItem = target.closest('.cart-item');

            if (!cartItem) return;

            // Manejar extras del carrito
            if (cartItem.classList.contains('cart-extra-item')) {
                const items = Array.from(cartItems.querySelectorAll('.cart-extra-item'));
                const currentIndex = items.indexOf(cartItem);

                if (target.classList.contains('remove-extra') || target.closest('.remove-extra')) {
                    removeExtra(currentIndex);
                }
                return;
            }

            // Manejar productos normales
            const items = Array.from(cartItems.querySelectorAll('.cart-item:not(.cart-extra-item)'));
            const currentIndex = items.indexOf(cartItem);

            // Manejar botón de disminuir cantidad
            if (target.classList.contains('minus') || target.closest('.minus')) {
                updateQuantity(currentIndex, -1);
            }

            // Manejar botón de aumentar cantidad
            if (target.classList.contains('plus') || target.closest('.plus')) {
                updateQuantity(currentIndex, 1);
            }

            // Manejar botón de eliminar
            if (target.classList.contains('remove-item') || target.closest('.remove-item')) {
                removeFromCart(currentIndex);
            }
        });
    }
}


// ===== FUNCIONES PARA EXTRAS/PERSONALIZACIÓN =====
function setupPersonalizacionEvents() {
    console.log('Buscando elementos de personalización...');

    // Buscar TODOS los checkboxes de personalización
    const personalizacionCheckboxes = document.querySelectorAll('.personalizacion-item input[type="checkbox"], input[name="extras[]"]');
    console.log('Checkboxes encontrados:', personalizacionCheckboxes.length);

    personalizacionCheckboxes.forEach((checkbox, index) => {
        console.log(`Checkbox ${index}:`, checkbox.id, checkbox.value, checkbox.getAttribute('data-precio'));

        // Remover event listeners previos para evitar duplicados
        checkbox.replaceWith(checkbox.cloneNode(true));
    });

    // Re-seleccionar después del clone
    const refreshedCheckboxes = document.querySelectorAll('.personalizacion-item input[type="checkbox"], input[name="extras[]"]');

    refreshedCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', function () {
            console.log('Checkbox cambiado:', this.id, this.checked, this.value, this.getAttribute('data-precio'));

            const nombre = this.closest('label')?.querySelector('.personalizacion-nombre')?.textContent ||
                this.closest('.personalizacion-item')?.querySelector('.personalizacion-nombre')?.textContent ||
                'Extra';
            const precio = parseInt(this.getAttribute('data-precio')) || 0;
            const id = this.value || `extra-${Date.now()}`;

            const extra = {
                nombre: nombre,
                precio: precio,
                id: id
            };

            if (this.checked) {
                extrasSeleccionados.push(extra);
                console.log('Extra agregado:', extra);
                showNotification(`✅ ${extra.nombre} agregado`);
            } else {
                extrasSeleccionados = extrasSeleccionados.filter(e => e.id !== id);
                console.log('Extra removido:', extra);
                showNotification(`❌ ${extra.nombre} removido`);
            }

            updateExtrasTotal();
            updateCart(); // ¡IMPORTANTE! Actualizar el carrito completo
            updateOrderSummary();
        });
    });
}

function updateExtrasTotal() {
    totalExtras = extrasSeleccionados.reduce((total, extra) => total + extra.precio, 0);
    console.log('Total extras actualizado:', totalExtras, 'Extras:', extrasSeleccionados);

    const extrasTotalElement = document.getElementById('extras-total');
    if (extrasTotalElement) {
        extrasTotalElement.textContent = `$${totalExtras} MXN`;
    }
}

function removeExtra(index) {
    if (index >= 0 && index < extrasSeleccionados.length) {
        const extraEliminado = extrasSeleccionados[index];
        extrasSeleccionados.splice(index, 1);

        // Desmarcar el checkbox correspondiente
        const allCheckboxes = document.querySelectorAll('.personalizacion-item input[type="checkbox"], input[name="extras[]"]');
        allCheckboxes.forEach(checkbox => {
            if (checkbox.value === extraEliminado.id) {
                checkbox.checked = false;
            }
        });

        updateExtrasTotal();
        updateCart(); // Actualizar carrito completo
        updateOrderSummary();
        showNotification(`❌ ${extraEliminado.nombre} eliminado`);
    }
}


// ===== MAPA =====
function loadSimpleMap() {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #f9f9f9; border-radius: 10px; padding: 20px; text-align: center; border: 2px dashed #ddd;">
                <i class="fas fa-map-marker-alt" style="font-size: 3rem; color: #ff6b8b; margin-bottom: 15px;"></i>
                <h3 style="color: #333; margin-bottom: 10px;">Visítanos en Cuyecitos</h3>
                <p style="color: #666; margin-bottom: 5px;"><strong>📍 Dirección:</strong></p>
                <p style="color: #666; margin-bottom: 10px;">Col. Jarachina Norte #458<br>calle jovito </p>
                
                <p style="color: #666; margin-bottom: 5px;"><strong>🕒 Horario:</strong></p>
                <p style="color: #666; margin-bottom: 20px;">Lunes a Sábado: 9:00 AM - 8:00 PM</p>
                
                <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                    <a href="https://maps.app.goo.gl/VdDT3MM41K6UtVWaA" 
                       target="_blank" 
                       style="background: #ff6b8b; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: 500; display: flex; align-items: center; gap: 5px;">
                        <i class="fas fa-map"></i> Google Maps
                    </a>
                </div>
            </div>
        `;
    }
}