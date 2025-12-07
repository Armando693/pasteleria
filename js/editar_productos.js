
import {
    db,
    collection,
    getDocs,
    updateDoc,
    doc
} from "/js/firebase.js";

const contenedor = document.getElementById("productos");

async function cargarProductos() {
    const querySnapshot = await getDocs(collection(db, "productos"));
    contenedor.innerHTML = "";

    querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const card = document.createElement("div");
        card.classList.add("producto");

        card.innerHTML = `
                                <div class="info">
                                    <img src="${data.imagen}" alt="${data.nombre}">
                                    <label>Nombre:</label>
                                    <input type="text" id="nombre-${docSnap.id}" value="${data.nombre}">
                                    <label>Descripción:</label>
                                    <textarea id="descripcion-${docSnap.id}">${data.descripcion}</textarea>
                                    <label>Ingredientes:</label>
                                    <textarea id="ingredientes-${docSnap.id}">${data.ingredientes}</textarea>
                                    <label>Precio:</label>
                                    <input type="number" id="precio-${docSnap.id}" value="${data.precio}">
                                    <label>Categoría:</label>
                                    <input type="text" id="categoria-${docSnap.id}" value="${data.categoria}">
                                    <label>Imagen</label>
                                    <input type="file" id="imagen-${docSnap.id}" accept="image/*" value="${data.imagen}">
                                    <button onclick="guardarCambios('${docSnap.id}')" class="guardar">💾 Guardar Cambios</button>
                                </div>
                            `;
        contenedor.appendChild(card);
    });
}
window.guardarCambios = async function (id) {
    const nombre = document.getElementById(`nombre-${id}`).value;
    const descripcion = document.getElementById(`descripcion-${id}`).value;
    const ingredientes = document.getElementById(`ingredientes-${id}`).value;
    const precio = Number(document.getElementById(`precio-${id}`).value);
    const categoria = document.getElementById(`categoria-${id}`).value;
    const imagen = document.getElementById(`imagen-${id}`).value;

    const docRef = doc(db, "productos", id);
    await updateDoc(docRef, {
        nombre,
        descripcion,
        ingredientes,
        precio,
        categoria,
        imagen
    });

    alert("✅ Cambios guardados correctamente.");
};

cargarProductos();
