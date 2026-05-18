const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lightPaws", {
  openExternal: (url) => ipcRenderer.invoke("open-external", url)
});
