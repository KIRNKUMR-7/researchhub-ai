// electron/main.cjs  — Electron main process
// Run: npm run electron:dev  (web dev server must be running first)

const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV !== "production";

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        titleBarStyle: "hidden",          // macOS-style hidden title bar
        trafficLightPosition: { x: 16, y: 14 },
        backgroundColor: "#111111",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
        },
        icon: path.join(__dirname, "../public/favicon.ico"),
        show: false,
    });

    // Load app
    const url = isDev ? "http://localhost:5173" : `file://${path.join(__dirname, "../dist/index.html")}`;
    mainWindow.loadURL(url);

    // Show when ready to prevent white flash
    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
        if (isDev) {
            // mainWindow.webContents.openDevTools(); // uncomment to debug
        }
    });

    // Open external links in system browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: "deny" };
    });

    // Custom menu (minimal, macOS-friendly)
    const menu = Menu.buildFromTemplate([
        {
            label: "ResearchHub AI",
            submenu: [
                { role: "about" },
                { type: "separator" },
                { role: "hide" },
                { role: "hideOthers" },
                { role: "unhide" },
                { type: "separator" },
                { role: "quit" },
            ],
        },
        {
            label: "Edit",
            submenu: [
                { role: "undo" },
                { role: "redo" },
                { type: "separator" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste" },
                { role: "selectAll" },
            ],
        },
        {
            label: "View",
            submenu: [
                { role: "reload" },
                { role: "forceReload" },
                { type: "separator" },
                { role: "resetZoom" },
                { role: "zoomIn" },
                { role: "zoomOut" },
                { type: "separator" },
                { role: "togglefullscreen" },
            ],
        },
        {
            label: "Window",
            submenu: [
                { role: "minimize" },
                { role: "zoom" },
                { type: "separator" },
                { role: "front" },
            ],
        },
    ]);
    Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
