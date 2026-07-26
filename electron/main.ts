import {
  app,
  BrowserWindow,
  net,
  protocol,
} from "electron";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { registerProjectMentorIpc } from "./ipc";

const DEVELOPMENT_URL = "http://localhost:3000";
const PRODUCTION_URL = "app://projectmentor/";

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

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
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    if (!isAllowedNavigation(navigationUrl)) {
      event.preventDefault();
    }
  });

  if (app.isPackaged) {
    void mainWindow.loadURL(PRODUCTION_URL);
  } else {
    void mainWindow.loadURL(DEVELOPMENT_URL);
  }

  return mainWindow;
}

app.whenReady().then(() => {
  registerStaticRendererProtocol();
  registerProjectMentorIpc();
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

function registerStaticRendererProtocol(): void {
  protocol.handle("app", (request) => {
    const filePath = resolveRendererPath(request.url);

    if (!filePath) {
      return new Response("Not found", { status: 404 });
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });
}

function resolveRendererPath(requestUrl: string): string | null {
  try {
    const url = new URL(requestUrl);

    if (url.protocol !== "app:" || url.host !== "projectmentor") {
      return null;
    }

    const rendererRoot = path.resolve(process.resourcesPath, "out");
    let pathname = decodeURIComponent(url.pathname).replaceAll("\\", "/");

    if (pathname.includes("\0")) {
      return null;
    }

    if (pathname.endsWith("/")) {
      pathname += "index.html";
    } else if (path.extname(pathname) === "") {
      pathname += "/index.html";
    }

    const filePath = path.resolve(rendererRoot, `.${pathname}`);
    const relativePath = path.relative(rendererRoot, filePath);

    if (
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath)
    ) {
      return null;
    }

    return filePath;
  } catch {
    return null;
  }
}

function isAllowedNavigation(navigationUrl: string): boolean {
  try {
    const url = new URL(navigationUrl);

    if (app.isPackaged) {
      return url.protocol === "app:" && url.host === "projectmentor";
    }

    return url.origin === DEVELOPMENT_URL;
  } catch {
    return false;
  }
}
