const { app, BrowserWindow } = require('electron');
const path = require('path');
// const isDev = require('electron-is-dev'); // Remove or comment out this line
const url = require('url');

let mainWindow;

async function createWindow() { // Made the function async
  // Dynamically import electron-is-dev
  const { default: isDev } = await import('electron-is-dev');

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false, // Keep false for security
      contextIsolation: true, // Keep true for security
      preload: path.join(__dirname, 'preload.js') // Optional preload script if needed
    },
    icon: path.join(__dirname, '../assets/icon.png') // Path to your app icon
  });

  const startUrl = isDev
    ? 'http://localhost:9002' // Dev server URL
    : url.format({
        pathname: path.join(__dirname, '../out/index.html'), // Production build path
        protocol: 'file:',
        slashes: true,
      });


  mainWindow.loadURL(startUrl);

   // Open DevTools in dev mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow); // This will now call the async createWindow function

app.on('window-all-closed', function () {
  // On macOS it's common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
