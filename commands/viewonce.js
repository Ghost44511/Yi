const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

/**
 * Fonction ViewOnce - Intercepte et renvoie les médias à vue unique
 * @param {Object} conn - La connexion du bot
 * @param {Object} m - Le message reçu
 * @param {String} ownerNumber - Ton numéro (pour recevoir le média)
 */
async function viewOnceHandler(conn, m, ownerNumber) {
    // 1. Vérifier si le message est une "Vue Unique" (image ou vidéo)
    const type = Object.keys(m.message)[0];
    const isViewOnce = m.message[type]?.viewOnce;

    if (!isViewOnce) return;

    try {
        // 2. Extraire les données du média
        const message = m.message[type];
        const stream = await downloadContentFromMessage(
            message,
            type === 'imageMessage' ? 'image' : 'video'
        );

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 3. Préparer les infos de l'expéditeur
        const caption = `🎭 *DÉTECTEUR VUE UNIQUE*\n\n` +
                        `👤 *De :* @${m.sender.split('@')[0]}\n` +
                        `📍 *Groupe :* ${m.isGroup ? m.pushName : 'Privé'}\n` +
                        `📝 *Légende :* ${message.caption || 'Aucune'}`;

        // 4. Envoyer le média à TOI uniquement (le propriétaire)
        await conn.sendMessage(ownerNumber, {
            [type === 'imageMessage' ? 'image' : 'video']: buffer,
            caption: caption,
            mentions: [m.sender]
        });

        console.log(`✅ Média ViewOnce récupéré de ${m.sender}`);

    } catch (err) {
        console.error("❌ Erreur lors de la récupération ViewOnce :", err);
    }
}

module.exports = { viewOnceHandler };
