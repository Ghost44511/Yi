import configmanager from '../utils/configmanager.js'
import sender from './sender.js'
import bug from './bug.js'

// Structure des données de ban
const defaultBanData = {
    banned: false,
    reason: '',
    bannedBy: '',
    bannedAt: null,
    expiresAt: null
}

// Cache pour les performances
const banCache = new Map()

// Nettoyage du cache toutes les 30 minutes
setInterval(() => {
    banCache.clear()
    console.log('🧹 Cache ban nettoyé')
}, 30 * 60 * 1000)

// Fonction principale CHECKBAN
export default async function checkban(client, message) {
    const remoteJid = message.key.remoteJid
    const number = client.user.id.split(':')[0]
    const messageBody = message.message?.extendedTextMessage?.text || message.message?.conversation || ''
    const args = messageBody.split(' ').slice(1)

    try {
        // Initialiser la structure bans dans config
        if (!configmanager.config.users[number]) {
            configmanager.config.users[number] = {}
        }
        if (!configmanager.config.users[number].bans) {
            configmanager.config.users[number].bans = {}
        }

        const bans = configmanager.config.users[number].bans

        // Pas d'arguments → aide
        if (args.length === 0) {
            const help = `╭─⌈ 🚫 CHECK BAN ⌋
│
│ Commandes:
│ .checkban @user
│ .ban @user [raison]
│ .unban @user
│ .banlist
│ .baninfo @user
│ .tempban @user <jours> [raison]
│
│ Exemples:
│ .ban @user Spam
│ .tempban @user 7 Flood
│ .unban @user
│
╰─⌊ GOLDEN-MD-V2 ⌉`
            return sender(message, client, help)
        }

        const subCommand = args[0].toLowerCase()

        // CHECKBAN (vérifier si un utilisateur est banni)
        if (subCommand === 'checkban' || subCommand === 'check') {
            let target = getTargetUser(message, args[1])
            
            if (!target) {
                return sender(message, client, '❌ Mentionne ou répond à quelqu\'un !')
            }

            const userBan = bans[target] || defaultBanData
            const isBanned = isUserBanned(userBan)

            if (!isBanned) {
                return sender(message, client, `✅ @${target.split('@')[0]} n'est PAS banni !`)
            }

            // Afficher les détails du ban
            const banDate = new Date(userBan.bannedAt).toLocaleString()
            const expireDate = userBan.expiresAt ? new Date(userBan.expiresAt).toLocaleString() : 'Jamais'
            const reason = userBan.reason || 'Aucune raison'
            const banner = userBan.bannedBy ? `@${userBan.bannedBy.split('@')[0]}` : 'Inconnu'

            const banInfo = `╭─⌈ 🚫 UTILISATEUR BANNI ⌋
│
│ 👤 User: @${target.split('@')[0]}
│ 📝 Raison: ${reason}
│ 👮 Banni par: ${banner}
│ 📅 Date: ${banDate}
│ ⏰ Expire: ${expireDate}
│
╰─⌊ GOLDEN-MD-V2 ⌉`

            return client.sendMessage(remoteJid, {
                text: banInfo,
                mentions: [target, userBan.bannedBy].filter(Boolean)
            })
        }

        // BAN (bannir un utilisateur)
        if (subCommand === 'ban') {
            // Vérifier si l'utilisateur est admin/owner
            if (!await isAuthorized(client, message)) {
                return sender(message, client, '❌ Seuls les admins peuvent bannir !')
            }

            let target = getTargetUser(message, args[1])
            if (!target) {
                return sender(message, client, '❌ Mentionne qui bannir !')
            }

            // Empêcher de bannir le bot
            if (target === client.user.id) {
                return sender(message, client, '❌ Je ne peux pas me bannir moi-même !')
            }

            // Raison du ban
            const reason = args.slice(2).join(' ') || 'Aucune raison spécifiée'
            const banner = message.key.participant || remoteJid

            // Appliquer le ban
            bans[target] = {
                banned: true,
                reason: reason,
                bannedBy: banner,
                bannedAt: new Date().toISOString(),
                expiresAt: null
            }

            configmanager.save()
            banCache.delete(target)

            // Essayer de kick du groupe si présent
            try {
                if (remoteJid.endsWith('@g.us')) {
                    await client.groupParticipantsUpdate(remoteJid, [target], 'remove')
                }
            } catch (e) {}

            await bug(message, client, `✅ @${target.split('@')[0]} a été banni !\nRaison: ${reason}`, 3)
            return
        }

        // TEMPBAN (ban temporaire)
        if (subCommand === 'tempban') {
            if (!await isAuthorized(client, message)) {
                return sender(message, client, '❌ Seuls les admins peuvent bannir !')
            }

            let target = getTargetUser(message, args[1])
            if (!target) {
                return sender(message, client, '❌ Mentionne qui bannir !')
            }

            const days = parseInt(args[2])
            if (isNaN(days) || days < 1 || days > 365) {
                return sender(message, client, '❌ Spécifie un nombre de jours (1-365) !')
            }

            const reason = args.slice(3).join(' ') || 'Ban temporaire'
            const banner = message.key.participant || remoteJid

            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + days)

            bans[target] = {
                banned: true,
                reason: reason,
                bannedBy: banner,
                bannedAt: new Date().toISOString(),
                expiresAt: expiresAt.toISOString()
            }

            configmanager.save()
            banCache.delete(target)

            await bug(message, client, `✅ @${target.split('@')[0]} banni pour ${days} jours !\nRaison: ${reason}`, 3)
            return
        }

        // UNBAN (débannir)
        if (subCommand === 'unban') {
            if (!await isAuthorized(client, message)) {
                return sender(message, client, '❌ Seuls les admins peuvent débannir !')
            }

            let target = getTargetUser(message, args[1])
            if (!target) {
                return sender(message, client, '❌ Mentionne qui débannir !')
            }

            if (!bans[target] || !bans[target].banned) {
                return sender(message, client, `✅ @${target.split('@')[0]} n'est pas banni !`)
            }

            delete bans[target]
            configmanager.save()
            banCache.delete(target)

            await bug(message, client, `✅ @${target.split('@')[0]} a été débanni !`, 3)
            return
        }

        // BANLIST (liste des bannis)
        if (subCommand === 'banlist') {
            const bannedUsers = Object.entries(bans)
                .filter(([_, data]) => isUserBanned(data))
                .map(([user, data]) => {
                    const expires = data.expiresAt ? 
                        ` (expire ${new Date(data.expiresAt).toLocaleDateString()})` : ''
                    return `▸ @${user.split('@')[0]}${expires}`
                })

            if (bannedUsers.length === 0) {
                return sender(message, client, '✅ Aucun utilisateur banni !')
            }

            const list = `╭─⌈ 📋 LISTE DES BANNIS ⌋
│
${bannedUsers.join('\n')}
│
╰─⌊ Total: ${bannedUsers.length} ⌉`

            return client.sendMessage(remoteJid, {
                text: list,
                mentions: bannedUsers.map(u => u.split('@')[1] + '@s.whatsapp.net')
            })
        }

        // BANINFO (infos détaillées sur un ban)
        if (subCommand === 'baninfo') {
            let target = getTargetUser(message, args[1])
            if (!target) {
                return sender(message, client, '❌ Mentionne un utilisateur !')
            }

            const userBan = bans[target]
            if (!userBan || !userBan.banned) {
                return sender(message, client, `✅ @${target.split('@')[0]} n'est pas banni !`)
            }

            const info = formatBanInfo(userBan, target)
            return client.sendMessage(remoteJid, {
                text: info,
                mentions: [target, userBan.bannedBy].filter(Boolean)
            })
        }

        sender(message, client, '❌ Commande inconnue. Utilise .checkban pour voir les options.')

    } catch (error) {
        console.error('Checkban error:', error)
        sender(message, client, '❌ Erreur lors de l\'exécution')
    }
}

