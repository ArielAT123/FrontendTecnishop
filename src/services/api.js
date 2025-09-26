// ========================================
// CONFIGURACIÓN Y CONSTANTES
// ========================================
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Track loaded scripts to prevent re-loading
const loadedScripts = new Set();

// ========================================
// API CALLS
// ========================================

// Función para obtener clientes de la API
async function getClientes() {
  try {
    const response = await fetch(`${API_BASE_URL}/clientes/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    showNotification('Error al cargar clientes: ' + error.message, 'error');
    return [];
  }
}

// Función para crear un nuevo cliente
async function createCliente(clienteData) {
  try {
    console.log('Creando cliente con datos:', clienteData);
    const response = await fetch(`${API_BASE_URL}/clientes/crear/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clienteData),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al crear cliente:', error);
    throw error;
  }
}

// Función para obtener equipos
async function getEquipos() {
  try {
    const response = await fetch(`${API_BASE_URL}/equipos/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    showNotification('Error al cargar equipos: ' + error.message, 'error');
    return [];
  }
}

// Función para obtener órdenes
async function getOrdenes(limit = 10) {
  try {
    console.log(`Solicitando últimas ${limit} órdenes...`);
    const response = await fetch(`${API_BASE_URL}/ordenes/0/${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data.ordenes && Array.isArray(data.ordenes) ? data.ordenes : Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    showNotification('Error al cargar órdenes: ' + error.message, 'error');
    return [];
  }
}

// Función para obtener el detalle de una orden
async function getDetalleOrden(ordenId) {
  try {
    const response = await fetch(`${API_BASE_URL}/orden/${ordenId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener detalle de orden:', error);
    showNotification('Error al cargar detalle de orden: ' + error.message, 'error');
    throw error;
  }
}

// ========================================
// UTILIDADES
// ========================================

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
  const typeEmoji = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };
  alert(`${typeEmoji[type] || 'ℹ️'} ${message}`); // TODO: Replace with a better notification system
}

// Función para establecer la fecha actual
function setCurrentDate() {
  const today = new Date().toISOString().split('T')[0];
  const fechaInput = document.getElementById('fecha');
  if (fechaInput) {
    fechaInput.value = today;
  }
}

// ========================================
// INICIALIZACIÓN DE SECCIONES
// ========================================
function initializeSection(section) {
  if (!window.sectionServices) {
    window.sectionServices = {};
  }

  // Initialize the section service if it exists
  if (window.sectionServices[section] && typeof window.sectionServices[section].initialize === 'function') {
    window.sectionServices[section].initialize();
  } else {
    console.error(`No se encontró el servicio para la sección ${section}`);
  }
}

// ========================================
// NAVEGACIÓN DEL MENÚ Y CARGA DINÁMICA
// ========================================
function initializeNavigation() {
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', async function () {
      document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');

      const pageTitle = document.getElementById('page-title');
      if (pageTitle) {
        pageTitle.textContent = this.textContent.trim();
      }

      const section = this.getAttribute('data-target');
      await loadContent(section);

      // Load the section script only if not already loaded
      if (!loadedScripts.has(section)) {
        const newScript=section;
        const script = document.createElement('script');
        script.src = `src/services/${newScript}.js`;
        script.onload = () => {
          console.log(`${newScript}.js cargado correctamente`);
          loadedScripts.add(section);
          initializeSection(section); // Initialize after script is loaded
        };
        script.onerror = () => console.error(`Error al cargar ${script.src}`);
        document.body.appendChild(script);
      } else {
        initializeSection(section); // Re-initialize if script is already loaded
      }
    });
  });
}

// Función para cargar contenido dinámicamente
async function loadContent(section) {
  const contentArea = document.getElementById('content-area');
  try {
    const response = await fetch(`src/main/screens/${section}.html`);
    if (!response.ok) throw new Error('Error al cargar la sección');
    const content = await response.text();
    contentArea.innerHTML = content;
  } catch (error) {
    contentArea.innerHTML = '<p>Error al cargar el contenido.</p>';
    console.error(error);
  }
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', function () {
  console.log('Inicializando aplicación...');
  initializeNavigation();
  loadContent('dashboard').then(() => {
    if (loadedScripts.has('dashboard')) {
      initializeSection('dashboard');
    } else {
      const script = document.createElement('script');
      script.src = './src/services/dashboard.js';
      script.onload = () => {
        console.log('dashboard.js cargado correctamente');
        loadedScripts.add('dashboard');
        initializeSection('dashboard');
      };
      script.onerror = () => console.error('Error al cargar dashboard.js');
      document.body.appendChild(script);
    }
  });
  console.log('Aplicación inicializada correctamente');
});