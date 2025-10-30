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