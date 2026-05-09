const fs = require('fs');

/**
 * Commande Freeze - Permet de restreindre un utilisateur
 * @param {Object} conn - La connexion Baileys
 * @param {Object} m - Le message reçu
 * @param {Array} args - Les arguments (ex: le numéro de la cible)
 * @param {Boolean} isCreator - Si l'expéditeur est le propriétaire du bot
 */
async function freezeCommand(conn, m, args, isCreator) {
    const freezeDb = './freeze_db.json';

    // 1. Vérification des droits (Seul le propriétaire peut freeze)
    if (!isCreator) {
        return m.reply("❌ Cette commande est réservée à Prince K.");
    }

    // 2. Identification de la cible
    let target = m.quoted ? m.quoted.sender : args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null;

    if (!target) {
        return m.reply("⚠️ Veuillez mentionner un utilisateur ou citer son message pour le freezer.");
    }

    // 3. Chargement de la base de données
    if (!fs.existsSync(freezeDb)) {
        fs.writeFileSync(freezeDb, JSON.stringify([]));
    }
    let frozenUsers = JSON.parse(fs.readFileSync(freezeDb));

    // 4. Logique Toggle (Freeze / Unfreeze)
    if (frozenUsers.includes(target)) {
        // Unfreeze
        frozenUsers = frozenUsers.filter(u => u !== target);
        fs.writeFileSync(freezeDb, JSON.stringify(frozenUsers));
        await conn.sendMessage(m.chat, { text: `✅ L'utilisateur @${target.split('@')[0]} a été libéré.`, mentions: [target] });
    } else {
        // Freeze
        frozenUsers.push(target);
        fs.writeFileSync(freezeDb, JSON.stringify(frozenUsers));
        await conn.sendMessage(m.chat, { text: `❄️ L'utilisateur @${target.split('@')[0]} est maintenant figé (Freeze).`, mentions: [target] });
    }
}

module.exports = { freezeCommand };
