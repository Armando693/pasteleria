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