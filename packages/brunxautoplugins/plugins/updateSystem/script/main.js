import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { BrowserWindow, app, Menu } from "electron"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CONFIGFILE = path.join(__dirname, "..", "config.json")
const PATH = fs.writeFileSync(CONFIGFILE)


await fs.rmdirSync(PATH, {recursive: true, force: true})
await fs.cpSync(path.join(__dirname, "..", "brunx"), PATH, {recursive: true, force: true})




function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 300,
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.loadFile("index.html");
  win.setAutoHideMenuBar(true)
  win.setMinimizable(false)
  win.setMaximizable(false)
  Menu.setApplicationMenu(null)
}

app.whenReady().then(createWindow);
