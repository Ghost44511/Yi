import sender from './sender.js'
import configmanager from '../utils/configmanager.js'

// ════════════════════════════════════════
//  🚨 SYSTÈME DE SIGNALEMENT — GOLDEN-MD-V2
//  Auteur: Prince K
// ════════════════════════════════════════

// Historique des signalements en mémoire
const reportsLog = new Map()

// ────────────────────────────────────────
//  Enregistrer un signalement
// ────────────────────────────────────────
function logReport(targetJid, reason, reportedBy) {
    const existing = reportsLog.get(targetJid) || []
    existing.push({
        reason,
        reportedBy,
        date: new Date().toISOString()
    })
    reportsLog.set(targetJid, existing)
}

// ────────────────────────────────────────
//  Commande principale .signaler
// ────────────────────────────────────────
export default async function signaler(client, message) {
    const number = client.user.id.split(':')[0]
    const ownerJid = number + '@s.whatsapp.net'
    const messageBody = message.message?.extendedTextMessage?.text || message.message?.conversation || ''
    const args = messageBody.trim().split(/\s+/).slice(1)
    const remoteJid = message.key.remoteJid

    // ──── Déterminer la cible ────
    let targetJid = null

    // Via reply (message cité)
    if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        targetJid = message.message.extendedTextMessage.contextInfo.participant
    }
    // Via @mention
    else if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0]
    }
    // Via numéro en argument
    else if (args[0]) {
        const num = args[0].replace(/[^0-9]/g, '')
        if (num.length >= 8) targetJid = num + '@s.whatsapp.net'
    }

    if (!targetJid) {
        const help = `╭─⌈ 🚨 SIGNALEMENT ⌋\n` +
            `│\n` +
            `│ Usage:\n` +
            `│ • Réponds à un msg + .signaler [raison]\n` +
            `│ • .signaler @user [raison]\n` +
            `│ • .signaler numéro [raison]\n` +
            `│\n` +
            `│ Exemples:\n` +
            `│ .signaler 237XXXXXXX spam\n` +
            `│ .signaler @user harcèlement\n` +
            `│\n` +
            `│ Sous-commandes:\n` +
            `│ .signaler liste → Voir tous les signalements\n` +
            `│ .signaler effacer @user → Effacer les signalements\n` +
            `│\n` +
            `╰─⌊ GOLDEN-MD-V2 ⌉`
        return sender(message, client, help)
    }

    // ──── Sous-commande: liste ────
    if (args[0] === 'liste') {
        if (reportsLog.size === 0) {
            return sender(message, client, '✅ Aucun signalement enregistré.')
        }

        let list = `╭─⌈ 📋 LISTE DES SIGNALEMENTS ⌋\n│\n`
        reportsLog.forEach((reports, jid) => {
            list += `│ 👤 +${jid.split('@')[0]}\n`
            list += `│ 📨 ${reports.length} signalement(s)\n│\n`
        })
        list += `╰─⌊ GOLDEN-MD-V2 ⌉`
        return sender(message, client, list)
    }

    // ──── Sous-commande: effacer ────
    if (args[0] === 'effacer') {
        const clearTarget = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
            || (args[1] ? args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)
        if (clearTarget && reportsLog.has(clearTarget)) {
            reportsLog.delete(clearTarget)
            return sender(message, client, `✅ Signalements de @${clearTarget.split('@')[0]} effacés.`)
        }
        return sender(message, client, '❌ Aucun signalement trouvé pour cet utilisateur.')
    }

    // ──── Raison du signalement ────
    const isTargetInArgs = targetJid && args[0] && !args[0].includes(targetJid.split('@')[0])
    const reasonStartIndex = isTargetInArgs ? 1 : 1
    const reason = args.slice(reasonStartIndex).join(' ') || 'Aucune raison spécifiée'
    const reporterJid = message.key.participant || message.key.remoteJid
    const targetNumber = targetJid.split('@')[0]

    // ──── Enregistrer le signalement ────
    logReport(targetJid, reason, reporterJid)

    const now = new Date().toLocaleString('fr-FR')
    const totalReports = (reportsLog.get(targetJid) || []).length

    // ──── Message de confirmation au signalant ────
    const confirmMsg = `╭─⌈ ✅ SIGNALEMENT ENVOYÉ ⌋\n` +
        `│\n` +
        `│ 🎯 Cible: +${targetNumber}\n` +
        `│ 📝 Raison: ${reason}\n` +
        `│ 🕒 Date: ${now}\n` +
        `│ 📊 Total signalements: ${totalReports}\n` +
        `│\n` +
        `│ Le rapport a été transmis\n` +
        `│ au propriétaire du bot. 📩\n` +
        `│\n` +
        `╰─⌊ GOLDEN-MD-V2 ⌉`

    await sender(message, client, confirmMsg)

    // ──── Rapport complet au owner ────
    const ownerReport = `╔══════════════════╗\n` +
        `     🚨 *NOUVEAU SIGNALEMENT* 🚨\n` +
        `╠══════════════════╣\n` +
        `│\n` +
        `│ 🎯 *Signalé:* +${targetNumber}\n` +
        `│ 📱 *JID:* ${targetJid}\n` +
        `│ 📝 *Raison:* ${reason}\n` +
        `│ 👤 *Signalé par:* +${reporterJid.split('@')[0]}\n` +
        `│ 🕒 *Date:* ${now}\n` +
        `│ 📊 *Total signalements:* ${totalReports}\n` +
        `│\n` +
        `╠══════════════════╣\n` +
        `│ 🔧 *Actions disponibles:*\n` +
        `│ • *.block ${targetNumber}* → Bloquer\n` +
        `│ • *.ban @user ${reason}* → Bannir du bot\n` +
        `│\n` +
        `╚══════════════════╝`

    try {
        await client.sendMessage(ownerJid, {
            text: ownerReport,
            mentions: [targetJid, reporterJid]
        })
        console.log(`📩 Signalement transmis: +${targetNumber} par +${reporterJid.split('@')[0]}`)
    } catch (e) {
        console.error('Erreur envoi rapport owner:', e)
    }
}
