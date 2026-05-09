import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import configs from "../utils/configmanager.js";
import { getDevice } from "baileys";
import stylizedChar from "../utils/fancy.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function getCategoryIcon(category) {
  const icons = {
    "utils": "⚡",
    "media": "🎬",
    "group": "👥",
    "bug": "🐞",
    "tags": "🏷️",
    "moderation": "🛡️",
    "owner": "👑",
    "creator": "💎",
    "fun": "🎮",
    "ia": "🤖",
    "premium": "💫",
    "settings": "🔧"
  };
  return icons[category.toLowerCase()] || "▪️";
}

export default async function info(client, message) {
  try {
    const remoteJid = message.key.remoteJid;
    const userName = message.pushName || "Unknown";
    
    const usedRam = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
    const totalRam = (os.totalmem() / 1024 / 1024).toFixed(1);
    const uptime = formatUptime(process.uptime());
    const platform = os.platform();
   
    const botId = client.user.id.split(":")[0];
    const prefix = configs.config.users?.[botId]?.prefix || ".";
    
    const now = new Date();
    const daysFR = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
    const date = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;
    const day = daysFR[now.getDay()];
    
    const handlerPath = path.join(__dirname, "../events/messageHandler.js");
    const handlerCode = fs.readFileSync(handlerPath, "utf-8");
    
    const commandRegex = /case\s+['"](\w+)['"]\s*:\s*\/\/\s*@cat:\s*([^\n\r]+)/g;
    const categories = {};
    let match;

    while ((match = commandRegex.exec(handlerCode)) !== null) {
      const command = match[1];
      const category = match[2].trim();
      if (!categories[category]) categories[category] = [];
      categories[category].push(command);
    }

    // DESIGN NEON CYBERPUNK
    let menu = `╭━━━━━━━━━━━━━━━━╮
┃  █▀▀ █▀▀█ █▀▀▄ █▀▀  ┃
┃  █▀▀ █▄▄█ █░░█ █▀▀  ┃
┃  ▀▀▀ ▀░░▀ ▀░░▀ ▀▀▀  ┃
╰━━━━━━━━━━━━━━━━╯

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
✧ *INFORMATIONS* ✧
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
➣ *Préfixe* : 「 ${prefix} 」
➣ *Créateur* : ${stylizedChar(userName)}
➣ *Version* : 1.0.0
➣ *Uptime* : ${uptime}
➣ *RAM* : ${usedRam}/${totalRam} MB
➣ *Plateforme* : ${platform}
➣ *Date* : ${date} (${stylizedChar(day)})
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;

    for (const [category, commands] of Object.entries(categories)) {
      const icon = getCategoryIcon(category);
      menu += `\n▣ ${icon} *${category.toUpperCase()}* ▣\n`;
      menu += commands.map(cmd => `  ↳ ${prefix}${cmd}`).join('\n');
      menu += `\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`;
    }

    menu += `\n\n╭──────────────────╮
│  🤖 *Prince K*  │
│  👑 *The Prince*  │
│  📢 *Chaîne* : https://whatsapp.com/channel/0029VbC8KUk2kNFp2Fb0bF3J │
╰──────────────────╯`;

    try {
      const device = getDevice(message.key.id);
      if (device === "android") {
        await client.sendMessage(remoteJid, {
          image: { url: "database/menu.jpg" },
          caption: stylizedChar(menu),
          contextInfo: {
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            quotedMessage: { conversation: "✨ Prince k ✨" },
            isForwarded: true
          }
        });
      } else {
        await client.sendMessage(remoteJid, {
          video: { url: "database/DigiX.mp3" },
          caption: stylizedChar(menu)
        }, { quoted: message });
      }
    } catch (err) {
      await client.sendMessage(remoteJid, {
        text: "❌ Erreur : " + err.message
      }, { quoted: message });
    }

    console.log(menu);
  } catch (err) {
    console.log("error:", err);
  }
}
