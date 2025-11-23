import { app, BrowserWindow, ipcMain } from 'electron';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1720,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Para usar require en el renderer
      enableRemoteModule: true,
    },
  });

  // Cargar pantalla de login
  mainWindow.loadFile('src/main/screens/login/loginScreen.html');

  // Opcional: Abrir DevTools en desarrollo
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ✅ Escuchar evento de login exitoso
ipcMain.on('login-success', (event, userData) => {
  console.log('✅ Login exitoso:', userData);
  
  // Cambiar a la pantalla principal/dashboard
  mainWindow.loadFile('index.html');
  // O si tienes index.html:
  // mainWindow.loadFile('index.html');
});

// ✅ Escuchar evento de logout
ipcMain.on('logout', () => {
  console.log('🔒 Cerrando sesión...');
  
  // Volver a la pantalla de login
  mainWindow.loadFile('src/main/screens/login/loginScreen.html');
});

// ✅ Opcional: Cambiar a cualquier pantalla
ipcMain.on('navigate-to', (event, filePath) => {
  console.log('📍 Navegando a:', filePath);
  mainWindow.loadFile(filePath);
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});