import axios from 'axios'
import stylizedChar from '../utils/fancy.js'

const quotes = [
    { text: "La vie est un mystère qu'il faut vivre, et non un problème à résoudre.", author: "Gandhi" },
    { text: "Le succès n'est pas la clé du bonheur. Le bonheur est la clé du succès.", author: "Albert Schweitzer" },
    { text: "Le courage n'est pas l'absence de peur, mais la capacité de vaincre ce qui fait peur.", author: "Nelson Mandela" },
    { text: "Le savoir est la seule matière qui s'accroît quand on la partage.", author: "Socrate" },
    { text: "Vis comme si tu devais mourir demain. Apprends comme si tu devais vivre toujours.", author: "Gandhi" }
]

export default async function quote(client, message) {
    const remoteJid = message.key.remoteJid

    try {
        // Essayer API en ligne d'abord
        let quote = null
        try {
            const res = await axios.get('https://api.quotable.io/random')
            quote = {
                text: res.data.content,
                author: res.data.author
            }
        } catch {
            // Fallback sur citations locales
            quote = quotes[Math.floor(Math.random() * quotes.length)]
        }

        await client.sendMessage(remoteJid, {
            text: stylizedChar(`💭 *Citation du jour*\n\n"${quote.text}"\n\n— ${quote.author}`)
        }, { quoted: message })

    } catch (error) {
        console.error('Quote error:', error)
        await client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Erreur récupération citation')
        }, { quoted: message })
    }
}