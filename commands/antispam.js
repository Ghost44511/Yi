import configmanager from '../utils/configmanager.js'
import sender from './sender.js'
import bug from './bug.js'

// ════════════════════════════════════════
//  💠 ANTI-SPAM SYSTEM — GOLDEN-MD-V2
//  Auteur: Prince K
// ════════════════════════════════════════

// Stockage en mémoire des messages par user
const spamTracker = new Map()

// Configuration par défaut
const SPAM_CONFIG = {
    maxMessages: 7,          // Nb messages max dans la fenêtre de temps
    timeWindow: 6000,        // Fenêtre de temps en ms (6 secondes)
    warnBeforeBan: true,     // Avertir avant de ban
    blockOnSpam: true,       // Bloquer automatiquement
    reportToOwner: true,     // Envoyer rapport au owner
}

// ────────────────────────────────────────
//  Vérifier si un utilisateur spam
// ────────────────────────────────────────
export function detectSpam(senderJid) {
    const now = Date.now()

    if (!spamTracker.has(senderJid)) {
        spamTracker.set(senderJid, { count: 1, firstMessage: now, warned: false })
        return { isSpam: false }
    }

    const data = spamTracker.get(senderJid)
    const elapsed = now - data.firstMessage

    // Réinitialiser si fenêtre expirée
    if (elapsed > SPAM_CONFIG.timeWindow) {
        spamTracker.set(senderJid, { count: 1, firstMessage: now, warned: false })
        return { isSpam: false }
    }

    data.count++

    // Seuil d'avertissement (75% du max)
    const warnThreshold = Math.floor(SPAM_CONFIG.maxMessages * 0.75)

    if (data.count === warnThreshold && !data.warned) {
        data.warned = true
        return { isSpam: false, nearSpam: true, count: data.count }
    }

    if (data.count >= SPAM_CONFIG.maxMessages) {
        return { isSpam: true, count: data.count }
    }

    return { isSpam: false }
}

// ────────────────────────────────────────
//  Réinitialiser un utilisateur du tracker
// ────────────────────────────────────────
export function resetSpamTracker(senderJid) {
    spamTracker.delete(senderJid)
}

// ────────────────────────────────────────
//  Middleware principal anti-spam
//  À appeler dans messageHandler.js
// ────────────────────────────────────────
export async function antiSpamMiddleware(client, message) {
    const number = client.user.id.split(':')[0]
    const remoteJid = message.key.remoteJid
    const senderJid = message.key.participant || remoteJid

    // Ignorer les messages du bot lui-même et des groupes
    if (message.key.fromMe) return false
    if (!remoteJid.endsWith('@s.whatsapp.net')) return false // Pas en chat privé

    // Ignorer les sudoers et owner
    const sudoList = configmanager.config.users[number]?.sudoList || []
    if (sudoList.includes(senderJid)) return false

    const result = detectSpam(senderJid)
    const senderNumber = senderJid.split('@')[0]

    // ──── Pré-avertissement ────
    if (result.nearSpam) {
        await client.sendMessage(remoteJid, {
            text: `╭─⌈ ⚠️ ATTENTION ⌋\n│\n│ @${senderNumber} tu envoies\n│ des messages trop rapidement !\n│\n│ Continue et tu seras bloqué\n│ automatiquement. ⛔\n│\n╰─⌊ GOLDEN-MD-V2 ⌉`,
            mentions: [senderJid]
        })
        return false
    }

    // ──── SPAM DÉTECTÉ ────
    if (result.isSpam) {
        console.log(`🚫 SPAM détecté: ${senderNumber} (${result.count} msgs)`)

        // Bloquer l'utilisateur
        if (SPAM_CONFIG.blockOnSpam) {
            try {
                await client.updateBlockStatus(senderJid, 'block')
                console.log(`🔒 ${senderNumber} bloqué automatiquement`)
            } catch (e) {
                console.error('Erreur blocage auto:', e)
            }
        }

        // Notifier l'owner
        if (SPAM_CONFIG.reportToOwner) {
            await reportSpamToOwner(client, senderJid, result.count, number)
        }

        // Réinitialiser le tracker pour cet user
        resetSpamTracker(senderJid)

        return true // Message bloqué
    }

    return false // Message autorisé
}

// ────────────────────────────────────────
//  Envoyer un rapport de spam au owner
// ────────────────────────────────────────
async function reportSpamToOwner(client, spammerJid, count, ownerNumber) {
    const ownerJid = ownerNumber + '@s.whatsapp.net'
    const spammerNumber = spammerJid.split('@')[0]
    const now = new Date().toLocaleString('fr-FR')

    const reportMsg = `╔══════════════════╗\n` +
        `     🚨 *RAPPORT ANTI-SPAM* 🚨\n` +
        `╠══════════════════╣\n` +
        `│\n` +
        `│ 👤 *Spammeur:* +${spammerNumber}\n` +
        `│ 📱 *JID:* ${spammerJid}\n` +
        `│ 📨 *Messages envoyés:* ${count}\n` +
        `│ 🕒 *Détecté le:* ${now}\n` +
        `│ 🔒 *Action:* Bloqué automatiquement\n` +
        `│\n` +
        `╠══════════════════╣\n` +
        `│ Pour débloquer: *.unblock ${spammerNumber}*\n` +
        `│ Pour signaler: *.signaler ${spammerNumber}*\n` +
        `╚══════════════════╝`

    try {
        await client.sendMessage(ownerJid, { text: reportMsg })
        console.log('📩 Rapport envoyé au owner')
    } catch (e) {
        console.error('Erreur envoi rapport:', e)
    }
}

// ────────────────────────────────────────
//  Commande: .antispam on/off/status
// ────────────────────────────────────────
export default async function antispam(client, message) {
    const messageBody = message.message?.extendedTextMessage?.text || message.message?.conversation || ''
    const args = messageBody.trim().split(/\s+/).slice(1)
    const sub = (args[0] || '').toLowerCase()

    const help = `╭─⌈ 🛡️ ANTI-SPAM ⌋\n│\n│ Commandes:\n│ .antispam on     → Activer\n│ .antispam off    → Désactiver\n│ .antispam status → Voir config\n│ .antispam reset @user → Reset tracker\n│\n│ 🔧 Config actuelle:\n│ Max msgs: ${SPAM_CONFIG.maxMessages}\n│ Fenêtre: ${SPAM_CONFIG.timeWindow / 1000}s\n│ Block auto: ${SPAM_CONFIG.blockOnSpam ? '✅' : '❌'}\n│ Rapport owner: ${SPAM_CONFIG.reportToOwner ? '✅' : '❌'}\n│\n╰─⌊ GOLDEN-MD-V2 ⌉`

    switch (sub) {
        case 'on':
            SPAM_CONFIG.blockOnSpam = true
            SPAM_CONFIG.reportToOwner = true
            return sender(message, client, '✅ Anti-spam activé avec succès !')

        case 'off':
            SPAM_CONFIG.blockOnSpam = false
            return sender(message, client, '⚠️ Anti-spam désactivé.')

        case 'status':
            return sender(message, client, help)

        case 'reset': {
            const target = message.message?.extendedTextMessage?.contextInfo?.participant
                || (args[1] ? args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)
            if (!target) return sender(message, client, '❌ Mentionne un utilisateur !')
            resetSpamTracker(target)
            return sender(message, client, `✅ Tracker réinitialisé pour @${target.split('@')[0]}`)
        }

        default:
            return sender(message, client, help)
    }
}
