(function () {
  // ========================================
  // CLIENTES SERVICE
  // ========================================
  class ClientesService {
    constructor() {
      this.clientes = [];
    }

    // ========================================
    // INICIALIZAR SECCIÓN DE CLIENTES
    // ========================================
    async initialize() {
      try {
        await this.cargarClientes();
        this.handleClienteForm();
      } catch (error) {
        console.error('Error al inicializar clientes:', error);
        showNotification('Error al inicializar la sección de clientes', 'error');
      }
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
      if (!form) return;

      // Remove existing event listeners to prevent duplicates
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);

      newForm.addEventListener('submit', async e => {
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
          newForm.reset();
          await this.cargarClientes();
        } catch (error) {
          console.error('Error al guardar cliente:', error);
          showNotification('Error al guardar cliente: ' + error.message, 'error');
        }
      });
    }




    // ========================================
    // FUNCIONES PARA EDITAR Y ELIMINAR
    // ========================================
    editarCliente(id) {
      console.log('Editar cliente con ID:', id);
      showNotification('Función de editar en desarrollo', 'info');
    }

    eliminarCliente(id) {
      if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
        console.log('Eliminar cliente con ID:', id);
        showNotification('Función de eliminar en desarrollo', 'info');
      }
    }
  }

  // Register the service for initialization
  window.sectionServices = window.sectionServices || {};
  window.sectionServices.clientes = new ClientesService();
  const toggleFormBtn = document.getElementById('toggle-form-button');
  const clienteFormContainer = document.getElementById('cliente-form-container');
  const clienteForm = document.getElementById('cliente-form');
  toggleFormBtn.addEventListener('click', () => {
    if(clienteFormContainer.style.display === 'none' || clienteFormContainer.style.display === '') {
        clienteFormContainer.style.display = 'block';
        toggleFormBtn.textContent = 'Ocultar Formulario';
    } else {
        clienteFormContainer.style.display = 'none';
        toggleFormBtn.textContent = 'Agregar Cliente';
        clienteForm.reset();
    }
    // Resto del código
  });
})();