// FONCTIONS UTILITAIRES

// Récupérer l'utilisateur cible (mention ou réponse)
function getTargetUser(message, arg) {
    // Réponse à un message
    if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        return message.message.extendedTextMessage.contextInfo.participant
    }
    
    // Mention
    if (arg && arg.includes('@')) {
        const mention = arg.match(/@(\d+)/)
        if (mention) {
            return mention[1] + '@s.whatsapp.net'
        }
    }
    
    // Numéro direct
    if (arg && /^\d+$/.test(arg)) {
        return arg + '@s.whatsapp.net'
    }
    
    return null
}

// Vérifier si l'utilisateur est autorisé (admin ou owner)
async function isAuthorized(client, message) {
    const remoteJid = message.key.remoteJid
    const senderId = message.key.participant || remoteJid
    
    // Owner (fromMe)
    if (message.key.fromMe) return true
    
    // Admin de groupe
    if (remoteJid.endsWith('@g.us')) {
        try {
            const metadata = await client.groupMetadata(remoteJid)
            return metadata.participants.find(p => p.id === senderId)?.admin ? true : false
        } catch {
            return false
        }
    }
    
    return false
}

// Vérifier si un utilisateur est banni (avec gestion expiration)
export function isUserBanned(banData) {
    if (!banData || !banData.banned) return false
    
    // Vérifier expiration
    if (banData.expiresAt) {
        const expireDate = new Date(banData.expiresAt)
        if (expireDate < new Date()) {
            banData.banned = false // Auto-expire
            return false
        }
    }
    
    return true
}

