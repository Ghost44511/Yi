import axios from 'axios'
import stylizedChar from '../utils/fancy.js'

export default async function google(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const query = text.split(' ').slice(1).join(' ')

    if (!query) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Exemple: .google comment faire un bot whatsapp')
        }, { quoted: message })
    }

    await client.sendMessage(remoteJid, {
        react: { text: "🔍", key: message.key }
    })

    try {
        let results = null
        let error = null

        // ESSAI AVEC POPCAT (gratuit)
        try {
            const response = await axios.get(`https://api.popcat.xyz/google?q=${encodeURIComponent(query)}`, {
                timeout: 5000
            })
            if (response.data?.results) {
                results = response.data.results
            }
        } catch (e) {
            error = e
            console.log('Popcat failed, trying alternative...')
        }

        // SI POPCAT ÉCHOUE, ESSAYER DUCKDUCKGO
        if (!results) {
            try {
                const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&pretty=1`, {
                    timeout: 5000
                })
                
                if (response.data?.AbstractText) {
                    results = [{
                        title: response.data.Heading || 'Résultat',
                        description: response.data.AbstractText,
                        url: response.data.AbstractURL || 'https://duckduckgo.com'
                    }]
                }
            } catch (e) {
                console.log('DuckDuckGo also failed')
            }
        }

        // SI TOUT ÉCHOUE, ESSAYER UNE API DE SECOURS
        if (!results) {
            try {
                const response = await axios.get(`https://archive.org/wayback/available?url=${encodeURIComponent(query)}`, {
                    timeout: 5000
                })
                // Fallback créatif
                results = [{
                    title: `Recherche: ${query}`,
                    description: 'Utilise Google directement pour plus de résultats',
                    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
                }]
            } catch (e) {}
        }

        if (!results || results.length === 0) {
            return client.sendMessage(remoteJid, {
                text: stylizedChar('❌ Aucun résultat trouvé')
            }, { quoted: message })
        }

        let resultText = `🔍 *Résultats pour :* ${query}\n\n`
        
        results.slice(0, 5).forEach((res, i) => {
            resultText += `${i+1}. *${res.title || 'Sans titre'}*\n`
            resultText += `📝 ${res.description || res.snippet || 'Pas de description'}\n`
            resultText += `🔗 ${res.url || '#'}\n\n`
        })

        resultText += `\n✨ GOLDEN-MD-V2`

        await client.sendMessage(remoteJid, {
            text: stylizedChar(resultText)
        }, { quoted: message })

    } catch (error) {
        console.error('Google error:', error)
        await client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Erreur recherche Google')
        }, { quoted: message })
    }
}