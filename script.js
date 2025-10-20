// Carrito de compras
let cart = [];
let cartCount = document.querySelector('.cart-count');
let cartItems = document.getElementById('cart-items');
let cartTotal = document.getElementById('cart-total');
let cartSidebar = document.getElementById('cart-sidebar');
let cartToggle = document.getElementById('cart-toggle');
let closeCart = document.getElementById('close-cart');
let checkoutBtn = document.getElementById('checkout-btn');

// Chatbot
let chatbotContainer = document.getElementById('chatbot-container');
let chatbotToggle = document.getElementById('chatbot-toggle');
let closeChatbot = document.getElementById('close-chatbot');
let chatbotMessages = document.getElementById('chatbot-messages');
let chatbotInput = document.getElementById('chatbot-input');
let sendMessage = document.getElementById('send-message');

// Variables para extras
let extrasSeleccionados = [];
let totalExtras = 0;

// Filtros de productos
let filtroBtns = document.querySelectorAll('.filtro-btn');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
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
        button.addEventListener('click', function() {
            const producto = this.getAttribute('data-producto');
            const precio = parseInt(this.getAttribute('data-precio'));
            addToCart(producto, precio);
        });
    });
    
    // Abrir/cerrar carrito
    if (cartToggle) {
        cartToggle.addEventListener('click', function(e) {
            e.preventDefault();
            cartSidebar.classList.add('open');
        });
    }
    
    if (closeCart) {
        closeCart.addEventListener('click', function() {
            cartSidebar.classList.remove('open');
        });
    }
    
    // Botón de checkout
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cart.length === 0) {
                alert('Tu carrito está vacío. Agrega algunos productos antes de realizar el pedido.');
                return;
            }
            window.location.href = 'orden.html';
        });
    }
    
    // Cerrar carrito al hacer clic fuera de él
    document.addEventListener('click', function(e) {
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
        cartItems.addEventListener('click', function(e) {
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
        checkbox.addEventListener('change', function() {
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
        resumenItems.addEventListener('click', function(e) {
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
        resumenExtras.addEventListener('click', function(e) {
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

// ===== LOCALSTORAGE =====
function saveCart() {
    localStorage.setItem('cuyecitosCart', JSON.stringify(cart));
    localStorage.setItem('cuyecitosExtras', JSON.stringify(extrasSeleccionados));
    console.log('Carrito guardado en localStorage');
}

function loadCart() {
    const savedCart = localStorage.getItem('cuyecitosCart');
    const savedExtras = localStorage.getItem('cuyecitosExtras');
    
    if (savedCart) {
        cart = JSON.parse(savedCart);
        console.log('Carrito cargado:', cart);
    }
    
    if (savedExtras) {
        extrasSeleccionados = JSON.parse(savedExtras);
        console.log('Extras cargados:', extrasSeleccionados);
        
        // Marcar checkboxes de extras guardados
        extrasSeleccionados.forEach(extra => {
            const checkbox = document.querySelector(`input[value="${extra.id}"]`);
            if (checkbox) {
                checkbox.checked = true;
                console.log('Checkbox marcado:', extra.id);
            }
        });
        
        updateExtrasTotal();
    }
    
    updateCart();
}

// ===== NOTIFICACIONES =====
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #ff6b8b;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1300;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ===== CHATBOT =====
function setupChatbotEvents() {
    if (chatbotToggle) {
        chatbotToggle.addEventListener('click', function() {
            chatbotContainer.classList.toggle('open');
            if (chatbotContainer.classList.contains('open')) {
                chatbotInput.focus();
            }
        });
    }
    
    if (closeChatbot) {
        closeChatbot.addEventListener('click', function() {
            chatbotContainer.classList.remove('open');
        });
    }
    
    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendUserMessage();
            }
        });
    }
    
    if (sendMessage) {
        sendMessage.addEventListener('click', sendUserMessage);
    }
    
    document.addEventListener('click', function(e) {
        if (chatbotContainer.classList.contains('open') && 
            !chatbotContainer.contains(e.target) && 
            !e.target.closest('.chatbot-toggle')) {
            chatbotContainer.classList.remove('open');
        }
    });
}

function sendUserMessage() {
    const message = chatbotInput.value.trim();
    if (message === '') return;
    
    addMessage(message, 'user');
    chatbotInput.value = '';
    
    setTimeout(() => {
        const response = getBotResponse(message);
        addMessage(response, 'bot');
    }, 1000);
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.innerHTML = `<p>${text}</p>`;
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function getBotResponse(message) {
    const lowerMessage = message.toLowerCase();

    // SALUDOS
    if (lowerMessage.includes('hola') || lowerMessage.includes('buenos días') || lowerMessage.includes('buenas tardes')) {
        return '¡Hola! Soy Pancracio, el asistente virtual de Cuyecitos. 😊 ¿En qué puedo ayudarte hoy?';
    }
    if (lowerMessage.includes('buenas noches')) {
        return '¡Buenas noches! Espero que hayas tenido un gran día. ¿Cómo puedo ayudarte?';
    }

    // DESPEDIDAS
    if (lowerMessage.includes('adiós') || lowerMessage.includes('hasta luego') || lowerMessage.includes('nos vemos')) {
        return '¡Hasta luego! Que tengas un día lleno de dulzura 🍰';
    }

    // CONTACTO Y UBICACIÓN
    if (lowerMessage.includes('teléfono') || lowerMessage.includes('contacto')) {
        return 'Puedes llamarnos al 899 123 4567 o enviarnos un correo a contacto@cuyecitos.com.';
    }
    if (lowerMessage.includes('ubicación') || lowerMessage.includes('dirección')) {
        return 'Nos encontramos en Col. Jarachina Norte #458, Reynosa. ¡Ven a visitarnos!';
    }
    if (lowerMessage.includes('horario')) {
        return 'Nuestro horario es de lunes a sábado de 9:00 AM a 8:00 PM. Los domingos abrimos solo con cita.';
    }

    // PEDIDOS Y PRODUCTOS
    if (lowerMessage.includes('pedido') || lowerMessage.includes('comprar')) {
        return 'Para hacer un pedido, agrega los productos a tu carrito y completa el formulario de pedido. Puedo guiarte paso a paso si quieres.';
    }
    if (lowerMessage.includes('producto') || lowerMessage.includes('postre')) {
        return 'Tenemos una gran variedad de productos: pasteles, galletas, cupcakes, velas personalizadas y más. ¿Quieres que te muestre nuestro catálogo?';
    }
    if (lowerMessage.includes('extra') || lowerMessage.includes('adicional')) {
        return 'Ofrecemos dedicatorias, velas, chispas de colores, figuras de fondant y más. Puedes personalizar tu pedido al gusto.';
    }

    // PROMOCIONES Y OFERTAS
    if (lowerMessage.includes('promoción') || lowerMessage.includes('oferta')) {
        return 'Actualmente tenemos descuentos en paquetes de cumpleaños y postres personalizados. ¡Pregunta por nuestras promociones del mes!';
    }
    if (lowerMessage.includes('descuento')) {
        return '¡Genial que preguntes! Tenemos descuentos especiales en compras mayores a $500.';
    }

    // ENVÍOS Y ENTREGA
    if (lowerMessage.includes('envío') || lowerMessage.includes('entrega')) {
        return 'Realizamos envíos locales en Reynosa con un tiempo estimado de 1 a 2 días hábiles.';
    }
    if (lowerMessage.includes('reparto')) {
        return 'Nuestro servicio de reparto está disponible de lunes a sábado dentro de la ciudad. ¿Quieres que te indique el costo del envío?';
    }

    // PREGUNTAS FRECUENTES
    if (lowerMessage.includes('precio') || lowerMessage.includes('costo')) {
        return 'Los precios varían según el producto. Revisa nuestra sección de productos para conocer los precios actualizados.';
    }
    if (lowerMessage.includes('ingredientes')) {
        return 'Usamos ingredientes frescos y de la más alta calidad. Si quieres, puedo decirte los ingredientes de cada postre.';
    }
    if (lowerMessage.includes('vegano') || lowerMessage.includes('sin gluten')) {
        return 'Sí, tenemos opciones veganas y sin gluten. ¿Quieres que te muestre cuáles?';
    }
    if (lowerMessage.includes('allergy') || lowerMessage.includes('alergia')) {
        return 'Por favor avísanos si tienes alguna alergia, para indicarte qué productos son seguros para ti.';

    }

    // SOPORTE
    if (lowerMessage.includes('ayuda') || lowerMessage.includes('soporte')) {
        return 'Estoy aquí para ayudarte. Puedes preguntarme sobre horarios, ubicación, pedidos, productos, promociones o envíos.';
    }
    if (lowerMessage.includes('problema') || lowerMessage.includes('error')) {
        return 'Lamento que tengas un inconveniente. Por favor describe tu problema y haré lo posible por ayudarte.';

    }

    // HUMOR Y PERSONALIDAD
    if (lowerMessage.includes('chiste') || lowerMessage.includes('broma')) {
        const jokes = [
            '¿Sabes por qué los pasteles no hablan? Porque se comen sus palabras 😄',
            '¿Qué hace un cupcake en el gimnasio? ¡Ejercita su masa!',
            'Si un pastel cae al suelo… ¡es hora de probarlo antes de llorar!'
        ];
        return jokes[Math.floor(Math.random() * jokes.length)];
    }
    if (lowerMessage.includes('gracias') || lowerMessage.includes('muchas gracias')) {
        return '¡De nada! 😊 Me alegra poder ayudarte.';
    }

    // ===== RESPUESTA DE PRODUCTOS COMPLETA CON EMOJIS Y MENSAJE =====
const productosPorCategoria = {
    pasteles: [
        {nombre: "Pastel de Chocolate", precio: "$580 MXN", emoji: "🍫"},
        {nombre: "Pastel de Vainilla", precio: "$420 MXN", emoji: "🍰"},
        {nombre: "Pastel de Fresa", precio: "$450 MXN", emoji: "🍓"},
        {nombre: "Pastel 3 Leches", precio: "$300 MXN", emoji: "🥛"},
        {nombre: "Pastel de rompope", precio: "$400 MXN", emoji: "🥂"},
        {nombre: "Pastel de ferrero", precio: "$590 MXN", emoji: "🍫"},
        {nombre: "Pastel red velvet", precio: "$290 MXN", emoji: "❤️"},
        {nombre: "Pastel de coco", precio: "$490 MXN", emoji: "🥥"},
        {nombre: "Pastel de piña", precio: "$490 MXN", emoji: "🍍"},
        {nombre: "Pastel de platano", precio: "$290 MXN", emoji: "🍌"},
        {nombre: "Pastel de limon", precio: "$190 MXN", emoji: "🍋"},
        {nombre: "Pastel de piña colada", precio: "$600 MXN", emoji: "🍍🥥"},
        {nombre: "Pastel de zanaoria", precio: "$200 MXN", emoji: "🥕"}
    ],
    galletas: [
        {nombre: "Galletas Decoradas", precio: "$190 MXN", emoji: "🍪"},
        {nombre: "Galletas con Chispas", precio: "$100 MXN", emoji: "🍪"},
        {nombre: "Galletas de Avena", precio: "$120 MXN", emoji: "🥠"},
        {nombre: "Galletas de Chocolate", precio: "$150 MXN", emoji: "🍫"},
        {nombre: "Galletas de Nuez", precio: "$140 MXN", emoji: "🌰"},
        {nombre: "Galletas de Limón", precio: "$110 MXN", emoji: "🍋"},
        {nombre: "Galletas de Cacahuate", precio: "$130 MXN", emoji: "🥜"},
        {nombre: "Galletas Red Velvet", precio: "$150 MXN", emoji: "🔴"},
        {nombre: "Galletas Navideñas", precio: "$160 MXN", emoji: "🎄"},
        {nombre: "Galletas con Macadamia", precio: "$170 MXN", emoji: "🌰"},
        {nombre: "Galletas Brownie", precio: "$180 MXN", emoji: "🍫"},
        {nombre: "Galletas de Matcha", precio: "$180 MXN", emoji: "🍵"}
    ],
    roscas: [
        {nombre: "Rosca de Reyes", precio: "$450 MXN", emoji: "👑"},
        {nombre: "Rosca de Zanahoria", precio: "$250 MXN", emoji: "🥕"},
        {nombre: "Rosca de Maracuyá", precio: "$320 MXN", emoji: "🍹"},
        {nombre: "Rosca de Pistache", precio: "$350 MXN", emoji: "🥜"},
        {nombre: "Rosca de Vainilla", precio: "$230 MXN", emoji: "🍦"},
        {nombre: "Rosca de Café", precio: "$250 MXN", emoji: "☕"},
        {nombre: "Rosca de Naranja", precio: "$240 MXN", emoji: "🍊"},
        {nombre: "Rosca de Coco con Mango", precio: "$330 MXN", emoji: "🥥🥭"},
        {nombre: "Rosca de Matcha", precio: "$300 MXN", emoji: "🍵"}
    ],
    cupcakes: [
        {nombre: "Cupcakes Variados", precio: "$180 MXN (6 pzas)", emoji: "🧁"},
        {nombre: "Cupcakes de Chocolate", precio: "$200 MXN (6 pzas)", emoji: "🍫🧁"},
        {nombre: "Cupcakes Chocolate y Menta", precio: "$240 MXN (6 pzas)", emoji: "🍫🌿"},
        {nombre: "Cupcakes de Nuez", precio: "$220 MXN (6 pzas)", emoji: "🌰🧁"},
        {nombre: "Cupcakes de Arándano y Naranja", precio: "$230 MXN (6 pzas)", emoji: "🫐🍊🧁"},
        {nombre: "Cupcakes Red Velvet", precio: "$210 MXN (6 pzas)", emoji: "🧁❤️"},
        {nombre: "Cupcakes de Coco", precio: "$210 MXN (6 pzas)", emoji: "🥥🧁"},
        {nombre: "Cupcakes Oreo", precio: "$230 MXN (6 pzas)", emoji: "🧁🍪"},
        {nombre: "Cupcakes de Pistache", precio: "$250 MXN (6 pzas)", emoji: "🥜🧁"},
        {nombre: "Cupcakes de Matcha", precio: "$240 MXN (6 pzas)", emoji: "🍵🧁"}
    ],
    otros: [
        {nombre: "Gelatina Mosaico", precio: "$150 MXN", emoji: "🟩🟦🟥"},
        {nombre: "Cakepops", precio: "$180 MXN (6 pzas)", emoji: "🍡"},
        {nombre: "Gelatina Imposible", precio: "$180 MXN", emoji: "🍮"},
        {nombre: "Pay de Queso", precio: "$280 MXN", emoji: "🧀🥧"},
        {nombre: "Flan Napolitano", precio: "$160 MXN", emoji: "🍮"},
        {nombre: "Gelatina de Mango", precio: "$90 MXN (por porción)", emoji: "🥭"},
        {nombre: "Pastel de Boda Elegante", precio: "$1200 MXN", emoji: "🎂💍"},
        {nombre: "Pastel de San Valentín", precio: "$450 MXN", emoji: "💖🎂"},
        {nombre: "Mini Tartas Individuales", precio: "$220 MXN (6 pzas)", emoji: "🥧"},
        {nombre: "Tiramisú Clásico", precio: "$250 MXN", emoji: "☕🍰"},
        {nombre: "Postre Frío de Oreo", precio: "$160 MXN", emoji: "🍪❄️"},
        {nombre: "Brownies Gourmet", precio: "$200 MXN (6 pzas)", emoji: "🍫"},
        {nombre: "Mini Pavlovas", precio: "$260 MXN (6 pzas)", emoji: "🥮🍓"}
],

};

// Detectar si el mensaje contiene una categoría de postre
for (const categoria in productosPorCategoria) {
    if (lowerMessage.includes(categoria.slice(0, -1)) || lowerMessage.includes(categoria)) {
        let respuesta = `¡Claro! 😄 Te presento nuestro catálogo de ${categoria}:\n\n<ol>`; // mensaje introductorio
        productosPorCategoria[categoria].forEach(prod => {
            respuesta += `
                <li>${prod.emoji} <strong>${prod.nombre}</strong>: ${prod.precio}</li>
            `;
        });
        respuesta += `</ol>`;
        return respuesta;
    }
}
    // RESPUESTA POR DEFECTO
    const defaultResponses = [
        'Lo siento, no entiendo tu pregunta. ¿Podrías reformularla?',
        'Hmm, no estoy seguro de eso. ¿Puedes intentarlo de otra forma?',
        '¡Vaya! No entiendo bien. ¿Podrías darme más detalles?',
        'No estoy seguro de cómo responder a eso, pero puedo ayudarte con pedidos, horarios o productos.'
    ];
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}


// ===== FILTROS DE PRODUCTOS =====
function setupProductFilters() {
    if (filtroBtns.length > 0) {
        filtroBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filtroBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const categoria = this.getAttribute('data-categoria');
                filterProducts(categoria);
            });
        });
    }
}

function filterProducts(categoria) {
    const productos = document.querySelectorAll('.producto-item');
    productos.forEach(producto => {
        if (categoria === 'todos' || producto.getAttribute('data-categoria') === categoria) {
            producto.style.display = 'block';
        } else {
            producto.style.display = 'none';
        }
    });
}

// ===== FORMULARIO DE ORDEN =====
function setupOrderForm() {
    const formOrden = document.getElementById('form-orden');
    if (formOrden) {
        formOrden.addEventListener('submit', function(e) {
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
