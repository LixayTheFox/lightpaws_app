const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

let updateDialogOpen = false;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1360,
    height: 840,
    minWidth: 1040,
    minHeight: 680,
    title: "LightPaws Destiny Hub",
    backgroundColor: "#111319",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  return mainWindow;
}

function setupAutoUpdater(mainWindow) {
  if (!app.isPackaged) {
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on("update-available", async (info) => {
    if (updateDialogOpen) {
      return;
    }

    updateDialogOpen = true;
    const result = await dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["Pobierz aktualizacje", "Pozniej"],
      defaultId: 0,
      cancelId: 1,
      title: "Dostepna aktualizacja",
      message: `Dostepna jest wersja ${info.version}.`,
      detail: `Obecna wersja: ${app.getVersion()}\nNowa wersja: ${info.version}\n\nCzy pobrac aktualizacje teraz?`
    });
    updateDialogOpen = false;

    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });

  autoUpdater.on("update-downloaded", async (info) => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["Zainstaluj i uruchom ponownie", "Pozniej"],
      defaultId: 0,
      cancelId: 1,
      title: "Aktualizacja gotowa",
      message: `Wersja ${info.version} zostala pobrana.`,
      detail: "Aplikacja moze teraz zamknac sie, zainstalowac aktualizacje i uruchomic ponownie."
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall(false, true);
    }
  });

  autoUpdater.on("error", (error) => {
    console.error("Auto-update error:", error);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      console.error("Update check failed:", error);
    });
  }, 4000);
}

ipcMain.handle("open-external", async (_event, url) => {
  if (typeof url !== "string") {
    return false;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return false;
  }

  await shell.openExternal(parsed.toString());
  return true;
});

app.whenReady().then(() => {
  const mainWindow = createWindow();
  setupAutoUpdater(mainWindow);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
