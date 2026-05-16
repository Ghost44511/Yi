export default async function owner(client, message) {
    const jid = message.key.remoteJid

    try {
        const ownerNumber = "237650554606" // ← mets ton numéro

        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Owner
ORG:Bot Owner;
TEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}
END:VCARD`

        await client.sendMessage(jid, {
            contacts: {
                displayName: "👑 Owner",
                contacts: [{ vcard }]
            }
        }, { quoted: message })

    } catch (e) {
        console.log("owner error:", e)

        await client.sendMessage(jid, {
            text: "❌ Erreur contact"
        }, { quoted: message })
    }
}