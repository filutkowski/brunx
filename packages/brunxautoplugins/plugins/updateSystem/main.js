import pkg from 'electron-updater';
const { autoUpdater } = pkg;

import { app } from 'electron';
import window from '../../../brunxwindow/main.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function start() {
  autoUpdater.checkForUpdates().then(result => {
    const remoteVersion = result?.updateInfo?.version;
    const currentVersion = app.getVersion();

    if (remoteVersion && remoteVersion !== currentVersion) {
      console.log(`🆕 Dostępna wersja ${remoteVersion} (obecna: ${currentVersion})`);
      
      // Ukrycie wszystkich TabsWindowów
      window.TabsWindow.forEach((win) => win.hide());

      const win = window.TabsWindow[0];
      win.show();
      win.setSize(600, 350);
      win.setTitle('Aktualizacja systemu');
      win.setResizable(false);
      win.setMaximizable(false);
      win.setMinimizable(false);
      win.setClosable(false);
      win.setAlwaysOnTop(true);
      win.setMenuBarVisibility(false);
      win.setFullScreenable(false);
      win.setMenu(null);
      win.setBackgroundColor('#000000ff');

      win.loadFile(path.join(__dirname, 'update.html')).then(() => {
        win.webContents.executeJavaScript(`
          window.__setUpdateStatus?.("Pobieranie aktualizacji...");
        `);
      });

      // Postęp pobierania
      autoUpdater.on('download-progress', (progress) => {
        const percent = progress.percent.toFixed(1);
        win.webContents.executeJavaScript(`
          window.__setUpdateStatus?.("Pobieranie... ${percent}%");
        `);
      });

      // Po zakończeniu pobierania
      autoUpdater.on('update-downloaded', () => {
        win.webContents.executeJavaScript(`
          window.__setUpdateStatus?.("Gotowe! Aplikacja zostanie uruchomiona ponownie...");
        `);
        setTimeout(() => autoUpdater.quitAndInstall(), 3000);
      });

      // Rozpocznij pobieranie
      autoUpdater.downloadUpdate();

    } else {
      console.log('✅ Brak nowej wersji — wszystko aktualne');
    }
  }).catch(err => {
    console.error('❌ Błąd sprawdzania aktualizacji:', err);
  });
}