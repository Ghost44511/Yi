import sender from '../commands/sender.js'

// ✅ CORRIGÉ: typo extendedTextMesssage → extendedTextMessage
// ✅ CORRIGÉ: bloque le bon target au lieu de remoteJid

function getTarget(message) {
    // Si c'est un message cité (reply)
    if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        return message.message.extendedTextMessage.contextInfo.participant
    }
    // Sinon via argument texte
    const messageBody = message.message?.extendedTextMessage?.text || message.message?.conversation || ''
    const args = messageBody.trim().split(/\s+/).slice(1)
    if (args[0]) {
        const num = args[0].replace(/[^0-9]/g, '')
        return num ? num + '@s.whatsapp.net' : null
    }
    return null
}

async function block(client, message) {
    try {
        const remoteJid = message.key.remoteJid
        const target = getTarget(message)

        if (!target) {
            return sender(message, client, '❌ Mentionne ou réponds à quelqu\'un !')
        }

        await client.updateBlockStatus(target, 'block')
        console.log('✅ Contact bloqué:', target)
        await sender(message, client, `✅ @${target.split('@')[0]} a été bloqué avec succès.`)

    } catch (e) {
        console.error('Block error:', e)
        sender(message, client, `❌ Erreur lors du blocage: ${e.message}`)
    }
}

async function unblock(client, message) {
    try {
        const target = getTarget(message)

        if (!target) {
            return sender(message, client, '❌ Mentionne ou réponds à quelqu\'un !')
        }

        await client.updateBlockStatus(target, 'unblock')
        console.log('✅ Contact débloqué:', target)
        await sender(message, client, `✅ @${target.split('@')[0]} a été débloqué avec succès.`)

    } catch (e) {
        console.error('Unblock error:', e)
        sender(message, client, `❌ Erreur lors du déblocage: ${e.message}`)
    }
}

export default { block, unblock }
