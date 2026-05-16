/**
 * Projet : Prince K Bot
 * Fonction : Convertisseur Vue Unique via Sticker (Mode Distrait)
 * Cible : 237650554606
 */

const { 
    downloadContentFromMessage, 
    generateForwardMessageContent, 
    prepareWAMessageMedia 
} = require('@whiskeysockets/baileys');

module.exports = async (client, mek, m) => {
    try {
        const botNumber = "237650554606@s.whatsapp.net";
        const ownerName = "Prince K";

        // 1. Vérification : Est-ce que le message envoyé est un sticker ?
        const isSticker = m.mtype === 'stickerMessage';
        
        // 2. Vérification : Est-ce qu'on répond à un message (quoted) ?
        const quoted = m.quoted ? m.quoted : null;

        if (isSticker && quoted) {
            // 3. Vérification : Le message cité est-il une vue unique (image ou vidéo) ?
            const isViewOnce = quoted.mtype === 'viewOnceMessageV2' || quoted.msg?.viewOnce;

            if (isViewOnce) {
                // Récupération du contenu réel (vidéo ou image) caché dans la vue unique
                const viewOnceContent = quoted.msg.message || quoted.msg;
                const type = Object.keys(viewOnceContent)[0]; // imageMessage ou videoMessage
                const mediaType = type.replace('Message', '');

                // 4. Téléchargement du média
                const stream = await downloadContentFromMessage(
                    viewOnceContent[type], 
                    mediaType
                );
                
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                // 5. Envoi vers ton IB (ton numéro de téléphone)
                const caption = `*PROJET : ${ownerName}*\n✨ Média récupéré avec succès.`;

                await client.sendMessage(botNumber, {
                    [mediaType]: buffer,
                    caption: caption,
                    contextInfo: {
                        externalAdReply: {
                            title: ownerName,
                            body: "Mode Distrait Activé",
                            previewType: "PHOTO",
                            thumbnailUrl: "https://telegra.ph/file/your-image-link.jpg", // Optionnel : lien vers une image de profil
                            sourceUrl: ""
                        }
                    }
                }, { quoted: m });

                console.log(`[${ownerName}] Média envoyé au 237650554606`);
            }
        }
    } catch (err) {
        console.error(`Erreur Prince K Bot: `, err);
    }
};
