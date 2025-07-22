import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { BrowserWindow, app, Menu } from "electron";
import { spawn, exec } from "child_process";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ścieżka do config.json
const CONFIGFILE = path.join(__dirname, "..", "config.path");
const PATH = fs.readFileSync(CONFIGFILE)

// 🔍 Ścieżka do handle.exe
const handlePath = path.join(__dirname, "sysint", "handle.exe");

// 📁 Folder, którego blokady chcesz wykryć
const targetFolder = PATH;

// 🚀 Uruchom handle.exe
const handleProc = spawn(handlePath, [targetFolder]);

handleProc.stdout.on("data", (data) => {
  const output = data.toString();
  const lines = output.split("\n");

  lines.forEach((line) => {
    const match = line.match(/pid: (\d+)/i);
    if (match) {
      const pid = match[1];
      console.log("🔧 Wykryto proces z PID:", pid);

      // 🛑 Spróbuj go zabić
      exec(`taskkill /PID ${pid} /F`, (err, stdout, stderr) => {
        if (err) {
          console.error("❌ Nie udało się zabić procesu:", err.message);
        } else {
          console.log("✅ Zakończono proces PID:", pid);
        }
      });
    }
  });
});

handleProc.stderr.on("data", (data) => {
  console.error("⚠️ Błąd z handle.exe:", data.toString());
});

handleProc.on("close", (code) => {
  console.log(`📦 Skanowanie zakończone (kod wyjścia: ${code})`);
});



// Usuń katalog docelowy
if (fs.existsSync(PATH)) {
  fs.rmSync(PATH, { recursive: true, force: true });
}

// Skopiuj folder brunx do katalogu PATH
fs.cpSync(path.join(__dirname, "..", "brunx"), PATH, {
  recursive: true,
  force: true
});

// Stwórz okno
function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 300,
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.loadFile("index.html");
  win.setAutoHideMenuBar(true);
  win.setMinimizable(false);
  win.setMaximizable(false);
  Menu.setApplicationMenu(null);
}

app.whenReady().then(createWindow);