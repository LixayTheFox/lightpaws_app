const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

const APP_ID = "com.lightpaws.destinyhub";

let updateDialogOpen = false;
let updateCheckInProgress = false;
let manualUpdateCheck = false;

if (process.platform === "win32") {
  app.setAppUserModelId(APP_ID);
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1360,
    height: 840,
    minWidth: 1040,
    minHeight: 680,
    title: "LightPaws Destiny Hub",
    icon: path.join(__dirname, "assets", "app-icon.ico"),
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
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on("update-available", async (info) => {
    if (updateDialogOpen) {
      return;
    }

    updateDialogOpen = true;
    manualUpdateCheck = false;
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
    } else {
      updateCheckInProgress = false;
    }
  });

  autoUpdater.on("update-not-available", async () => {
    updateCheckInProgress = false;

    if (!manualUpdateCheck) {
      return;
    }

    manualUpdateCheck = false;
    await dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["OK"],
      title: "Brak aktualizacji",
      message: "Masz najnowsza wersje aplikacji.",
      detail: `Aktualna wersja: ${app.getVersion()}`
    });
  });

  autoUpdater.on("update-downloaded", async (info) => {
    updateCheckInProgress = false;

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
    updateCheckInProgress = false;

    if (manualUpdateCheck) {
      manualUpdateCheck = false;
      dialog.showMessageBox(mainWindow, {
        type: "error",
        buttons: ["OK"],
        title: "Nie mozna sprawdzic aktualizacji",
        message: "Aplikacja nie mogla sprawdzic GitHub Releases.",
        detail: error.message || String(error)
      });
    }

    console.error("Auto-update error:", error);
  });

  setTimeout(() => {
    checkForUpdates(mainWindow, false).catch((error) => {
      console.error("Update check failed:", error);
    });
  }, 4000);
}

async function checkForUpdates(mainWindow, manual) {
  if (!app.isPackaged) {
    if (manual) {
      await dialog.showMessageBox(mainWindow, {
        type: "info",
        buttons: ["OK"],
        title: "Tryb developerski",
        message: "Aktualizacje sa sprawdzane tylko w zainstalowanej aplikacji.",
        detail: "Uruchom aplikacje z instalatora EXE albo z folderu dist\\win-unpacked, a nie przez npm start."
      });
    }

    return false;
  }

  if (updateCheckInProgress) {
    return false;
  }

  updateCheckInProgress = true;
  manualUpdateCheck = manual;
  await autoUpdater.checkForUpdates();
  return true;
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

ipcMain.handle("check-for-updates", async (event) => {
  const mainWindow = BrowserWindow.fromWebContents(event.sender);
  if (!mainWindow) {
    return false;
  }

  return checkForUpdates(mainWindow, true);
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
