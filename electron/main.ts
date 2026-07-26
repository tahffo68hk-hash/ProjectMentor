import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";

const DEVELOPMENT_URL = "http://localhost:3000";

function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: "#f4f4f5",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  if (app.isPackaged) {
    // TODO: Load the exported Next.js renderer from frontend/out.
    void mainWindow.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(
          "<main style=\"font-family:system-ui;padding:32px\"><h1>ProjectMentor</h1><p>Production renderer packaging is planned for the next migration phase.</p></main>",
        ),
    );
  } else {
    void mainWindow.loadURL(DEVELOPMENT_URL);
  }

  return mainWindow;
}

app.whenReady().then(() => {
  ipcMain.handle("app:get-version", () => app.getVersion());
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
