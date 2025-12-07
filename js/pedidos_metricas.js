import {
    auth,
    onAuthStateChanged,
    db,
    collection,
    getDocs,
    onSnapshot
} from "./firebase.js";

// ----------------- VARIABLES GLOBALES -----------------
let pedidos = [];
let chartProductos, chartMensual;
let filtroActual = 'todos';

// 🔐 VALIDACIÓN DE SESIÓN (localStorage + Firebase Auth)
function verificarSesion() {
    const usuarioGuardado = localStorage.getItem("usuario");

    onAuthStateChanged(auth, (user) => {
        if (!user || !usuarioGuardado) {
            console.warn("⚠ No hay usuario logeado. Redirigiendo...");
            localStorage.removeItem("usuario");
            window.location.href = "login.html";
            return;
        }

        console.log("✔ Usuario autenticado:", user.email);

        // Si pasa la validación → Cargar las métricas
        cargarPedidosTiempoReal();
    });
}

verificarSesion();


// ----------------- FUNCIONES -----------------
async function inicializarDashboard() {
    try {
        console.log("Inicializando dashboard...");

        // Cargar TODOS los pedidos sin ordenamiento inicial
        const pedidosRef = collection(db, "pedidos");

        onSnapshot(pedidosRef, (snapshot) => {
            console.log("Datos actualizados desde Firebase. Documentos:", snapshot.size);
            pedidos = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                data.id = doc.id; // Agregar el ID del documento

                // DEBUG: Mostrar cada pedido en consola
                console.log("Pedido cargado:", data.id, data);

                pedidos.push(data);
            });

            if (pedidos.length === 0) {
                console.warn("No hay pedidos en Firestore 😅");
                document.getElementById("tablaLoading").innerHTML = "No hay pedidos en la base de datos";
                return;
            }

            console.log("Total de pedidos cargados:", pedidos.length);

            // Ordenar pedidos por fecha (más reciente primero) en el cliente
            pedidos.sort((a, b) => {
                try {
                    const fechaA = new Date(a.fechaRegistro || 0);
                    const fechaB = new Date(b.fechaRegistro || 0);
                    return fechaB - fechaA; // Más reciente primero
                } catch (e) {
                    return 0;
                }
            });

            // Ocultar loading y mostrar tabla
            document.getElementById("tablaLoading").style.display = "none";
            document.getElementById("tablaPedidos").style.display = "table";

            // Actualizar toda la interfaz con los nuevos datos
            mostrarKPIs(pedidos);
            actualizarCharts(pedidos);
            generarPredicciones(pedidos);
            mostrarTablaPedidos(pedidos);

        }, (error) => {
            console.error("Error en listener de Firebase:", error);
            document.getElementById("tablaLoading").innerHTML = "Error cargando pedidos: " + error.message;
        });

    } catch (error) {
        console.error("Error inicializando dashboard:", error);
        document.getElementById("tablaLoading").innerHTML = "Error inicializando: " + error.message;
    }
}

function mostrarKPIs(orders) {
    const totalOrders = orders.length;
    let totalVentas = 0;
    const productosVendidos = {};

    // Usar TODOS los pedidos
    orders.forEach(order => {
        // Verificar si el total es válido
        const total = parseFloat(order.total || 0);
        if (!isNaN(total)) {
            totalVentas += total;
        }

        // Contar productos
        if (Array.isArray(order.productos)) {
            order.productos.forEach(p => {
                if (p.producto) {
                    if (!productosVendidos[p.producto]) productosVendidos[p.producto] = 0;
                    productosVendidos[p.producto] += parseInt(p.cantidad) || 0;
                }
            });
        } else if (order.productos && typeof order.productos === 'object') {
            // Si productos es un objeto en lugar de array
            Object.values(order.productos).forEach(p => {
                if (p && p.producto) {
                    if (!productosVendidos[p.producto]) productosVendidos[p.producto] = 0;
                    productosVendidos[p.producto] += parseInt(p.cantidad) || 0;
                }
            });
        }
    });

    const sortedProducts = Object.entries(productosVendidos).sort((a, b) => b[1] - a[1]);
    const topProduct = sortedProducts[0] ? `${sortedProducts[0][0]} (${sortedProducts[0][1]} uds)` : "N/A";
    const worstProduct = sortedProducts[sortedProducts.length - 1] ?
        `${sortedProducts[sortedProducts.length - 1][0]} (${sortedProducts[sortedProducts.length - 1][1]} uds)` : "N/A";

    document.getElementById("ventasTotales").textContent = "$" + totalVentas.toFixed(2);
    document.getElementById("totalOrders").textContent = totalOrders;
    document.getElementById("topProduct").textContent = topProduct;
    document.getElementById("worstProduct").textContent = worstProduct;
}

