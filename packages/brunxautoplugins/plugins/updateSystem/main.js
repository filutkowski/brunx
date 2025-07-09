import { app } from 'electron';
import window from '../../../brunxwindow/main.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/*export function start() {

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


      // Po zakończeniu pobierania
      autoUpdater.on('update-downloaded', () => {
        win.webContents.executeJavaScript(`
          window.__setUpdateStatus?.("Gotowe! Aplikacja zostanie uruchomiona ponownie...");
        `);
        setTimeout(() => autoUpdater.quitAndInstall(), 3000);
      });

      // Rozpocznij pobieranie


    } else {
      console.log('✅ Brak nowej wersji — wszystko aktualne');
    }
  
}
    */