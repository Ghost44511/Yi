import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import configs from "../utils/configmanager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

// ─────────────────────────────────────────────────────
//  TOUTES LES COMMANDES CLASSÉES PAR CATÉGORIE
// ─────────────────────────────────────────────────────
const MENU_CATEGORIES = {
  "🤖 IA / GPT": ["ai", "gpt", "gpt2", "gemini", "redige", "code", "traduis", "resume", "histoire", "idee", "analyse", "calcul", "lyricsai", "sante", "recette", "debat"],
  "🎬 MÉDIAS": ["play", "tiktok", "img", "photo", "toaudio", "sticker", "vv", "url"],
  "👥 GROUPE": [
    "tag", "tagall", "tagadmin",
    "kick", "kick2", "kickall", "kickall2",
    "promote", "demote", "promoteall", "demoteall",
    "mute", "unmute", "mute2", "unmute2",
    "gclink", "antilink", "welcome", "welcome2",
    "join", "bye", "groupstatut", "poll",
  ],
  "🛡️ MODÉRATION": [
    "antispam", "signaler",
    "ban", "unban", "tempban", "banlist", "baninfo", "checkban",
    "block", "unblock",
  ],
  "⚡ UTILITAIRES": [
    "ping", "uptime", "menu", "owner",
    "fancy", "chr", "insult", "weather",
    "google", "quote", "save", "save2",
    "reactions", "react", "test",
  ],
  "🔧 PARAMÈTRES": [
    "setprefix", "public", "autotype",
    "autorecord", "setpp", "getpp", "set",
  ],
  "👑 OWNER / SUDO": [
    "sudo", "delsudo", "addprem", "delprem",
    "close", "auto-promote", "auto-demote",
    "auto-left", "sender",
  ],
};

export default async function info(client, message) {
  try {
    const remoteJid = message.key.remoteJid;
    const userName = message.pushName || "Prince K";

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

    let totalCmds = 0;
    for (const cmds of Object.values(MENU_CATEGORIES)) totalCmds += cmds.length;

    let menu = `╔══════════════════════╗
║  ✨  *GOLDEN-MD-V2*  ✨  ║
╚══════════════════════╝

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      📊 *INFORMATIONS*
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
➣ *Préfixe*   : 「 ${prefix} 」
➣ *User*      : ${userName}
➣ *Version*   : 2.0.0
➣ *Uptime*    : ${uptime}
➣ *RAM*       : ${usedRam}/${totalRam} MB
➣ *Système*   : ${platform}
➣ *Date*      : ${date} (${day})
➣ *Commandes* : ${totalCmds} disponibles
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;

    for (const [category, commands] of Object.entries(MENU_CATEGORIES)) {
      menu += `\n┌─ ${category}\n`;
      menu += commands.map(cmd => `│  ↳ ${prefix}${cmd}`).join("\n");
      menu += `\n└────────────────────`;
    }

    menu += `\n\n╔══════════════════════╗
║  👑 *Prince K*            ║
║  📢 Canal :               ║
║  https://whatsapp.com/channel/0029VbC8KUk2kNFp2Fb0bF3J ║
╚══════════════════════╝`;

    // ─── Envoi sécurisé ───
    const menuImagePath = path.join(__dirname, "../database/menu.jpg");
    const imageExists = fs.existsSync(menuImagePath);

    try {
      if (imageExists) {
        await client.sendMessage(
          remoteJid,
          {
            image: fs.readFileSync(menuImagePath),
            caption: menu,
            mimetype: "image/jpeg",
          },
          { quoted: message }
        );
      } else {
        await client.sendMessage(remoteJid, { text: menu }, { quoted: message });
      }
    } catch (sendErr) {
      console.error("[MENU] Erreur envoi image, fallback texte :", sendErr.message);
      try {
        await client.sendMessage(remoteJid, { text: menu }, { quoted: message });
      } catch (fallbackErr) {
        console.error("[MENU] Fallback aussi échoué :", fallbackErr.message);
      }
    }

  } catch (err) {
    console.error("[MENU] Erreur générale :", err);
  }
}