function actualizarCharts(orders) {
    // Datos para gráfico de productos
    const productosVendidos = {};
    orders.forEach(order => {
        if (Array.isArray(order.productos)) {
            order.productos.forEach(p => {
                if (p.producto) {
                    if (!productosVendidos[p.producto]) productosVendidos[p.producto] = 0;
                    productosVendidos[p.producto] += parseInt(p.cantidad) || 0;
                }
            });
        } else if (order.productos && typeof order.productos === 'object') {
            // Si productos es un objeto
            Object.values(order.productos).forEach(p => {
                if (p && p.producto) {
                    if (!productosVendidos[p.producto]) productosVendidos[p.producto] = 0;
                    productosVendidos[p.producto] += parseInt(p.cantidad) || 0;
                }
            });
        }
    });

    // Actualizar o crear gráfico de productos
    if (chartProductos) {
        chartProductos.data.labels = Object.keys(productosVendidos);
        chartProductos.data.datasets[0].data = Object.values(productosVendidos);
        chartProductos.update();
    } else {
        const ctx = document.getElementById('chartProductos').getContext('2d');
        chartProductos = new Chart(ctx, {
            type: "bar",
            data: {
                labels: Object.keys(productosVendidos),
                datasets: [{
                    label: "Unidades Vendidas",
                    data: Object.values(productosVendidos),
                    backgroundColor: "#007bff"
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    }

    // Datos para gráfico mensual - usar TODOS los pedidos
    const ventasPorMes = {};
    orders.forEach(order => {
        try {
            let fecha;

            // Intentar diferentes formatos de fecha
            if (order.fechaRegistro && order.fechaRegistro.seconds) {
                // Si es timestamp de Firebase
                fecha = new Date(order.fechaRegistro.seconds * 1000);
            } else if (order.fechaRegistro) {
                // Si es string de fecha
                fecha = new Date(order.fechaRegistro);
            } else {
                return; // No hay fecha, saltar este pedido
            }

            if (!isNaN(fecha.getTime())) {
                const key = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, "0")}`;
                const total = parseFloat(order.total || 0);
                if (!isNaN(total)) {
                    ventasPorMes[key] = (ventasPorMes[key] || 0) + total;
                }
            }
        } catch (e) {
            console.warn("Error procesando fecha:", order.fechaRegistro, e);
        }
    });

    // Ordenar meses cronológicamente
    const mesesOrdenados = Object.keys(ventasPorMes).sort();

    // Actualizar o crear gráfico mensual
    if (chartMensual) {
        chartMensual.data.labels = mesesOrdenados;
        chartMensual.data.datasets[0].data = mesesOrdenados.map(mes => ventasPorMes[mes]);
        chartMensual.update();
    } else {
        const ctx = document.getElementById('chartMensual').getContext('2d');
        chartMensual = new Chart(ctx, {
            type: "line",
            data: {
                labels: mesesOrdenados,
                datasets: [{
                    label: "Ventas por Mes",
                    data: mesesOrdenados.map(mes => ventasPorMes[mes]),
                    borderColor: "#28a745",
                    backgroundColor: "rgba(40,167,69,0.2)",
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// ----------------- TABLA DE PEDIDOS -----------------
function mostrarTablaPedidos(pedidos) {
    const cuerpoTabla = document.getElementById("cuerpoTablaPedidos");
    cuerpoTabla.innerHTML = "";

    // Filtrar pedidos según el filtro actual
    let pedidosFiltrados = pedidos;
    if (filtroActual === 'pendientes') {
        pedidosFiltrados = pedidos.filter(p => !p.estado || p.estado === 'Pendiente' || p.estado === 'pendiente');
    } else if (filtroActual === 'completados') {
        pedidosFiltrados = pedidos.filter(p => p.estado && p.estado !== 'Pendiente' && p.estado !== 'pendiente');
    }

    if (pedidosFiltrados.length === 0) {
        const fila = document.createElement("tr");
        fila.innerHTML = `<td colspan="6" style="text-align: center; padding: 20px;">No hay pedidos que mostrar con el filtro actual</td>`;
        cuerpoTabla.appendChild(fila);
        return;
    }

    pedidosFiltrados.forEach(pedido => {
        const fila = document.createElement("tr");
        fila.setAttribute("data-id", pedido.id);

        // Formatear fechas de manera segura
        let fechaPedido = "Fecha inválida";
        let fechaEntrega = "No especificada";

        try {
            // Manejar diferentes formatos de fecha
            let fechaPedidoObj;
            if (pedido.fechaRegistro && pedido.fechaRegistro.seconds) {
                fechaPedidoObj = new Date(pedido.fechaRegistro.seconds * 1000);
            } else if (pedido.fechaRegistro) {
                fechaPedidoObj = new Date(pedido.fechaRegistro);
            }

            if (fechaPedidoObj && !isNaN(fechaPedidoObj.getTime())) {
                fechaPedido = fechaPedidoObj.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            let fechaEntregaObj;
            if (pedido.fechaEntrega && pedido.fechaEntrega.seconds) {
                fechaEntregaObj = new Date(pedido.fechaEntrega.seconds * 1000);
            } else if (pedido.fechaEntrega) {
                fechaEntregaObj = new Date(pedido.fechaEntrega);
            }

            if (fechaEntregaObj && !isNaN(fechaEntregaObj.getTime())) {
                fechaEntrega = fechaEntregaObj.toLocaleDateString('es-ES');
            }
        } catch (e) {
            console.warn("Error formateando fechas para pedido:", pedido.id, e);
        }

        const total = parseFloat(pedido.total || 0);
        const estado = pedido.estado || "Pendiente";
        const nombreCliente = pedido.nombre || pedido.correo || pedido.usuario || "Cliente no disponible";

        fila.innerHTML = `
                    <td title="${pedido.id}">${pedido.id.substring(0, 8)}...</td>
                    <td>${nombreCliente}</td>
                    <td>${fechaPedido}</td>
                    <td>${fechaEntrega}</td>
                    <td>$${isNaN(total) ? "0.00" : total.toFixed(2)}</td>
                    <td><span class="estado-pedido ${estado.toLowerCase()}">${estado}</span></td>
                `;

        fila.addEventListener("click", () => mostrarDetallesPedido(pedido.id));
        cuerpoTabla.appendChild(fila);
    });
}

// ----------------- DETALLES DEL PEDIDO -----------------
function mostrarDetallesPedido(idPedido) {
    const pedido = pedidos.find(p => p.id === idPedido);
    if (!pedido) {
        alert("No se pudo encontrar el pedido seleccionado");
        return;
    }

    const modal = document.getElementById("modalDetalles");
    const detallesDiv = document.getElementById("detallesPedido");

    // Formatear fechas de manera segura
    let fechaPedido = "Fecha inválida";
    let fechaEntrega = "No especificada";

    try {
        // Manejar diferentes formatos de fecha
        let fechaPedidoObj;
        if (pedido.fechaRegistro && pedido.fechaRegistro.seconds) {
            fechaPedidoObj = new Date(pedido.fechaRegistro.seconds * 1000);
        } else if (pedido.fechaRegistro) {
            fechaPedidoObj = new Date(pedido.fechaRegistro);
        }

        if (fechaPedidoObj && !isNaN(fechaPedidoObj.getTime())) {
            fechaPedido = fechaPedidoObj.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        let fechaEntregaObj;
        if (pedido.fechaEntrega && pedido.fechaEntrega.seconds) {
            fechaEntregaObj = new Date(pedido.fechaEntrega.seconds * 1000);
        } else if (pedido.fechaEntrega) {
            fechaEntregaObj = new Date(pedido.fechaEntrega);
        }

        if (fechaEntregaObj && !isNaN(fechaEntregaObj.getTime())) {
            fechaEntrega = fechaEntregaObj.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    } catch (e) {
        console.warn("Error formateando fechas para modal:", pedido.id, e);
    }

    // Calcular totales
    let subtotalProductos = 0;
    let totalExtras = 0;

    // Obtener array de productos
    let productosArray = [];
    if (Array.isArray(pedido.productos)) {
        productosArray = pedido.productos;
    } else if (pedido.productos && typeof pedido.productos === 'object') {
        productosArray = Object.values(pedido.productos);
    }

    // Calcular subtotal de productos y extras
    productosArray.forEach(producto => {
        const cantidad = parseInt(producto.cantidad) || 0;
        const precio = parseFloat(producto.precio) || 0;
        subtotalProductos += cantidad * precio;

        // Calcular extras si existen
        if (producto.extras && Array.isArray(producto.extras)) {
            producto.extras.forEach(extra => {
                const precioExtra = parseFloat(extra.precio) || 0;
                totalExtras += precioExtra;
            });
        }
    });

    const totalCalculado = subtotalProductos + totalExtras;
    const totalPedido = parseFloat(pedido.total || 0) || totalCalculado;

    // Crear HTML para los detalles
    let detallesHTML = `
                <div class="detail-row">
                    <div class="detail-label">ID Pedido:</div>
                    <div class="detail-value">${pedido.id}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Cliente:</div>
                    <div class="detail-value">${pedido.nombre || "No disponible"}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Correo:</div>
                    <div class="detail-value">${pedido.correo || "No disponible"}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Teléfono:</div>
                    <div class="detail-value">${pedido.telefono || "No disponible"}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Dirección:</div>
                    <div class="detail-value">${pedido.direccion || "No disponible"}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Fecha del Pedido:</div>
                    <div class="detail-value">${fechaPedido}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Fecha de Entrega:</div>
                    <div class="detail-value">${fechaEntrega}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Estado:</div>
                    <div class="detail-value">${pedido.estado || "Pendiente"}</div>
                </div>
            `;

    // Agregar productos si existen
    if (productosArray.length > 0) {
        detallesHTML += `
                    <div class="detail-row">
                        <div class="detail-label">Productos:</div>
                        <div class="detail-value">
                            <div class="productos-list">
                                ${productosArray.map(producto => {
            const cantidad = parseInt(producto.cantidad) || 0;
            const precio = parseFloat(producto.precio) || 0;
            const subtotalProducto = cantidad * precio;

            let extrasHTML = '';
            let subtotalExtras = 0;

            // Mostrar extras si existen
            if (producto.extras && Array.isArray(producto.extras) && producto.extras.length > 0) {
                extrasHTML = `
                                            <div class="extras-list">
                                                ${producto.extras.map(extra => {
                    const precioExtra = parseFloat(extra.precio) || 0;
                    const nombreExtra = extra.nombre || extra.producto || 'Extra';
                    subtotalExtras += precioExtra;
                    return `
                                                        <div class="extra-item">
                                                            <span>+ ${nombreExtra}</span>
                                                            <span>$${precioExtra.toFixed(2)}</span>
                                                        </div>
                                                    `;
                }).join('')}
                                            </div>
                                        `;
            }

            const totalProducto = subtotalProducto + subtotalExtras;

            return `
                                        <div class="producto-item">
                                            <div>
                                                <strong>${producto.producto || "Producto"}</strong>
                                                <br>
                                                <small>Cantidad: ${cantidad} × $${precio.toFixed(2)}</small>
                                                ${extrasHTML}
                                            </div>
                                            <div>
                                                <span>Subtotal: $${totalProducto.toFixed(2)}</span>
                                                ${subtotalExtras > 0 ? `<br><small>(Producto: $${subtotalProducto.toFixed(2)} + Extras: $${subtotalExtras.toFixed(2)})</small>` : ''}
                                            </div>
                                        </div>
                                    `;
        }).join('')}
                            </div>
                        </div>
                    </div>
                `;
    } else {
        detallesHTML += `
                    <div class="detail-row">
                        <div class="detail-label">Productos:</div>
                        <div class="detail-value">No hay productos registrados</div>
                    </div>
                `;
    }

    // Agregar resumen de totales
    detallesHTML += `
                <div class="detail-row">
                    <div class="detail-label">Resumen de Pago:</div>
                    <div class="detail-value">
                        <div class="resumen-total">
                            <div class="total-line">
                                <span>Subtotal Productos:</span>
                                <span>$${subtotalProductos.toFixed(2)}</span>
                            </div>
                            ${totalExtras > 0 ? `
                            <div class="total-line">
                                <span>Total Extras:</span>
                                <span>$${totalExtras.toFixed(2)}</span>
                            </div>
                            ` : ''}
                            <div class="total-line total-final">
                                <span><strong>TOTAL:</strong></span>
                                <span><strong>$${totalPedido.toFixed(2)}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

    detallesDiv.innerHTML = detallesHTML;
    modal.style.display = "flex";
}

// ----------------- PREDICCIONES SIMPLES -----------------
async function generarPredicciones(orders) {
    const predictionDiv = document.getElementById("predictionCards");
    predictionDiv.innerHTML = "";

    if (orders.length === 0) {
        document.getElementById("predictionStatus").textContent = "No hay datos suficientes para predicciones";
        return;
    }

    // Usar TODOS los pedidos para predicciones
    const totals = orders.map(o => parseFloat(o.total || 0)).filter(total => !isNaN(total) && total > 0);

    if (totals.length === 0) {
        const predCard = document.createElement("div");
        predCard.classList.add("prediction-card");
        predCard.innerHTML = `<h3>Sin datos de ventas</h3><p>No hay pedidos con montos válidos</p>`;
        predictionDiv.appendChild(predCard);
        document.getElementById("predictionStatus").textContent = "No hay datos de ventas para predicciones";
        return;
    }

    // Modelo simple: promedio de todos los pedidos
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;

    const predCard = document.createElement("div");
    predCard.classList.add("prediction-card");
    predCard.innerHTML = `
                <h3>Predicción Próximo Mes</h3>
                <p class="kpi-value">$${avg.toFixed(2)}</p>
                <p>Basado en ${totals.length} pedidos históricos</p>
            `;
    predictionDiv.appendChild(predCard);

    document.getElementById("predictionStatus").textContent = "Predicciones calculadas ✔️";
}

// ----------------- INICIAR DASHBOARD -----------------
inicializarDashboard();

// Event listeners para el modal
document.getElementById("cerrarModal").addEventListener("click", () => {
    document.getElementById("modalDetalles").style.display = "none";
});

// Cerrar modal al hacer clic fuera del contenido
window.addEventListener("click", (event) => {
    const modal = document.getElementById("modalDetalles");
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

document.head.appendChild(style);
