import axios from "axios"

export default async function save(client, message) {
    const jid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ""

    const query = text.split(" ").slice(1).join(" ")

    if (!query) {
        return client.sendMessage(jid, {
            text: "❌ Exemple: .save calm down"
        }, { quoted: message })
    }

    try {
        // ⚡ réaction
        await client.sendMessage(jid, {
            react: { text: "⏳", key: message.key }
        })

        // 🔍 étape 1 : recherche YouTube
        const search = await axios.get(
            `https://api.siputzx.my.id/api/search/youtube?query=${encodeURIComponent(query)}`
        )

        const video = search.data?.data?.[0]

        if (!video) {
            throw new Error("Aucun résultat")
        }

        // 🎧 étape 2 : convertir en mp3
        const convert = await axios.get(
            `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(video.url)}`
        )

        const audioUrl = convert.data?.data?.dl

        if (!audioUrl) {
            throw new Error("Conversion failed")
        }

        // 🖼️ preview
        await client.sendMessage(jid, {
            image: { url: video.thumbnail },
            caption: `🎧 ${video.title}\n⏳ Envoi du fichier...`
        }, { quoted: message })

        // 🎵 envoi audio
        await client.sendMessage(jid, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg"
        }, { quoted: message })

    } catch (err) {
        console.log("SAVE ERROR:", err)

        await client.sendMessage(jid, {
            text: "❌ Impossible de télécharger.\nRéessaie avec un autre titre."
        }, { quoted: message })
    }
}