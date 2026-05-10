export default async function kick(client, message) {
    const remoteJid = message.key.remoteJid
    const senderId = message.key.participant || remoteJid

    try {
        // Vérifier groupe
        if (!remoteJid.endsWith('@g.us')) {
            return sender(message, client, '❌ Cette commande est uniquement pour les groupes !')
        }

        // Récupérer infos
        const metadata = await client.groupMetadata(remoteJid)
        const isAdmin = metadata.participants.find(p => p.id === senderId)?.admin
        const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'
        const isBotAdmin = metadata.participants.find(p => p.id === botId)?.admin

        // Vérifier permissions
        if (!isAdmin && !message.key.fromMe) {
            return sender(message, client, '❌ Seuls les admins peuvent kick !')
        }
        
        if (!isBotAdmin) {
            return sender(message, client, '❌ Le bot doit être admin pour kick !')
        }

        // Cible: mention, réponse, ou argument
        let target = message.message?.extendedTextMessage?.contextInfo?.participant
        
        if (!target) {
            const text = message.message?.extendedTextMessage?.text || message.message?.conversation || ''
            const mention = text.match(/@(\d+)/)
            if (mention) {
                target = mention[1] + '@s.whatsapp.net'
            }
        }

        if (!target) {
            return sender(message, client, '❌ Mentionne ou répond à quelqu\'un pour le kick !\nExemple: .kick @user')
        }

        // Vérifier qu'on ne kick pas le bot
        if (target === botId) {
            return sender(message, client, '❌ Je ne peux pas me kick moi-même !')
        }

        // Vérifier que la cible est dans le groupe
        const targetInGroup = metadata.participants.find(p => p.id === target)
        if (!targetInGroup) {
            return sender(message, client, '❌ Cette personne n\'est pas dans le groupe !')
        }

        // KICK PUISSANT avec plusieurs méthodes
        try {
            // Méthode 1: Officielle
            await client.groupParticipantsUpdate(remoteJid, [target], 'remove')
            
            // Méthode 2: Si la 1 échoue (force kick)
        } catch (e) {
            try {
                // Alternative: remove via update
                await client.groupParticipantsUpdate(remoteJid, [target], 'remove')
            } catch (e2) {
                throw new Error('Impossible de kick')
            }
        }

        // Message de confirmation avec style
        const targetName = target.split('@')[0]
        const adminName = senderId.split('@')[0]
        
        await client.sendMessage(remoteJid, {
            text: `> _*👢 @${targetName} a été expulsé par @${adminName}*_`,
            mentions: [target, senderId]
        })

        console.log(`✅ KICK: ${targetName} kicked by ${adminName}`)

    } catch (error) {
        console.error('Kick error:', error)
        sender(message, client, '❌ Erreur lors du kick')
    }
}