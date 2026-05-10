export default async function unmute(client, message) {
    const jid = message.key.remoteJid
    const sender = message.key.participant || jid

    try {
        // 🔍 Vérifie groupe
        if (!jid.endsWith("@g.us")) {
            return await client.sendMessage(jid, {
                text: "❌ Cette commande est seulement pour les groupes"
            }, { quoted: message })
        }

        // 🔍 Récupérer admins
        const metadata = await client.groupMetadata(jid)
        const admins = metadata.participants.filter(p => p.admin)

        const isAdmin = admins.some(p => p.id === sender)

        if (!isAdmin) {
            return await client.sendMessage(jid, {
                text: "❌ Tu dois être admin"
            }, { quoted: message })
        }

        // 🔓 Ouvrir le groupe
        await client.groupSettingUpdate(jid, "not_announcement")

        await client.sendMessage(jid, {
            text: "🔓 Groupe ouvert (tout le monde peut écrire)"
        }, { quoted: message })

    } catch (e) {
        console.log("unmute error:", e)

        await client.sendMessage(jid, {
            text: "❌ Erreur. Vérifie que le bot est admin."
        }, { quoted: message })
    }
}