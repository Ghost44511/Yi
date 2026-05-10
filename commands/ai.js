import axios from "axios"

export default async function ai(client, message) {
    const chatId = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text

    if (!text) {
        return client.sendMessage(chatId, {
            text: "❌ Exemple: .ai salut"
        }, { quoted: message })
    }

    // 🔥 extraction directe (compatible ton handler)
    const query = text.split(' ').slice(1).join(' ')

    if (!query) {
        return client.sendMessage(chatId, {
            text: "❌ Mets un message après la commande"
        }, { quoted: message })
    }

    try {
        // ⚡ réaction instant
        await client.sendMessage(chatId, {
            react: { text: "⚡", key: message.key }
        })

        let answer = null

        // ✅ API rapide
        try {
            const res = await axios.get(
                `https://api.ryzendesu.vip/api/ai/gpt?text=${encodeURIComponent(query)}`,
                { timeout: 5000 }
            )

            answer = res.data?.result || res.data?.message

        } catch {}

        // ✅ fallback
        if (!answer) {
            try {
                const res = await axios.get(
                    `https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(query)}`,
                    { timeout: 5000 }
                )

                answer = res.data?.data || res.data?.result

            } catch {}
        }

        // ❌ si aucune API marche
        if (!answer) {
            answer = "❌ IA indisponible pour le moment"
        }

        // ✅ réponse
        await client.sendMessage(chatId, {
            text: `🤖 ${answer}`
        }, { quoted: message })

    } catch (err) {
        console.log(err)

        await client.sendMessage(chatId, {
            text: "❌ Erreur IA"
        }, { quoted: message })
    }
}