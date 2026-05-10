export default async function mute(client, message) {
    const jid = message.key.remoteJid
    const sender = message.key.participant || jid

    try {
        if (!jid.endsWith("@g.us")) {
            return client.sendMessage(jid, {
                text: "❌ Groupe uniquement"
            }, { quoted: message })
        }

        const metadata = await client.groupMetadata(jid)
        const admins = metadata.participants.filter(p => p.admin)

        const isAdmin = admins.some(p => p.id === sender)

        if (!isAdmin) {
            return client.sendMessage(jid, {
                text: "❌ Tu dois être admin"
            }, { quoted: message })
        }

        await client.groupSettingUpdate(jid, "announcement")

        await client.sendMessage(jid, {
            text: "🔇 Groupe fermé avec succès"
        }, { quoted: message })

    } catch (e) {
        console.log(e)

        client.sendMessage(jid, {
            text: "❌ Le bot doit être admin"
        }, { quoted: message })
    }
}