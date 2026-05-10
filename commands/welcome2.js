export default async function welcome(client, message) {
    const remoteJid = message.key.remoteJid
    const number = client.user.id.split(':')[0]
    const messageBody = message.message?.extendedTextMessage?.text || message.message?.conversation || ''
    const args = messageBody.split(' ').slice(1)
    
    try {
        // Vérifier si c'est un groupe
        if (!remoteJid.endsWith('@g.us')) {
            return sender(message, client, '❌ Cette commande est uniquement pour les groupes !')
        }

        // Initialiser la config si nécessaire
        if (!configmanager.config.users[number]) {
            configmanager.config.users[number] = {}
        }
        if (!configmanager.config.users[number].welcome) {
            configmanager.config.users[number].welcome = {}
        }
        if (!configmanager.config.users[number].welcome[remoteJid]) {
            configmanager.config.users[number].welcome[remoteJid] = {
                enabled: defaultWelcome.enabled,
                message: defaultWelcome.message,
                image: defaultWelcome.image
            }
        }

        const welcomeConfig = configmanager.config.users[number].welcome[remoteJid]

        // Si pas d'arguments, afficher le statut
        if (args.length === 0) {
            const status = welcomeConfig.enabled ? '✅ Activé' : '❌ Désactivé'
            const text = `╭─⌈ WELCOME CONFIG ⌋
│
│ Statut: ${status}
│ Message: ${welcomeConfig.message}
│
│ Commandes:
│ .welcome on/off
│ .welcome msg <texte>
│ .welcome img <url>
│ .welcome test
│
╰─⌊ GOLDEN-MD-V2 ⌉`
            
            return sender(message, client, text)
        }

        const subCommand = args[0].toLowerCase()

        // ACTIVER
        if (subCommand === 'on') {
            welcomeConfig.enabled = true
            configmanager.save()
            await bug(message, client, '✅ Welcome activé dans ce groupe !', 3)
            return
        }

        // DÉSACTIVER
        if (subCommand === 'off') {
            welcomeConfig.enabled = false
            configmanager.save()
            await bug(message, client, '❌ Welcome désactivé dans ce groupe !', 3)
            return
        }

        // CHANGER LE MESSAGE
        if (subCommand === 'msg') {
            const newMessage = args.slice(1).join(' ')
            if (!newMessage) {
                return sender(message, client, '❌ Utilisation: .welcome msg <texte> (utilise @user et @group)')
            }
            welcomeConfig.message = newMessage
            configmanager.save()
            await bug(message, client, '✅ Message de bienvenue mis à jour !', 3)
            return
        }

        // CHANGER L'IMAGE
        if (subCommand === 'img') {
            const imageUrl = args.slice(1).join(' ')
            if (!imageUrl || !imageUrl.match(/^https?:\/\//)) {
                return sender(message, client, '❌ Utilisation: .welcome img <url_image>')
            }
            welcomeConfig.image = imageUrl
            configmanager.save()
            await bug(message, client, '✅ Image de bienvenue mise à jour !', 3)
            return
        }

        // TESTER
        if (subCommand === 'test') {
            const testUser = message.key.participant || remoteJid
            await sendWelcomeMessage(client, remoteJid, testUser, true)
            return
        }

        // COMMANDE INCONNUE
        sender(message, client, '❌ Commande inconnue. Utilise .welcome sans arguments pour voir les options.')

    } catch (error) {
        console.error('Welcome error:', error)
        sender(message, client, '❌ Erreur lors de la configuration welcome')
    }
}

// Fonction pour envoyer le message de bienvenue
export async function sendWelcomeMessage(client, groupJid, newUserJid, isTest = false) {
    const number = client.user.id.split(':')[0]
    
    try {
        // Récupérer la config
        const welcomeConfig = configmanager.config.users[number]?.welcome?.[groupJid]
        
        // Vérifier si activé (sauf pour le test)
        if (!welcomeConfig || (!welcomeConfig.enabled && !isTest)) return

        // Récupérer les infos du groupe
        const groupMetadata = await client.groupMetadata(groupJid)
        const groupName = groupMetadata.subject
        const userName = newUserJid.split('@')[0]

        // Préparer le message
        let welcomeMessage = welcomeConfig.message || defaultWelcome.message
        welcomeMessage = welcomeMessage
            .replace(/@user/g, `@${userName}`)
            .replace(/@group/g, groupName)

        // Si c'est un test
        if (isTest) {
            welcomeMessage = `🧪 TEST WELCOME 🧪\n\n${welcomeMessage}`
        }

        // Envoyer avec image si disponible
        try {
            await client.sendMessage(groupJid, {
                image: { url: welcomeConfig.image || defaultWelcome.image },
                caption: `> _*${welcomeMessage}*_`,
                mentions: [newUserJid]
            })
        } catch {
            // Fallback sans image
            await client.sendMessage(groupJid, {
                text: `> _*${welcomeMessage}*_`,
                mentions: [newUserJid]
            })
        }

    } catch (error) {
        console.error('SendWelcome error:', error)
    }
}