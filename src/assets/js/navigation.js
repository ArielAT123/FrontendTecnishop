// src/js/navigation.js
class NavigationManager {
  constructor() {
    this.currentScreen = null;
    this.screens = {
      'clientes': () => window.sectionServices?.clientes,
      'productos': () => window.sectionServices?.productos,
      'ordenes': () => window.sectionServices?.ordenes,
      'reportes': () => window.sectionServices?.reportes,
    };
  }

  async showScreen(screenName) {
    try {
      console.log(`Cambiando a screen: ${screenName}`);
      
      // Destruir screen anterior si existe
      if (this.currentScreen && this.screens[this.currentScreen]) {
        const currentService = this.screens[this.currentScreen]();
        if (currentService && typeof currentService.destroy === 'function') {
          console.log(`Destruyendo servicio: ${this.currentScreen}`);
          currentService.destroy();
        }
      }

      // Remover clase active de botones de navegación
      const navButtons = document.querySelectorAll('.nav-button');
      navButtons.forEach(btn => btn.classList.remove('active'));

      // Ocultar todas las screens
      const allScreens = document.querySelectorAll('.content-area');
      allScreens.forEach(screen => {
        screen.style.display = 'none';
        screen.classList.remove('active');
      });

      // Mostrar la screen solicitada
      const targetScreen = document.getElementById(screenName);
      if (targetScreen) {
        targetScreen.style.display = 'block';
        targetScreen.classList.add('active');
        
        // Marcar botón como activo
        const activeButton = document.querySelector(`[data-screen="${screenName}"]`);
        if (activeButton) {
          activeButton.classList.add('active');
        }
        
        // Inicializar el servicio de la nueva screen
        if (this.screens[screenName]) {
          const service = this.screens[screenName]();
          if (service && typeof service.initialize === 'function') {
            console.log(`Inicializando servicio: ${screenName}`);
            await service.initialize();
          }
        }
        
        this.currentScreen = screenName;
        console.log(`Screen ${screenName} cargada correctamente`);
      } else {
        console.error(`Screen ${screenName} no encontrada`);
      }
    } catch (error) {
      console.error(`Error al cambiar a screen ${screenName}:`, error);
      // //showNotification && //showNotification(`Error al cargar ${screenName}`, 'error');
    }
  }

  getCurrentScreen() {
    return this.currentScreen;
  }

  setupNavigation() {
    // Event delegation para botones de navegación
    document.addEventListener('click', async (e) => {
      if (e.target.matches('[data-screen]')) {
        e.preventDefault();
        const screenName = e.target.getAttribute('data-screen');
        await this.showScreen(screenName);
      }
    });

    console.log('Sistema de navegación configurado');
  }
}

// Hacer disponible globalmente
window.NavigationManager = NavigationManager;