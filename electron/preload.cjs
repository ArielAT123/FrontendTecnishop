const { contextBridge, ipcRenderer } = require('electron');

const electronAPI = {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  toggleFullScreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  isFullScreen: () => ipcRenderer.invoke('window:is-fullscreen'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  printDocument: (options) => ipcRenderer.invoke('print:document', options),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
