// ========================================
// CONFIGURACIÓN Y CONSTANTES
// ========================================
const API_BASE_URL = 'https://backendtecnishop.onrender.com/api';
const loadedScripts = new Set();

// ========================================
// UTILIDADES GENERALES
// ========================================

// Función genérica para hacer peticiones a la API
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error en ${endpoint}:`, error);
    throw error;
  }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
  const typeEmoji = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };
  alert(`${typeEmoji[type] || 'ℹ️'} ${message}`);
}

// ========================================
// API CALLS (SIMPLIFICADAS)
// ========================================

async function getClientes() {
  try {
    return await apiRequest('/clientes/');
  } catch (error) {
    showNotification('Error al cargar clientes: ' + error.message, 'error');
    return [];
  }
}

async function createCliente(clienteData) {
  return await apiRequest('/clientes/crear/', {
    method: 'POST',
    body: JSON.stringify(clienteData),
  });
}

async function getEquipos() {
  try {
    const data = await apiRequest('/equipos/');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    showNotification('Error al cargar equipos: ' + error.message, 'error');
    return [];
  }
}

async function getOrdenes(limit = 10) {
  try {
    const data = await apiRequest(`/ordenes/0/${limit}`);
    return data.ordenes && Array.isArray(data.ordenes) 
      ? data.ordenes 
      : Array.isArray(data) ? data : [];
  } catch (error) {
    showNotification('Error al cargar órdenes: ' + error.message, 'error');
    return [];
  }
}

async function getDetalleOrden(ordenId) {
  try {
    return await apiRequest(`/ordenes/${ordenId}/`);
  } catch (error) {
    showNotification('Error al cargar detalle de orden: ' + error.message, 'error');
    throw error;
  }
}

// ========================================
// CARGA DINÁMICA DE SCRIPTS Y SECCIONES
// ========================================

// Función centralizada para cargar scripts de secciones
async function loadSectionScript(section) {
  if (loadedScripts.has(section)) {
    initializeSection(section);
    return;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `src/services/${section}.js`;
    
    script.onload = () => {
      console.log(`${section}.js cargado correctamente`);
      loadedScripts.add(section);
      initializeSection(section);
      resolve();
    };
    
    script.onerror = () => {
      const error = `Error al cargar ${section}.js`;
      console.error(error);
      reject(new Error(error));
    };
    
    document.body.appendChild(script);
  });
}

// Inicializar una sección
function initializeSection(section) {
  if (!window.sectionServices) {
    window.sectionServices = {};
  }

  if (window.sectionServices[section]?.initialize) {
    window.sectionServices[section].initialize();
  } else {
    console.error(`No se encontró el servicio para la sección ${section}`);
  }
}

// Cargar contenido HTML de una sección
async function loadContent(section) {
  const contentArea = document.getElementById('content-area');
  try {
    const response = await fetch(`src/main/screens/${section}.html`);
    if (!response.ok) throw new Error('Error al cargar la sección');
    contentArea.innerHTML = await response.text();
  } catch (error) {
    contentArea.innerHTML = '<p>Error al cargar el contenido.</p>';
    console.error(error);
  }
}

// ========================================
// NAVEGACIÓN
// ========================================

function initializeNavigation() {
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', async function () {
      // Actualizar estado activo
      document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');

      // Actualizar título
      const pageTitle = document.getElementById('page-title');
      if (pageTitle) {
        pageTitle.textContent = this.textContent.trim();
      }

      // Cargar sección
      const section = this.getAttribute('data-target');
      await loadContent(section);
      await loadSectionScript(section);
    });
  });
}

// Función auxiliar para establecer fecha actual
function setCurrentDate() {
  const today = new Date().toISOString().split('T')[0];
  const fechaInput = document.getElementById('fecha');
  if (fechaInput) {
    fechaInput.value = today;
  }
}

// ========================================
// INICIALIZACIÓN
// ========================================


document.addEventListener('DOMContentLoaded', async function () {
  console.log('Inicializando aplicación...');
  initializeNavigation();
  
  await loadContent('dashboard');
  await loadSectionScript('dashboard');
  
  console.log('Aplicación inicializada correctamente');
});