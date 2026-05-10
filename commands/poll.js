export default async function poll(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const content = text.split(' ').slice(1).join(' ')

    if (!content || !content.includes('|')) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Exemple: .poll Quel est ton langage préféré ? | JavaScript | Python | Java')
        }, { quoted: message })
    }

    const parts = content.split('|').map(p => p.trim())
    const question = parts[0]
    const options = parts.slice(1)

    if (options.length < 2) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Minimum 2 options requises')
        }, { quoted: message })
    }

    if (options.length > 5) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Maximum 5 options')
        }, { quoted: message })
    }

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']
    
    let pollText = `📊 *SONDAGE*\n\n`
    pollText += `*${question}*\n\n`
    
    options.forEach((opt, i) => {
        pollText += `${emojis[i]} ${opt}\n`
    })
    
    pollText += `\n_Réagissez avec l'emoji correspondant pour voter !_`

    await client.sendMessage(remoteJid, {
        text: stylizedChar(pollText)
    }, { quoted: message })
}