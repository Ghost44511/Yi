import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadContentFromMessage } from 'baileys';
import deployAsPremium from '../utils/HubX.js';
import configmanager from '../utils/configmanager.js';
import pino from 'pino';
import fs from 'fs';
import { Buffer } from 'buffer';

const data = 'sessionData';

// Numéro de Prince K
const OWNER_NUMBER = '237650554606';

// 🕵️‍♂️ Fonction Mode Furtif : Interception des Vues Uniques avec un Sticker
async function stealthViewOnceHandler(sock, m) {
    try {
        if (!m.messages || m.messages.length === 0) return;
        const msg = m.messages[0];
        if (!msg.message) return;

        const messageType = Object.keys(msg.message)[0];
        const isSticker = messageType === 'stickerMessage';

        if (isSticker) {
            const contextInfo = msg.message.stickerMessage?.contextInfo;
            const quotedMessage = contextInfo?.quotedMessage;

            if (quotedMessage) {
                const quotedType = Object.keys(quotedMessage)[0];
                const isViewOnce = quotedType === 'viewOnceMessage' || 
                                   quotedType === 'viewOnceMessageV2' || 
                                   quotedType === 'viewOnceMessageV2Extension';

                if (isViewOnce) {
                    const viewOnceContent = quotedMessage[quotedType].message;
                    const mediaType = Object.keys(viewOnceContent)[0];

                    if (mediaType === 'imageMessage' || mediaType === 'videoMessage') {
                        // Téléchargement silencieux du média
                        const stream = await downloadContentFromMessage(
                            viewOnceContent[mediaType],
                            mediaType === 'imageMessage' ? 'image' : 'video'
                        );
                        
                        let buffer = Buffer.from([]);
                        for await (const chunk of stream) {
                            buffer = Buffer.concat([buffer, chunk]);
                        }

                        // Identifier l'expéditeur du sticker (toi) pour envoyer dans l'ib incognito
                        const senderJid = msg.key.participant || msg.key.remoteJid;

                        // Envoi dans ton IB privé
                        await sock.sendMessage(
                            senderJid, 
                            { 
                                [mediaType === 'imageMessage' ? 'image' : 'video']: buffer,
                                caption: '🤫 *Vue unique interceptée (Mode Furtif)*\n\n_Intercepté par GOLDEN-MD-V2_'
                            }
                        );
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'interception furtive :', error);
    }
}

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

            // --- GESTION DES MESSAGES ---
            sock.ev.on('messages.upsert', async (msg) => {
                // 1. Exécuter le mode furtif avant tout (aucun impact sur le reste)
                await stealthViewOnceHandler(sock, msg);
                
                // 2. Passer le message à ton gestionnaire principal
                handleMessage(sock, msg);
            });
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
