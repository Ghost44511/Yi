import pkg from '@whiskeysockets/baileys';
const { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion
} = pkg;

import pino from 'pino';
import { Boom } from '@hapi/boom';
import { fileURLToPath } from 'url';
import path from 'path';

// --- GESTION DE L'EMPLACEMENT ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importation stricte avec extension .js (Obligatoire sur Render/ESM)
// On utilise le chemin absolu calculé dynamiquement pour éviter l'erreur NOT_FOUND
import * as shadow from './shadow.js';

async function startBot() {
    // Utilisation de path.join pour être sûr du dossier de session
    const sessionPath = path.join(__dirname, 'session_auth');
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const client = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false 
    });

    // --- CODE DE COUPLAGE (PAIRING CODE) ---
    if (!client.authState.creds.registered) {
        const phoneNumber = "237650554606"; 
        setTimeout(async () => {
            try {
                let code = await client.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n==============================`);
                console.log(`TON CODE DE COUPLAGE : ${code}`);
                console.log(`==============================\n`);
            } catch (error) {
                console.error("Erreur pairing code:", error);
            }
        }, 5000); // Délai de 5s pour laisser le socket s'initialiser
    }

    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason !== DisconnectReason.loggedOut) startBot();
        } else if (connection === 'open') {
            console.log('✅ Bot Prince K connecté !');
            if (shadow.init) shadow.init(client);
        }
    });

    client.ev.on('creds.update', saveCreds);

    client.ev.on('messages.upsert', async (chatUpdate) => {
        const msg = chatUpdate.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        // Relai vers shadow.js
        if (shadow.handleMessage) shadow.handleMessage(client, msg);
    });
}

startBot().catch(err => console.error("Erreur fatale au démarrage :", err));
