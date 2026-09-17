import electron from 'electron';
const { contextBridge, ipcRenderer } = electron;

export interface ElectronAPI {
  getVersion: () => Promise<string>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  toggleFullScreen: () => Promise<boolean>;
  isFullScreen: () => Promise<boolean>;
  isMaximized: () => Promise<boolean>;
  printDocument: (options?: any) => Promise<boolean>;
}

const electronAPI: ElectronAPI = {
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
