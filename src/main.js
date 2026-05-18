const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const ICAL = require("ical.js");
const path = require("path");

const APP_ID = "com.lightpaws.destinyhub";
const CALENDAR_CONFIG = require("./calendar-config.json");

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

function calendarIcsUrl() {
  if (CALENDAR_CONFIG.publicIcsUrl) {
    return CALENDAR_CONFIG.publicIcsUrl;
  }

  if (CALENDAR_CONFIG.googleCalendarId) {
    return `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_CONFIG.googleCalendarId)}/public/basic.ics`;
  }

  return "";
}

function calendarWindowEnd() {
  const lookAheadDays = Number(CALENDAR_CONFIG.lookAheadDays) || 180;
  return new Date(Date.now() + lookAheadDays * 24 * 60 * 60 * 1000);
}

function readTextFromUrl(url) {
  return fetch(url, {
    headers: {
      "user-agent": `${app.getName()}/${app.getVersion()}`
    }
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Calendar request failed with HTTP ${response.status}`);
    }

    return response.text();
  });
}

function eventOccurrence(calendarEvent, start, end) {
  return {
    title: calendarEvent.summary || "Wydarzenie klanu",
    description: calendarEvent.description || "",
    location: calendarEvent.location || "",
    url: calendarEvent.component.getFirstPropertyValue("url") || "",
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: calendarEvent.startDate.isDate
  };
}

function extractCalendarEvents(icsText) {
  const jcal = ICAL.parse(icsText);
  const calendar = new ICAL.Component(jcal);
  const now = new Date();
  const maxDate = calendarWindowEnd();
  const events = [];

  for (const component of calendar.getAllSubcomponents("vevent")) {
    const calendarEvent = new ICAL.Event(component);

    if (calendarEvent.isRecurring()) {
      const iterator = calendarEvent.iterator();
      let next;
      let guard = 0;

      while ((next = iterator.next()) && guard < 500) {
        guard += 1;
        const details = calendarEvent.getOccurrenceDetails(next);
        const start = details.startDate.toJSDate();
        const end = details.endDate.toJSDate();

        if (end < now) {
          continue;
        }

        if (start > maxDate) {
          break;
        }

        events.push(eventOccurrence(calendarEvent, start, end));
      }
    } else {
      const start = calendarEvent.startDate.toJSDate();
      const end = calendarEvent.endDate.toJSDate();

      if (end >= now && start <= maxDate) {
        events.push(eventOccurrence(calendarEvent, start, end));
      }
    }
  }

  return events.sort((first, second) => new Date(first.start) - new Date(second.start));
}

async function getNextCalendarEvent() {
  const url = calendarIcsUrl();

  if (!url) {
    return {
      configured: false,
      event: null,
      source: "Google Calendar",
      timezone: CALENDAR_CONFIG.timezone || "Europe/Warsaw"
    };
  }

  const icsText = await readTextFromUrl(url);
  const events = extractCalendarEvents(icsText);

  return {
    configured: true,
    event: events[0] || null,
    source: url,
    timezone: CALENDAR_CONFIG.timezone || "Europe/Warsaw"
  };
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

ipcMain.handle("get-next-calendar-event", () => getNextCalendarEvent());

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
