require('dotenv').config();
const path = require('path');
const os = require('os');
const fs = require('fs');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const ResizeImg = require('resize-img');
const { Buffer } = require('buffer');

const isDev = process.env.NODE_ENV === 'development';
const isMac = process.platform === 'darwin';

let mainWindow;
const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    title: 'Image Resizer',
    width: isDev ? 1000 : 500,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.loadFile(path.join(__dirname, './renderer/index.html')); // Changed from loadURL to loadFile
};

app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});

// MENU TEMPLATES
const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: 'About',
              click: () => createAboutWindow(),
            },
          ],
        },
      ]
    : []),
  {
    role: 'fileMenu',
  },
  ...(!isMac
    ? [
        {
          label: 'Help',
          submenu: [
            {
              label: 'About',
              click: () => createAboutWindow(),
            },
          ],
        },
      ]
    : []),
];

const createAboutWindow = () => {
  const aboutWindow = new BrowserWindow({
    title: 'About Image Resizer',
    width: 300,
    height: 300,
  });

  aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
};

app.whenReady().then(() => {
  createMainWindow();

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  mainWindow.on('closed',() => (mainWindow = null));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Function to convert data URL to buffer
const dataURLToBuffer = (dataURL) => {
  const base64Data = dataURL.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64Data, 'base64');
};

const resizeImage = async ({ imagePath, width, height, dest }) => {
  try {
    // If imagePath is a data URL, convert it to buffer
    let imageBuffer;
    if (imagePath.startsWith('data:image/')) {
      imageBuffer = dataURLToBuffer(imagePath);
    } else {
      imageBuffer = fs.readFileSync(imagePath);
    }

    const newPath = await ResizeImg(imageBuffer, {
      width: +width,
      height: +height,
    });
    
    const filename = path.basename(imagePath);
    
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.writeFileSync(path.join(dest, filename), newPath);

    // Send success message
    mainWindow.webContents.send('image:done');
    // Open dest folder
    shell.openPath(dest);

  } catch (error) {
    console.error(`Error resizing image: ${error}`);
  }
};

ipcMain.on('image:resize', (e, options) => {
  options.dest = path.join(os.homedir(), 'imageResizer');
  resizeImage(options);
});
