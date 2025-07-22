import window from "../packages/brunxwindow/main.js";
import * as plugins from "../packages/brunxautoplugins/main.js";
import { app } from "electron";
import { WebSocketServer } from "ws";

// Tworzymy serwer WS
const server = new WebSocketServer({ port: 3000 });

// Gdy Electron gotowy, odpal main
app.on("ready", main);

// Zamknięcie aplikacji (z wyjątkiem macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

async function main() {
  await window.createWindow();
  plugins.RunPlugins();
  server.on("connection", (socket) => {
    console.log("🟢 Nowe połączenie WebSocket");

    socket.on("message", async (msg) => {
      try {
        const url = String(msg).trim();
        const activeTabIndex = window.activeTabIndex;
        const tabs = window.TabsWindow;

        if (tabs && tabs[activeTabIndex]) {
          console.log(`🔗 Ładowanie URL: ${url}`);
          tabs[activeTabIndex].loadURL(url);
        } else {
          console.warn("⚠️ Nie znaleziono aktywnej zakładki");
        }
      } catch (error) {
        console.error("❌ Błąd podczas ładowania URL z WS:", error);
      }
    });
  });
}