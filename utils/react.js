export default async function react(client, message) {
    const sleep = ms => new Promise(r => setTimeout(r, ms))
    const remoteJid = message?.key?.remoteJid

    try {
        await client.sendMessage(remoteJid, {
            react: { text: '🎯', key: message.key }
        })
        await sleep(800)
        await client.sendMessage(remoteJid, {
            react: { text: '⚡', key: message.key }
        })
        await sleep(800)
        await client.sendMessage(remoteJid, {
            react: { remove: true, key: message.key }
        })
    } catch (e) {
        console.error('React error:', e)
    }
}
