import pkg from '@whiskeysockets/baileys';
const { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion
} = pkg;

import pino from 'pino';
import { Boom } from '@hapi/boom';
import readline from 'readline';

// --- IMPORTATION DE SHADOW.JS ---
// Assure-toi que shadow.js est dans le même dossier et possède l'extension .js
import * as shadow from './shadow.js'; 

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_auth');
    const { version } = await fetchLatestBaileysVersion();

    const client = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false // Désactivé car on utilise le code à 8 chiffres
    });

    // --- LOGIQUE DU CODE DE COUPLAGE (8 CHIFFRES) ---
    if (!client.authState.creds.registered) {
        const phoneNumber = "237650554606"; // Ton numéro configuré
        setTimeout(async () => {
            try {
                let code = await client.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n--- BOT PRINCE K ---\n`);
                console.log(`TON CODE DE COUPLAGE EST : ${code}`);
                console.log(`\nEntre ce code sur ton WhatsApp (Appareils connectés > Connecter un appareil > Se connecter avec le numéro de téléphone)\n`);
            } catch (error) {
                console.error("Erreur lors de la génération du code :", error);
            }
        }, 3000);
    }

    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('✅ Bot connecté avec succès !');
            // Utilisation d'une fonction de shadow.js si elle existe
            if (shadow.init) shadow.init(client); 
        }
    });

    client.ev.on('creds.update', saveCreds);

    client.ev.on('messages.upsert', async (chatUpdate) => {
        const msg = chatUpdate.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        // Ici, tu peux passer les messages à shadow.js pour traitement
        // Exemple : shadow.handleMessage(client, msg);
    });
}

startBot().catch(err => console.error("Erreur critique :", err));
