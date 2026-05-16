import configmanager from '../utils/configmanager.js'

const antilinkSettings = {}
const warnStorage = {}

const isAdmin = (participant) => {
    return participant?.admin === "admin" || participant?.admin === "superadmin"
}

const getText = (message) => {
    return message.message?.conversation || message.message?.extendedTextMessage?.text || ''
}

const getSender = (message) => {
    return message.key.participant || message.key.remoteJid
}

export async function antilink(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.endsWith('@g.us')) return
    
    try {
        const metadata = await client.groupMetadata(groupId)
        const senderId = getSender(message)
        const sender = metadata.participants.find(p => p.id === senderId)
        
        if (!isAdmin(sender)) {
            return client.sendMessage(groupId, { text: '🔒 Admins seulement' })
        }

        const args = getText(message).split(/\s+/).slice(1)
        const action = args[0]?.toLowerCase()

        if (!action) {
            return client.sendMessage(groupId, {
                text: `.antilink on/off/set/status`
            })
        }

        if (action === 'on') {
            antilinkSettings[groupId] = { enabled: true, action: 'delete' }
            return client.sendMessage(groupId, { text: '✅ Antilink activé' })
        }

        if (action === 'off') {
            delete antilinkSettings[groupId]
            return client.sendMessage(groupId, { text: '❌ Antilink désactivé' })
        }

        if (action === 'set') {
            const type = args[1]
            if (!['delete','kick','warn'].includes(type)) {
                return client.sendMessage(groupId, { text: '❌ delete | kick | warn' })
            }

            if (!antilinkSettings[groupId]) {
                antilinkSettings[groupId] = { enabled: true }
            }

            antilinkSettings[groupId].action = type
            return client.sendMessage(groupId, { text: `✅ Action: ${type}` })
        }

        if (action === 'status') {
            const s = antilinkSettings[groupId]
            return client.sendMessage(groupId, {
                text: `📊 Activé: ${s?.enabled ? 'oui' : 'non'}\nAction: ${s?.action || 'aucune'}`
            })
        }

    } catch (e) {
        console.log("antilink error:", e)
    }
}

export async function linkDetection(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.endsWith('@g.us')) return

    const setting = antilinkSettings[groupId]
    if (!setting?.enabled) return

    const senderId = getSender(message)
    const text = getText(message)

    const linkRegex = /(https?:\/\/|www\.|\.com|\.net|\.org|t\.me|wa\.me|chat\.whatsapp\.com)/i
    if (!linkRegex.test(text)) return

    try {
        const metadata = await client.groupMetadata(groupId)
        const sender = metadata.participants.find(p => p.id === senderId)
        const bot = metadata.participants.find(p => p.id === client.user.id)

        if (isAdmin(sender)) return
        if (!isAdmin(bot)) return

        // DELETE
        try {
            await client.sendMessage(groupId, { delete: message.key })
        } catch {}

        // WARN SYSTEM
        if (setting.action === 'warn') {
            const key = `${groupId}_${senderId}`
            warnStorage[key] = (warnStorage[key] || 0) + 1

            const warns = warnStorage[key]

            await client.sendMessage(groupId, {
                text: `⚠️ @${senderId.split('@')[0]} Warn ${warns}/3`,
                mentions: [senderId]
            })

            if (warns >= 3) {
                await client.groupParticipantsUpdate(groupId, [senderId], 'remove')
                delete warnStorage[key]
            }
        }

        // KICK DIRECT
        if (setting.action === 'kick') {
            await client.groupParticipantsUpdate(groupId, [senderId], 'remove')
        }

    } catch (e) {
        console.log("link detect error:", e)
    }
}

export async function kick(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.endsWith('@g.us')) return

    try {
        const metadata = await client.groupMetadata(groupId)
        const sender = metadata.participants.find(p => p.id === getSender(message))

        if (!isAdmin(sender)) {
            return client.sendMessage(groupId, { text: "❌ Admin seulement" })
        }

        let target = message.message?.extendedTextMessage?.contextInfo?.participant

        if (!target) {
            return client.sendMessage(groupId, { text: "❌ Mentionne quelqu'un" })
        }

        await client.groupParticipantsUpdate(groupId, [target], 'remove')

        await client.sendMessage(groupId, {
            text: `🚫 @${target.split('@')[0]} exclu`,
            mentions: [target]
        })

    } catch {
        client.sendMessage(groupId, { text: "❌ erreur" })
    }
}

export async function promote(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.endsWith('@g.us')) return

    try {
        const target = message.message?.extendedTextMessage?.contextInfo?.participant
        if (!target) return

        await client.groupParticipantsUpdate(groupId, [target], 'promote')

        await client.sendMessage(groupId, {
            text: `👑 @${target.split('@')[0]} admin`,
            mentions: [target]
        })

    } catch {
        client.sendMessage(groupId, { text: "❌ erreur" })
    }
}

export async function demote(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.endsWith('@g.us')) return

    try {
        const target = message.message?.extendedTextMessage?.contextInfo?.participant
        if (!target) return

        await client.groupParticipantsUpdate(groupId, [target], 'demote')

        await client.sendMessage(groupId, {
            text: `📉 @${target.split('@')[0]} retiré admin`,
            mentions: [target]
        })

    } catch {
        client.sendMessage(groupId, { text: "❌ erreur" })
    }
}

export async function gclink(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.endsWith('@g.us')) return

    try {
        const code = await client.groupInviteCode(groupId)

        await client.sendMessage(groupId, {
            text: `https://chat.whatsapp.com/${code}`
        })

    } catch {
        client.sendMessage(groupId, { text: "❌ erreur" })
    }
}

export default {
    antilink,
    linkDetection,
    kick,
    promote,
    demote,
    gclink
          }
