import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS_PATH = path.join(app.getPath('userData'), 'window-settings.json');

let TabsWindow = [];
let activeTabIndex = 0;
let windowSettings = { width: 900, height: 700 };

// Wczytaj ustawienia okna
function loadWindowSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      windowSettings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
    }
  } catch {
    windowSettings = { width: 900, height: 700 };
  }
}

// Zapisz ustawienia okna
function saveWindowSettings(win) {
  if (!win) return;
  const { width, height } = win.getBounds();
  windowSettings = { width, height };
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(windowSettings));
}

// Tworzenie nowej zakładki/okna
function createWindow() {
  loadWindowSettings();
  const win = new BrowserWindow({
    width: windowSettings.width,
    height: windowSettings.height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },

    show: false,
  });

  win.loadFile(path.join(__dirname, 'home.html'));

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('close', () => {
    saveWindowSettings(win);
  });


  win.on('closed', () => {
   TabsWindow.splice(TabsWindow.indexOf(win), 1);
    refreshMenu();
  });

  TabsWindow.push(win);
  activeTabIndex = TabsWindow.length - 1;
  refreshMenu();
  return win;
}

// Dodaj nową zakładkę
function addTab() {
  return createWindow();
}

// Usuń zakładkę
function removeTab(win) {
  const idx = TabsWindow.indexOf(win);
  if (idx > -1) {
    TabsWindow[idx].close();
    TabsWindow.splice(idx, 1);
    refreshMenu();
    if (TabsWindow.length > 0) {
      changeTab(0);
    }
  }
}

// Przełącz na wybraną zakładkę
function changeTab(index) {
  if (index < 0 || index >= TabsWindow.length) return;
  TabsWindow.forEach((win, i) => {
    if (i === index) {
      win.show();
      win.focus();
      activeTabIndex = i;
    } else {
      win.hide();
    }
  });
  refreshMenu();
}

// Pobierz wszystkie zakładki
function getTabs() {
  return TabsWindow;
}

// Dynamiczne menu kart
function createAppMenu() {
  const tabs = getTabs();
  const tabSubmenu = tabs.map((win, idx) => ({
    label: `Karta ${idx + 1}${win.isVisible() ? ' (aktywna)' : ''}`,
    submenu: [
      {
        label: 'Przejdź do tej karty',
        click: () => changeTab(idx)
      },
      {
        label: 'Usuń tę kartę',
        click: () => removeTab(win)
      }
    ]
  }));

  const template = [
    {
      label: 'Karty',
      submenu: [
        {
          label: 'Dodaj kartę',
          accelerator: 'CmdOrCtrl+T',
          click: () => addTab()
        },
        { type: 'separator' },
        ...tabSubmenu
      ]
    },
    {
      label: 'Plik',
      submenu: [
        {
          label: 'Wyjście',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Odśwież menu po każdej zmianie kart
function refreshMenu() {
  createAppMenu();
}

app.on('ready', () => {
  createAppMenu();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (TabsWindow.length === 0) {
    createWindow();
  }
});

export default { createWindow, addTab, removeTab, getTabs, changeTab, refreshMenu, TabsWindow, activeTabIndex, windowSettings };