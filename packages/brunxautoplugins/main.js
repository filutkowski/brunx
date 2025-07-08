import fs from 'fs/promises';
import * as TOML from '@iarna/toml';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, 'plugins.toml');
const PLUGINSPATH = path.join(__dirname, 'plugins');

export async function RunPlugins() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    const parsed = TOML.parse(raw);
    const list = parsed.pluginList;

    if (!Array.isArray(list)) {
      throw new Error("Invalid config format: 'pluginList' must be a TOML array ([[pluginList]])");
    }

    console.log(`🔍 Validating ${list.length} plugin(s)...\n`);

    const invalid = [];
    for (let i = 0; i < list.length; i++) {
      const plugin = list[i];
      const ok =
        typeof plugin.name === 'string' &&
        typeof plugin.version === 'string' &&
        typeof plugin.enabled === 'boolean';

      const percent = Math.round(((i + 1) / list.length) * 100);
      const progress = `[${'█'.repeat(Math.round(percent / 10)).padEnd(10)}] ${percent}%`;

      if (ok) {
        console.log(`✅ ${progress} Plugin "${plugin.name}" is valid`);
      } else {
        console.log(`❌ ${progress} Plugin "${plugin.name || '[unknown]'}" is invalid`);
        invalid.push({ index: i, plugin });
      }

      await new Promise((res) => setTimeout(res, 100)); // wizualny efekt
    }

    console.log(); // pusta linia

    if (invalid.length > 0) {
      console.error(`⛔ Found ${invalid.length} invalid plugin(s):`);
      invalid.forEach(({ index, plugin }) => {
        console.log(`- At index ${index}:`, plugin);
        if (typeof plugin.name !== 'string') console.log('  ↪ "name" must be a string');
        if (typeof plugin.version !== 'string') console.log('  ↪ "version" must be a string');
        if (typeof plugin.enabled !== 'boolean') console.log('  ↪ "enabled" must be a boolean');
        if (typeof plugin.updateTime !== 'number') console.log('  ↪ "updateTime" must be an integer');
      });
      throw new Error("Validation failed: some plugins are missing required fields or have invalid types.");
    }

    console.log("🎉 Validation complete. All plugins are valid.\n");
    console.log("📂 Plugin directory:", PLUGINSPATH);
    console.log("📄 Configuration file:", CONFIG_PATH);
    console.log("🔗 Plugin list:", list.map((p) => p.name).join(', '));
    console.log("🔗 Plugin versions:", list.map((p) => p.version).join(', '));
    console.log("🚀 Importing and running plugins...\n");

    for (const plugin of list) {
      if (plugin.enabled) {
      console.log(`📥 Importing plugin "${plugin.name}"...`);
      const pluginPath = path.join(PLUGINSPATH, plugin.name, 'main.js');
      const pluginObj = await import(`file://${pluginPath}`);

      if (typeof pluginObj.start === 'function') {
        console.log(`▶ Running plugin "${plugin.name}"...`);
        pluginObj.start();
      }

      if (typeof pluginObj.update === 'function') {
        const interval = plugin.updateTime ?? 200;
        console.log(`⏱️  Scheduling update every ${interval}ms for plugin "${plugin.name}"`);
        setInterval(() => {
          
          pluginObj.update();
        }, interval);
      }
    }
    else {
        console.log(`🚫 Plugin "${plugin.name}" is disabled, skipping...`);
        continue;
      }
  }
    return list;
  } catch (err) {
    console.error("🔧 Plugin validation failed:", err.message);
    process.exit(1);
  }
}
