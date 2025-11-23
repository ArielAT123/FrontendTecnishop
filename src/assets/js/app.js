// src/js/app.js

class App {
  constructor() {
    this.navigationManager = null;
  }

  async init() {
    try {
      console.log('Inicializando aplicación...');
      
      // Inicializar el sistema de navegación
      this.navigationManager = new NavigationManager();
      this.navigationManager.setupNavigation();
      
      // Hacer el navegador disponible globalmente
      window.navigationManager = this.navigationManager;
      
      // Cargar la primera screen (por defecto clientes)
      await this.navigationManager.showScreen('clientes');
      
      console.log('Aplicación inicializada correctamente');
      ////showNotification('Sistema cargado correctamente', 'success');
      
    } catch (error) {
      console.error('Error al inicializar la aplicación:', error);
      ////showNotification('Error al cargar el sistema', 'error');
    }
  }

  // Método para manejar errores globales
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('Error global:', event.error);
      ////showNotification('Ha ocurrido un error inesperado', 'error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Promise rechazada:', event.reason);
      ////showNotification('Error en operación asíncrona', 'error');
    });
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  const app = new App();
  app.setupErrorHandling();
  await app.init();
});

// Hacer App disponible globalmente por si necesitas acceder a ella
window.App = App;