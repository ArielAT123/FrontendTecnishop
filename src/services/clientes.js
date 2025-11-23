(function () {

  const API_BASE_URL = 'https://backendtecnishop.onrender.com/api';
  // ========================================
  // CLIENTES SERVICE
  // ========================================
  class ClientesService {
    constructor() {
      this.clientes = [];
      this.isInitialized = false;
      this.clientesFiltrados = [];
    }

    async filtrar(criterio) {
      this.clientesFiltrados = this.clientes.filter(cliente => {
        const ci = cliente.ci || '';
        const nombre = cliente.nombre || '';
        const apellido = cliente.apellido || '';
        const telefono = cliente.telefono || '';
        const correo = cliente.correo || '';
        return ci.includes(criterio) ||
          nombre.toLowerCase().includes(criterio.toLowerCase()) ||
          apellido.toLowerCase().includes(criterio.toLowerCase()) ||
          telefono.includes(criterio) ||
          (correo && correo.toLowerCase().includes(criterio.toLowerCase()));
      });
      console.log('Clientes filtrados:', this.clientesFiltrados);
      this.cargarTablaClientes(this.clientesFiltrados);
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
        //showNotification('Error al inicializar la sección de clientes', 'error');
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

      const filtroInput = document.getElementById('filtro-clientes');
      if (filtroInput && this.filtroHandler) {
        filtroInput.removeEventListener('input', this.filtroHandler);
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

      // Handler del toggle button
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

      toggleFormBtn.removeEventListener('click', this.toggleHandler);
      toggleFormBtn.addEventListener('click', this.toggleHandler);

      // ========================================
      // LISTENER PARA EL INPUT DE FILTRO (tiempo real)
      // ========================================
      const filtroInput = document.getElementById('filtro-clientes');

      if (filtroInput) {
        this.filtroHandler = (e) => {
          const criterio = e.target.value.trim();
          if (criterio === '') {
            this.cargarTablaClientes(this.clientes);
          } else {
            this.filtrar(criterio);
          }
        };

        filtroInput.removeEventListener('input', this.filtroHandler);
        filtroInput.addEventListener('input', this.filtroHandler);
      }

      // ========================================
      // LISTENER PARA EL BOTÓN DE FILTRAR
      // ========================================
      // const joinFilterBtn = document.getElementById('join-filter');

      // if (joinFilterBtn) {
      //   this.joinFilterHandler = () => {
      //     console.log('Botón filtrar clickeado'); // Para debug

      //     if (!filtroInput) {
      //       console.error('No se encontró el input de filtro');
      //       return;
      //     }

      //     const criterio = filtroInput.value.trim(); // ✅ Usar .value directamente

      //     if (criterio === '') {
      //       this.cargarTablaClientes(this.clientes);
      //     } else {
      //       this.filtrar(criterio);
      //     }
      //   };

      //   joinFilterBtn.removeEventListener('click', this.joinFilterHandler);
      //   joinFilterBtn.addEventListener('click', this.joinFilterHandler);
      // }

      // Asegurar que el formulario esté oculto inicialmente
      clienteFormContainer.style.display = 'none';
    }

    // ========================================
    // CARGAR CLIENTES EN LA TABLA
    // ========================================
    // Función para cargar tabla de clientes
    cargarTablaClientes(clientes) {
      const tbody = document.getElementById('clientes-list');

      if (!tbody) {
        console.error('No se encontró el elemento clientes-list');
        return;
      }

      tbody.innerHTML = '';

      if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No hay clientes registrados</td></tr>';
        return;
      }

      clientes.forEach(cliente => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${cliente.ci || 'N/A'}</td>
          <td>${cliente.nombre || 'N/A'}</td>
          <td>${cliente.apellido || 'N/A'}</td>
          <td>${cliente.telefono || 'N/A'}</td>
          <td class="action-buttons">
            <button class="btn-edit" onclick="window.sectionServices.clientes.editarCliente('${cliente.ci}')">Editar</button>
            <button class="btn-delete" onclick="window.sectionServices.clientes.eliminarCliente('${cliente.ci}')">Eliminar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Uso en cargarClientes:
    async cargarClientes() {
      try {
        this.clientes = await getClientes();
        console.log('Clientes cargados:', this.clientes);
        this.cargarTablaClientes(this.clientes);

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
          //showNotification('Por favor complete los campos obligatorios', 'error');
          return;
        }

        try {
          console.log('Enviando cliente:', formData);
          await createCliente(formData); // From api.js
          //showNotification('Cliente guardado exitosamente', 'success');
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
          //showNotification('Error al guardar cliente: ' + error.message, 'error');
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
      //showNotification('Función de editar en desarrollo', 'info');
    }

    async eliminarCliente(id) {
      if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
        try {
          console.log('Eliminar cliente con ID:', id);
          await this.deleteCliente(id);
          //showNotification('Cliente eliminado exitosamente', 'success');
          await this.cargarClientes();
        } catch (error) {
          console.error('Error al eliminar cliente:', error);
          //showNotification('Error al eliminar cliente: ' + error.message, 'error');
        }
      }
    }

    async deleteCliente(id) {
      try {
        const response = await fetch(`${API_BASE_URL}/clientes/${id}/`, {
          method: 'DELETE',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al eliminar cliente');
        }
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        throw error;
      }
    }
  }

  // Register the service for initialization
  window.sectionServices = window.sectionServices || {};
  window.sectionServices.clientes = new ClientesService();

})(); ``