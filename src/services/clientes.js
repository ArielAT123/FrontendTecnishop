(function () {
  // ========================================
  // CLIENTES SERVICE
  // ========================================
  class ClientesService {
    constructor() {
      this.clientes = [];
      this.isInitialized = false;
    }

    // ========================================
    // INICIALIZAR SECCIÓN DE CLIENTES
    // ========================================
    async initialize() {
      try {
        // Evitar inicialización múltiple
        if (this.isInitialized) {
          console.log('ClientesService ya está inicializado, limpiando eventos...');
          this.cleanup();
        }

        await this.cargarClientes();
        this.setupEventListeners();
        this.handleClienteForm();
        this.isInitialized = true;
        
        console.log('ClientesService inicializado correctamente');
      } catch (error) {
        console.error('Error al inicializar clientes:', error);
        showNotification('Error al inicializar la sección de clientes', 'error');
      }
    }

    // ========================================
    // LIMPIAR EVENT LISTENERS PREVIOS
    // ========================================
    cleanup() {
      // Remover event listeners previos si existen
      const toggleBtn = document.getElementById('toggle-form-button');
      if (toggleBtn && this.toggleHandler) {
        toggleBtn.removeEventListener('click', this.toggleHandler);
      }

      const form = document.getElementById('cliente-form');
      if (form && this.formHandler) {
        form.removeEventListener('submit', this.formHandler);
      }
    }

    // ========================================
    // CONFIGURAR EVENT LISTENERS
    // ========================================
    setupEventListeners() {
      const toggleFormBtn = document.getElementById('toggle-form-button');
      const clienteFormContainer = document.getElementById('cliente-form-container');
      
      if (!toggleFormBtn || !clienteFormContainer) {
        console.error('No se encontraron los elementos del formulario');
        return;
      }

      // Almacenar la referencia del handler para poder removerlo después
      this.toggleHandler = () => {
        console.log('Toggle button clicked');
        
        const isHidden = clienteFormContainer.style.display === 'none' || 
                        clienteFormContainer.style.display === '' || 
                        !clienteFormContainer.style.display;
        
        if (isHidden) {
          clienteFormContainer.style.display = 'block';
          toggleFormBtn.textContent = 'Ocultar Formulario';
        } else {
          clienteFormContainer.style.display = 'none';
          toggleFormBtn.textContent = 'Agregar Nuevo Cliente';
        }
      };

      // Remover listener previo si existe
      toggleFormBtn.removeEventListener('click', this.toggleHandler);
      // Agregar nuevo listener
      toggleFormBtn.addEventListener('click', this.toggleHandler);

      // Asegurar que el formulario esté oculto inicialmente
      clienteFormContainer.style.display = 'none';
    }

    // ========================================
    // CARGAR CLIENTES EN LA TABLA
    // ========================================
    async cargarClientes() {
      try {
        this.clientes = await getClientes(); // From api.js
        console.log('Clientes cargados:', this.clientes);

        const tbody = document.getElementById('clientes-list');
        if (!tbody) {
          console.error('No se encontró el elemento clientes-list');
          return;
        }

        tbody.innerHTML = '';

        if (this.clientes.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5">No hay clientes registrados</td></tr>';
          return;
        }

        this.clientes.forEach(cliente => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${cliente.ci || 'N/A'}</td>
            <td>${cliente.nombre || 'N/A'}</td>
            <td>${cliente.apellido || 'N/A'}</td>
            <td>${cliente.telefono || 'N/A'}</td>
            <td class="action-buttons">
              <button class="btn-edit" onclick="window.sectionServices.clientes.editarCliente(${cliente.id})">Editar</button>
              <button class="btn-delete" onclick="window.sectionServices.clientes.eliminarCliente(${cliente.id})">Eliminar</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      } catch (error) {
        console.error('Error al cargar clientes:', error);
        const tbody = document.getElementById('clientes-list');
        if (tbody) {
          tbody.innerHTML = '<tr><td colspan="5">Error al cargar clientes</td></tr>';
        }
      }
    }

    // ========================================
    // MANEJAR FORMULARIO DE CLIENTE
    // ========================================
    handleClienteForm() {
      const form = document.getElementById('cliente-form');
      if (!form) {
        console.error('No se encontró el formulario de cliente');
        return;
      }

      // Crear handler y almacenar referencia
      this.formHandler = async (e) => {
        e.preventDefault();

        const formData = {
          ci: document.getElementById('ci').value.trim(),
          nombre: document.getElementById('nombre').value.trim(),
          apellido: document.getElementById('apellido').value.trim(),
          telefono: document.getElementById('telefono').value.trim(),
          correo: document.getElementById('correo').value.trim(),
        };

        if (!formData.ci || !formData.nombre) {
          showNotification('Por favor complete los campos obligatorios', 'error');
          return;
        }

        try {
          console.log('Enviando cliente:', formData);
          await createCliente(formData); // From api.js
          showNotification('Cliente guardado exitosamente', 'success');
          form.reset();
          
          // Ocultar formulario después de guardar
          const clienteFormContainer = document.getElementById('cliente-form-container');
          const toggleFormBtn = document.getElementById('toggle-form-button');
          if (clienteFormContainer && toggleFormBtn) {
            clienteFormContainer.style.display = 'none';
            toggleFormBtn.textContent = 'Agregar Nuevo Cliente';
          }
          
          await this.cargarClientes();
        } catch (error) {
          console.error('Error al guardar cliente:', error);
          showNotification('Error al guardar cliente: ' + error.message, 'error');
        }
      };

      // Remover listener previo si existe
      form.removeEventListener('submit', this.formHandler);
      // Agregar nuevo listener
      form.addEventListener('submit', this.formHandler);
    }

    // ========================================
    // DESTRUIR INSTANCIA (llamar al cambiar de screen)
    // ========================================
    destroy() {
      this.cleanup();
      this.isInitialized = false;
      console.log('ClientesService destruido');
    }

    // ========================================
    // FUNCIONES PARA EDITAR Y ELIMINAR
    // ========================================
    editarCliente(id) {
      console.log('Editar cliente con ID:', id);
      showNotification('Función de editar en desarrollo', 'info');
    }

    async eliminarCliente(id) {
      if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
        try {
          console.log('Eliminar cliente con ID:', id);
          // await deleteCliente(id); // Uncomment when API is ready
          showNotification('Cliente eliminado exitosamente', 'success');
          await this.cargarClientes();
        } catch (error) {
          console.error('Error al eliminar cliente:', error);
          showNotification('Error al eliminar cliente: ' + error.message, 'error');
        }
      }
    }
  }

  // Register the service for initialization
  window.sectionServices = window.sectionServices || {};
  window.sectionServices.clientes = new ClientesService();

})();