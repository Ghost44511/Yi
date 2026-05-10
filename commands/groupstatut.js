import sender from './sender.js'

export default async function groupstatut(client, message) {
    const remoteJid = message.key.remoteJid
    const senderId = message.key.participant || remoteJid
    const messageBody = message.message?.extendedTextMessage?.text || message.message?.conversation || ''
    const args = messageBody.split(' ').slice(1)
    const command = args[0]?.toLowerCase()

    try {
        // Vérifier si c'est un groupe
        if (!remoteJid.endsWith('@g.us')) {
            return sender(message, client, '❌ Cette commande est uniquement pour les groupes !')
        }

        // Récupérer les infos du groupe
        const metadata = await client.groupMetadata(remoteJid)
        const isAdmin = metadata.participants.find(p => p.id === senderId)?.admin
        const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'
        
        // ✅ CORRECTION ICI : Vérifier si le bot est admin
        const botParticipant = metadata.participants.find(p => p.id === botId)
        const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin'

        console.log('Bot ID:', botId)
        console.log('Bot admin?', isBotAdmin)
        console.log('Bot participant:', botParticipant)

        // Vérifier les permissions pour l'utilisateur
        if (!isAdmin && !message.key.fromMe) {
            return sender(message, client, '❌ Seuls les admins peuvent modifier le statut du groupe !')
        }

        // AFFICHER LE STATUT ACTUEL
        if (!command || command === 'view' || command === 'voir') {
            const groupStatus = `╭─⌈ 📊 STATUT DU GROUPE ⌋
│
│ 📛 *Nom:* ${metadata.subject}
│ 🆔 *ID:* ${metadata.id}
│ 👥 *Membres:* ${metadata.participants.length}
│ 👑 *Propriétaire:* @${metadata.owner?.split('@')[0] || 'Inconnu'}
│ 🤖 *Bot admin:* ${isBotAdmin ? '✅ Oui' : '❌ Non'}
│
│ 📝 *Description:*
│ ${metadata.desc || 'Aucune description'}
│
│ 🔧 *Commandes disponibles:*
│ ▸ .groupstatut name <nouveau nom>
│ ▸ .groupstatut desc <nouvelle description>
│ ▸ .groupstatut add <texte>
│ ▸ .groupstatut reset
│ ▸ .groupstatut clear
│
╰─⌊ GOLDEN-MD-V2 ⌉`

            return client.sendMessage(remoteJid, {
                text: groupStatus,
                mentions: metadata.owner ? [metadata.owner] : []
            }, { quoted: message })
        }

        // ⚠️ SIMPLE AVERTISSEMENT SI LE BOT N'EST PAS ADMIN (pas de blocage)
        if (!isBotAdmin && (command === 'name' || command === 'desc' || command === 'add' || command === 'reset' || command === 'clear')) {
            await client.sendMessage(remoteJid, {
                text: '⚠️ *Attention:* Le bot n\'est pas admin, les modifications pourraient échouer !\n\nTentative quand même...'
            }, { quoted: message })
        }

        // CHANGER LE NOM DU GROUPE
        if (command === 'name' || command === 'nom') {
            const newName = args.slice(1).join(' ')
            
            if (!newName) {
                return sender(message, client, '❌ Utilisation: .groupstatut name <nouveau nom>')
            }

            if (newName.length > 25) {
                return sender(message, client, '❌ Le nom ne doit pas dépasser 25 caractères !')
            }

            try {
                await client.groupUpdateSubject(remoteJid, newName)
                
                await client.sendMessage(remoteJid, {
                    text: `✅ *Nom du groupe changé avec succès !*\n\n📛 Nouveau nom: ${newName}`
                }, { quoted: message })
            } catch (e) {
                console.error('Erreur rename:', e)
                sender(message, client, '❌ Échec du changement de nom. Vérifie que le bot est admin !')
            }
            
            return
        }

        // CHANGER LA DESCRIPTION
        if (command === 'desc' || command === 'description') {
            const newDesc = args.slice(1).join(' ')
            
            if (!newDesc) {
                return sender(message, client, '❌ Utilisation: .groupstatut desc <nouvelle description>')
            }

            try {
                await client.groupUpdateDescription(remoteJid, newDesc)
                
                await client.sendMessage(remoteJid, {
                    text: `✅ *Description du groupe mise à jour !*\n\n📝 ${newDesc}`
                }, { quoted: message })
            } catch (e) {
                console.error('Erreur description:', e)
                sender(message, client, '❌ Échec de la modification. Vérifie que le bot est admin !')
            }
            
            return
        }

        // AJOUTER UNE DESCRIPTION (version courte)
        if (command === 'add' || command === 'ajouter') {
            const addDesc = args.slice(1).join(' ')
            
            if (!addDesc) {
                return sender(message, client, '❌ Utilisation: .groupstatut add <texte à ajouter>')
            }

            const currentDesc = metadata.desc || ''
            const newDesc = currentDesc ? `${currentDesc}\n\n${addDesc}` : addDesc

            try {
                await client.groupUpdateDescription(remoteJid, newDesc)
                
                await client.sendMessage(remoteJid, {
                    text: `✅ *Description mise à jour !*\n\n📝 ${newDesc}`
                }, { quoted: message })
            } catch (e) {
                console.error('Erreur add description:', e)
                sender(message, client, '❌ Échec de l\'ajout. Vérifie que le bot est admin !')
            }
            
            return
        }

        // RÉINITIALISER LA DESCRIPTION
        if (command === 'reset') {
            try {
                await client.groupUpdateDescription(remoteJid, '')
                
                await client.sendMessage(remoteJid, {
                    text: '🔄 *Description du groupe réinitialisée !*'
                }, { quoted: message })
            } catch (e) {
                console.error('Erreur reset:', e)
                sender(message, client, '❌ Échec de la réinitialisation. Vérifie que le bot est admin !')
            }
            
            return
        }

        // SUPPRIMER LE NOM (remet nom par défaut)
        if (command === 'clear' || command === 'effacer') {
            try {
                await client.groupUpdateSubject(remoteJid, 'Groupe WhatsApp')
                await client.groupUpdateDescription(remoteJid, '')
                
                await client.sendMessage(remoteJid, {
                    text: '🔄 *Statut du groupe réinitialisé !*'
                }, { quoted: message })
            } catch (e) {
                console.error('Erreur clear:', e)
                sender(message, client, '❌ Échec de la réinitialisation. Vérifie que le bot est admin !')
            }
            
            return
        }

        // AIDE
        if (command === 'help' || command === 'aide') {
            const help = `╭─⌈ 📚 AIDE GROUPSTATUT ⌋
│
│ *Commandes disponibles:*
│
│ ▸ .groupstatut
│    Afficher le statut actuel
│
│ ▸ .groupstatut name <texte>
│    Changer le nom du groupe
│
│ ▸ .groupstatut desc <texte>
│    Changer la description
│
│ ▸ .groupstatut add <texte>
│    Ajouter à la description
│
│ ▸ .groupstatut reset
│    Effacer la description
│
│ ▸ .groupstatut clear
│    Réinitialiser tout
│
│ *Exemples:*
│ .groupstatut name GOLDEN-MD
│ .groupstatut desc Bienvenue à tous !
│ .groupstatut add Règles: pas de spam
│
╰─⌊ GOLDEN-MD-V2 ⌉`

            return sender(message, client, help)
        }

        // Commande inconnue
        sender(message, client, '❌ Commande inconnue. Utilise .groupstatut help pour voir les options.')

    } catch (error) {
        console.error('Groupstatut error:', error)
        sender(message, client, '❌ Erreur lors de la modification du statut')
    }
}