// Formater les infos de ban
function formatBanInfo(banData, userId) {
    const banDate = new Date(banData.bannedAt).toLocaleString()
    const expireDate = banData.expiresAt ? 
        new Date(banData.expiresAt).toLocaleString() : 'Permanent'
    const remaining = banData.expiresAt ? 
        getRemainingTime(banData.expiresAt) : 'Illimité'

    return `╭─⌈ 📝 INFORMATIONS DE BAN ⌋
│
│ 👤 Utilisateur: @${userId.split('@')[0]}
│ 📅 Date du ban: ${banDate}
│ ⏰ Expiration: ${expireDate}
│ ⏳ Temps restant: ${remaining}
│ 📝 Raison: ${banData.reason || 'Aucune'}
│ 👮 Banni par: @${banData.bannedBy?.split('@')[0] || 'Inconnu'}
│
╰─⌊ GOLDEN-MD-V2 ⌉`
}

// Calculer le temps restant
function getRemainingTime(expireDate) {
    const now = new Date()
    const expire = new Date(expireDate)
    const diff = expire - now
    
    if (diff <= 0) return 'Expiré'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    return `${days}j ${hours}h`
}

// FILTRE GLOBAL POUR BLOQUER LES BANNIS
export async function banFilter(client, message) {
    const remoteJid = message.key.remoteJid
    const senderId = message.key.participant || remoteJid
    const number = client.user.id.split(':')[0]
    
    // Ne pas filtrer les messages du bot
    if (senderId === client.user.id) return true
    
    try {
        const bans = configmanager.config.users[number]?.bans || {}
        const userBan = bans[senderId]
        
        // Vérifier si banni
        if (userBan && isUserBanned(userBan)) {
            console.log(`🚫 Message bloqué de @${senderId.split('@')[0]} (banni)`)
            
            // Optionnel: répondre à l'utilisateur banni
            if (remoteJid.endsWith('@g.us')) {
                await client.sendMessage(remoteJid, {
                    delete: message.key
                }).catch(() => {})
            }
            
            return false // Message bloqué
        }
        
        return true // Message autorisé
        
    } catch (error) {
        console.error('Ban filter error:', error)
        return true // En cas d'erreur, autoriser par sécurité
    }
}
// ✅ WRAPPERS EXPORTÉS pour les sous-commandes ban/unban/tempban/banlist/baninfo
// Injectent la sous-commande dans le message puis appellent checkban()

function injectSubCommand(message, subCmd) {
    const original = message.message?.extendedTextMessage?.text || message.message?.conversation || ''
    const prefix = original.startsWith('.') ? original[0] : '.'
    // Créer une copie du message avec la sous-commande injectée
    const clone = JSON.parse(JSON.stringify(message))
    const rest = original.split(/\s+/).slice(1).join(' ')
    const newText = `${prefix}checkban ${subCmd}${rest ? ' ' + rest : ''}`
    if (clone.message?.extendedTextMessage) {
        clone.message.extendedTextMessage.text = newText
    } else if (clone.message?.conversation) {
        clone.message.conversation = newText
    }
    return clone
}

export async function ban(client, message) {
    return checkban(client, injectSubCommand(message, 'ban'))
}

export async function unban(client, message) {
    return checkban(client, injectSubCommand(message, 'unban'))
}

export async function tempban(client, message) {
    return checkban(client, injectSubCommand(message, 'tempban'))
}

export async function banlist(client, message) {
    return checkban(client, injectSubCommand(message, 'banlist'))
}

export async function baninfo(client, message) {
    return checkban(client, injectSubCommand(message, 'baninfo'))
}
