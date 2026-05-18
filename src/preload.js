const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lightPaws", {
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  getNextCalendarEvent: () => ipcRenderer.invoke("get-next-calendar-event")
});
