//zmeiń tylko tak aby dziąłlo neiz zmeiniał pls samej logiki
import fsExtra from "fs-extra";
import fs from "fs"
import path from "path"
import unzipper from "unzipper"
import { app, BrowserWindow, Menu } from "electron"
import axios from "axios"
import { fileURLToPath } from "url"
import git from "isomorphic-git"
import http from "isomorphic-git/http/node/index.cjs"
import window from "../../../brunxwindow/main.js"
import { spawn } from "child_process"
// 📁 Ścieżki
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const tempDir = path.join(process.env.TEMP || "C:\\Temp", "brunx-update")
const nodeZipURL = "https://nodejs.org/dist/v24.4.0/node-v24.4.0-win-x64.zip"

const nodeZipPath = path.join(tempDir, "node.zip")
const nodeDir = path.join(tempDir, "node")
const brunxDir = path.join(tempDir, "brunx")

// 📁 Rozpakuj ZIP
function extractZip(zipPath, targetDir) {
  return fs
    .createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: targetDir }))
    .promise()
}

// 📦 Pobierz plik z URL do folderu
async function downloadFile(url, outputPath) {
  try {
    const writer = fs.createWriteStream(outputPath)
    const response = await axios({ url, method: "GET", responseType: "stream" })

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log(`✅ Plik zapisany jako ${outputPath}`)
        resolve()
      })
      writer.on("error", reject)
    })
  } catch (err) {
    console.error("❌ Błąd pobierania:", err.message)
  }
}

// 📦 Wersja lokalna
function checkVersion() {
  // return app.getVersion()
  return "2.0.2"
}

// 📡 Sprawdź wersję online
async function checkOnlineVersion() {
  try {
    const res = await axios.get("https://api.github.com/repos/filutkowski/brunx/contents")
    const files = res.data
    const packageFile = files.find((file) => file.name === "package.json")

    if (!packageFile) {
      console.warn("Nie znaleziono package.json")
      return
    }

    const fileRes = await axios.get(packageFile.url)
    const base64Content = fileRes.data.content
    const decoded = Buffer.from(base64Content, "base64").toString("utf-8")

    return JSON.parse(decoded).version
  } catch (err) {
    console.error("Błąd pobierania wersji online:", err.message)
  }
}

// 🚀 Start aktualizacji
export async function start() {
  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const onlineVersion = await checkOnlineVersion();
    const localVersion = checkVersion();

    if (!onlineVersion) {
      console.warn("❗ Nie udało się sprawdzić wersji online.");
      return;
    }

    if (onlineVersion === localVersion) {
      console.log("✅ Wersja jest aktualna.");
      return;
    }

    // Zamknij istniejące okna
    window.SetTabsWindow([]);
    app.removeAllListeners("window-all-closed");
    window.TabsWindow.forEach(item => {
      item.close();
    });

    // Stwórz okno aktualizacji
    const updateWin = new BrowserWindow({
      width: 600,
      height: 300,
      resizable: false,
      title: "Aktualizacja Brunksa",
      minimizable: false,
      maximizable: false,
      closable: false,
      show: false,
    });

    await updateWin.setMenu(Menu.buildFromTemplate([]));
    await Menu.setApplicationMenu(null);
    updateWin.loadFile(path.join(__dirname, "update.html"));
    updateWin.once("ready-to-show", () => updateWin.show());

    updateWin.on("close", (e) => {
      e.preventDefault();
      console.log("❗ Okno aktualizacji nie może zostać zamknięte ręcznie.");
    });

    window.TabsWindow.push(updateWin);

    // Pobierz Node.js ZIP tylko jeśli nie istnieje
    if (!fs.existsSync(nodeZipPath)) {
      await downloadFile(nodeZipURL, nodeZipPath);
    }

    await extractZip(nodeZipPath, nodeDir);

    // Klonuj repozytorium
    await git.clone({
      fs,
      http,
      dir: brunxDir,
      url: "https://github.com/filutkowski/brunx.git",
      force: true,
      ref: "main",
      singleBranch: true,
      depth: 1,
    });
fs.writeFileSync(path.join(tempDir, "config.path"), String(process.cwd()))

const src = __dirname + "/script";
const dest = path.join(tempDir, "script");

try {
  await fsExtra.copy(src, dest, { overwrite: true });
} catch (err) {
  console.error("❌ Błąd kopiowania przez fs-extra:", err.message);
}
const installPackage = await spawn(path.resolve(path.join(tempDir, "node", "node-v24.4.0-win-x64", "npm.cmd")), ["exec", "electron ."], {
  stdio: "inherit", // pokazuje wyjście w konsoli
  shell: true,
  cwd: path.join(tempDir, "script")
});


const installScript = spawn(
  path.resolve(path.join(tempDir, "node", "node-v24.4.0-win-x64", "npm.cmd")),
  ["exec", "electron ."],
  {
    stdio: "ignore",
    shell: true,
    detached: true,
    cwd: path.join(tempDir, "script")
  }
);
installScript.unref();

// Wyjście z aplikacji natychmiast po uruchomieniu procesu
setImmediate(() => app.exit(0));




    console.log("🎉 Aktualizacja zakończona.");
  } catch (error) {
    console.error("🚨 Błąd aktualizacji:", error.message);
  }
}
