async function bug(message, client, texts, num) {

    try {
        
        const remoteJid = message.key?.remoteJid;

        await client.sendMessage(remoteJid, {

            image: { url: `database/${num}.jpg` },

            caption: `> ${texts}\n\n🔗 Rejoins ma chaîne : https://whatsapp.com/channel/0029VbC8KUk2kNFp2Fb0bF3J`,

            contextInfo: {

                externalAdReply: {

                    title: "THE GOLDENBOY DEV TECH",

                    body: "GOLDEN-MD-V2",

                    mediaType: 1,
                    
                    thumbnailUrl: `https://whatsapp.com/channel/0029VbC8KUk2kNFp2Fb0bF3J`,

                    renderLargerThumbnail: false,

                    mediaUrl: `${num}.jpg`,

                    sourceUrl: `${num}.jpg`
                }
            }
        });

    } catch (e) {
        console.log(e)
    }
}

export default bug;