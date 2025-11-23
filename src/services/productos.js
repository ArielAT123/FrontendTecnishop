(function () {

  const API_BASE_URL = 'https://backendtecnishop.onrender.com/api';

  class ProductosService {
    constructor() {
      this.productos = [];
      this.isInitialized = false;
      this.productosFiltrados = [];
    }

    async filtrar(criterio) {
      this.productosFiltrados = this.productos.filter(producto => {
        const id = producto.codigo || '';
        const nombre = producto.nombre || '';
        const pvp = producto.precio_venta_sugerido ? producto.precio_venta_sugerido.toString() : '';
        const stock = producto.cantidad ? producto.cantidad.toString() : '';
        return id.toUpperCase().includes(criterio.toUpperCase()) ||
          nombre.toUpperCase().includes(criterio.toUpperCase()) ||
          pvp.includes(criterio) ||
          stock.includes(criterio);
      });
      this.cargarTablaProductos(this.productosFiltrados);
    }

    async initialize() {
      try {
        if (this.isInitialized) {
          this.cleanup();
        }
        await this.cargarProductos();
        this.setupEventListeners();
        this.handleProductoForm();
        this.isInitialized = true;
      } catch (error) {
        console.error('Error al inicializar productos:', error);
        //showNotification('Error al inicializar la sección de productos', 'error');
      }
    }

    cleanup() {
      const toggleBtn = document.getElementById('toggle-producto-form-button');
      if (toggleBtn && this.toggleHandler) {
        toggleBtn.removeEventListener('click', this.toggleHandler);
      }
      const form = document.getElementById('producto-form');
      if (form && this.formHandler) {
        form.removeEventListener('submit', this.formHandler);
      }
      const filtroInput = document.getElementById('filtro-productos');
      if (filtroInput && this.filtroHandler) {
        filtroInput.removeEventListener('input', this.filtroHandler);
      }
    }

    setupEventListeners() {
      //upload EXCEL
      const uploadButton = document.getElementById("excel_upload");
      const xlsxInput = document.getElementById("excel_products");

      // Deshabilitar el botón inicialmente
      uploadButton.disabled = true;

      // Habilitar/deshabilitar botón cuando cambia el input
      xlsxInput.addEventListener("change", (e) => {
        const archivo = e.target.files[0];

        if (archivo) {
          // Validar extensión
          const extension = archivo.name.split('.').pop().toLowerCase();
          if (extension === 'xlsx' || extension === 'xls') {
            uploadButton.disabled = false;
            uploadButton.textContent = "Cargar productos";
          } else {
            uploadButton.disabled = true;
            uploadButton.textContent = "Archivo no válido";
            alert("Solo se permiten archivos .xlsx o .xls");
            xlsxInput.value = ""; // Limpiar input
          }
        } else {
          uploadButton.disabled = true;
          uploadButton.textContent = "Cargar productos";
        }
      });

      uploadButton.addEventListener("click", async (e) => {
        e.preventDefault();

        const archivo = xlsxInput.files[0];

        if (!archivo) {
          alert("Por favor selecciona un archivo Excel");
          return;
        }

        const formData = new FormData();
        formData.append("archivo", archivo);

        try {
          uploadButton.disabled = true;
          uploadButton.textContent = "Cargando...";

          const data = await this.uploadExcelfile(formData);

          console.log("Éxito:", data);
          alert(`Productos creados: ${data.productos_creados}\nErrores: ${data.errores}`);
          xlsxInput.value = "";

          // Deshabilitar botón después de limpiar input
          uploadButton.disabled = true;

          await this.cargarProductos();

        } catch (error) {
          console.error("Error:", error);
          alert("Error al cargar el archivo: " + error.message);
        } finally {
          uploadButton.textContent = "Cargar productos";
        }
      });

      //PRODUCTO FORM
      const toggleFormBtn = document.getElementById('toggle-producto-form-button');
      const productoFormContainer = document.getElementById('producto-form-container');

      if (!toggleFormBtn || !productoFormContainer) {
        console.error('No se encontraron los elementos del formulario de productos');
        return;
      }

      this.toggleHandler = () => {
        const isHidden = productoFormContainer.style.display === 'none' ||
          productoFormContainer.style.display === '' ||
          !productoFormContainer.style.display;

        if (isHidden) {
          productoFormContainer.style.display = 'block';
          toggleFormBtn.textContent = 'Ocultar Formulario';
        } else {
          productoFormContainer.style.display = 'none';
          toggleFormBtn.textContent = 'Agregar Nuevo Producto';
        }
      };

      toggleFormBtn.removeEventListener('click', this.toggleHandler);
      toggleFormBtn.addEventListener('click', this.toggleHandler);

      const filtroInput = document.getElementById('filtro-productos');
      if (filtroInput) {
        this.filtroHandler = (e) => {
          const criterio = e.target.value.trim();
          if (criterio === '') {
            this.cargarTablaProductos(this.productos);
          } else {
            this.filtrar(criterio);
          }
        };
        filtroInput.removeEventListener('input', this.filtroHandler);
        filtroInput.addEventListener('input', this.filtroHandler);
      }

      productoFormContainer.style.display = 'none';
    }

    cargarTablaProductos(productos) {
      const tbody = document.getElementById('productos-list');
      if (!tbody) {
        console.error('No se encontró el elemento productos-list');
        return;
      }
      tbody.innerHTML = '';
      if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No hay productos registrados</td></tr>';
        return;
      }
      productos.forEach(producto => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${producto.codigo || 'N/A'}</td>
          <td>${producto.nombre || 'N/A'}</td>
          <td>${producto.precio_venta_sugerido || 'N/A'}</td>
          <td>${producto.cantidad || 'N/A'}</td>
          <td><img src="${producto.imagen_base64 || ''}" alt="${producto.nombre || 'Producto'}" width="75px"/></td>
          <td class="action-buttons">
            <button class="btn-edit" onclick="window.sectionServices.productos.editarProducto('${producto.codigo}')">Editar</button>
            <button class="btn-delete" onclick="window.sectionServices.productos.eliminarProducto('${producto.codigo}')">Eliminar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    async cargarProductos() {
      try {
        const response = await fetch(`${API_BASE_URL}/productos`, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
          }
        });
        if (!response.ok) throw new Error('Error al cargar productos');
        this.productos = await response.json();
        this.cargarTablaProductos(this.productos);
      } catch (error) {
        console.error('Error al cargar productos:', error);
        const tbody = document.getElementById('productos-list');
        if (tbody) {
          tbody.innerHTML = '<tr><td colspan="5">Error al cargar productos</td></tr>';
        }
      }
    }

    handleProductoForm() {
      const form = document.getElementById('producto-form');
      if (!form) {
        console.error('No se encontró el formulario de producto');
        return;
      }
      this.formHandler = async (e) => {
        e.preventDefault();

        const uploadImageInput = document.getElementById('upload_image');
        const image = uploadImageInput.files[0];
        const nombre = document.getElementById('NombreProducto').value.trim().toUpperCase();
        const codigo = document.getElementById('ID').value.trim().toUpperCase();
        const imageData = new FormData();
        imageData.append('image', image);
        imageData.append('public_id', codigo);
        imageData.append('folder', "productos");

        const imageResponse = await this.uploadImage(imageData);
        console.log('URL de la imagen subida:', imageResponse.urls.original);


        const formData = {
          nombre: nombre,
          codigo: codigo,
          cantidad: document.getElementById('pvp').value.trim() || '0',
          precio_venta_sugerido: document.getElementById('stock').value.trim() || '0',
          imagen_base64: imageResponse.urls.original// Agregar manejo de imagen si es necesario
        };



        if (!formData.nombre || !formData.codigo) {
          //showNotification('Por favor complete los campos obligatorios', 'error');
          return;
        }
        try {
          await this.createProducto(formData);
          //showNotification('Producto guardado exitosamente', 'success');
          form.reset();
          const productoFormContainer = document.getElementById('producto-form-container');
          const toggleFormBtn = document.getElementById('toggle-producto-form-button');
          if (productoFormContainer && toggleFormBtn) {
            productoFormContainer.style.display = 'none';
            toggleFormBtn.textContent = 'Agregar Nuevo Producto';
          }
          await this.cargarProductos();
        } catch (error) {
          console.error('Error al guardar producto:', error);
          //showNotification('Error al guardar producto: ' + error.message, 'error');
        }
      };
      form.removeEventListener('submit', this.formHandler);
      form.addEventListener('submit', this.formHandler);
    }

    destroy() {
      this.cleanup();
      this.isInitialized = false;
    }

    editarProducto(id) {
      //showNotification('Función de editar producto en desarrollo', 'info');
    }

    async eliminarProducto(id) {
      if (confirm('¿Está seguro de que desea eliminar este producto?')) {
        try {
          await this.deleteProducto(id);
          //showNotification('Producto eliminado exitosamente', 'success');
          await this.cargarProductos();
        } catch (error) {
          console.error('Error al eliminar producto:', error);
          //showNotification('Error al eliminar producto: ' + error.message, 'error');
        }
      }
    }

    static async uploadImage(data) {
      console.log('Subiendo imagen con datos:', data);
      const response = await fetch(`${API_BASE_URL}/cloudinary/upload/`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: data,
      });
      if (!response.ok) throw new Error('Error al subir imagen');
      return await response.json();

    }

    async createProducto(data) {
      console.log('Creando producto con datos:', data);
      const response = await fetch(`${API_BASE_URL}/productos/crear/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${localStorage.getItem("accessToken")}` },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al crear producto');
      return await response.json();
    }

    async deleteProducto(id) {
      const response = await fetch(`${API_BASE_URL}/productos/${id}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${localStorage.getItem("accessToken")}` },
      });
      if (!response.ok) throw new Error('Error al eliminar producto');
    }

    async uploadExcelfile(data) {
      const response = await fetch(`${API_BASE_URL}/productos/cargar/xlsx/`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: data,
      });
      if (!response.ok) throw new Error('Error al cargar el excel de productos');
      return await response.json();

    }


  }

  window.sectionServices = window.sectionServices || {};
  window.sectionServices.productos = new ProductosService();

})();   