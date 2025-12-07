// Importar todo desde firebase.js
import {
    db,
    addDoc,
    collection,
    imgbbApiKey
} from "./firebase.js";

// 📦 Referencias del formulario
const form = document.getElementById('formProducto');
const mensaje = document.getElementById('mensaje');

// 🖼️ API key de ImgBB
const imgbbApi = imgbbApiKey;

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Datos del formulario
    const nombre = document.getElementById('nombre').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const ingredientes = document.getElementById('ingredientes').value.trim();
    const precio = parseFloat(document.getElementById('precio').value);
    const categoria = document.getElementById('categoria').value;
    const stock = parseInt(document.getElementById('stock').value);
    const archivo = document.getElementById('imagen').files[0];

    // Validaciones básicas
    if (!nombre || !descripcion || !ingredientes || !categoria) {
        mensaje.textContent = "⚠️ Todos los campos son obligatorios.";
        return;
    }

    if (isNaN(precio) || precio <= 0) {
        mensaje.textContent = "⚠️ El precio debe ser un número válido.";
        return;
    }

    if (isNaN(stock) || stock < 0) {
        mensaje.textContent = "⚠️ El stock debe ser un número válido.";
        return;
    }

    if (!archivo) {
        alert("Por favor selecciona una imagen 📷");
        return;
    }

    mensaje.textContent = "⏳ Subiendo imagen y guardando producto...";

    try {
        // 1️⃣ Convertir imagen a Base64
        const base64 = await convertirABase64(archivo);

        // 2️⃣ Subir imagen a ImgBB
        const formData = new FormData();
        formData.append("image", base64.split(",")[1]); // quitar encabezado base64

        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApi}`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error("❌ Error al subir imagen a ImgBB");
        }

        const urlImagen = data.data.url;

        // 3️⃣ Guardar producto en Firestore
        await addDoc(collection(db, "productos"), {
            nombre,
            descripcion,
            ingredientes,
            precio,
            categoria,
            stock,
            imagen: urlImagen,
            activo: true,
            creadoEn: new Date()
        });

        mensaje.textContent = "✅ Producto agregado correctamente";
        form.reset();

    } catch (error) {
        console.error("Error al agregar producto:", error);
        mensaje.textContent = "❌ Ocurrió un error al agregar el producto";
    }
});

// 🔧 Función auxiliar para convertir imagen a Base64
function convertirABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
