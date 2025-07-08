import { app, BrowserWindow, BrowserView } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import window from "../../../brunxwindow/main.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const downloadViews = new Map();

/**
 * Tworzy widżet pobierania jako BrowserView i podpina go do danego okna
 */
function createDownloadView(win) {
  const view = new BrowserView({
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  });

  view.webContents.loadFile(path.join(__dirname, 'download.html'));

  downloadViews.set(win, view);

  const session = win.webContents.session;

  session.on('will-download', (event, item) => {
      win.addBrowserView(view);
  view.setBounds({ x: 10, y: 10, width: 360, height: 200 });
    const filePath = path.join(app.getPath('downloads'), item.getFilename());
    item.setSavePath(filePath);

    const send = (state, errorMsg) => {
      const payload = {
        id: item.getFilename(),
        received: item.getReceivedBytes(),
        total: item.getTotalBytes(),
        state,
        errorMsg
      };
      const code = `window.__injectDownloadProgress?.(${JSON.stringify(payload)});`;
      view.webContents.executeJavaScript(code).catch(console.error);
    };

    item.on('updated', () => {
      send(item.isPaused() ? 'paused' : 'progressing');
    });

    item.once('done', (_e, state) => {
      send(state === 'completed' ? 'completed' : 'error', state !== 'completed' ? state : undefined);
    });
  });

  win.on('closed', () => {
    downloadViews.delete(win);
  });

  view.webContents.on('did-finish-load', () => {
    const script = `
      if (window.__setWidgetSize) {
        window.__setWidgetSize(${view.getBounds().width}, ${view.getBounds().height});
      }
    `;
    view.webContents.executeJavaScript(script).catch(() => {});
  });
}

/**
 * Automatyczne dodawanie widżetu do nowych okien
 */
export function start() {
  app.on('browser-window-created', (_e, win) => {
    createDownloadView(win);
  });
  window.TabsWindow.forEach((win) => {
      createDownloadView(win);
    
  });
}

/**
 * Ręczne odświeżenie — np. wymuszenie zmiany rozmiaru lub ponowne renderowanie
 */
export function update() {
  for (const [win, view] of downloadViews.entries()) {
    if (win.isDestroyed() || view.webContents.isDestroyed()) continue;
    const { width, height } = view.getBounds();
    const code = `window.__setWidgetSize?.(${width}, ${height});`;
    view.webContents.executeJavaScript(code).catch(() => {});
  }
}