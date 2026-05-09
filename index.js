const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const ownerNumber = '237650554606@s.whatsapp.net'; 
const botName = 'Prince K Bot';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: [botName, 'Chrome', '1.0.0']
    });

    // --- CHARGEMENT SÉCURISÉ DES COMMANDES (ANTI-CRASH) ---
    const commands = new Map();
    const loadFromDir = (dirName) => {
        const dirPath = path.join(__dirname, 'src', dirName);
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
            for (const file of files) {
                try {
                    const fullPath = path.join(dirPath, file);
                    // Nettoyage du cache pour éviter les erreurs de déploiement
                    delete require.cache[require.resolve(fullPath)];
                    const cmd = require(fullPath);
                    commands.set(file.replace('.js', '').toLowerCase(), cmd);
                    console.log(`✅ ${dirName}/${file} chargé.`);
                } catch (e) {
                    console.log(`⚠️ Fichier ${dirName}/${file} introuvable ou erreur. Ignoré.`);
                }
            }
        }
    };

    // Charge vos dossiers de commandes
    loadFromDir('commands');
    loadFromDir('Hub'); // Pour shadow.js

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connexion fermée, tentative de reconnexion...');
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log(`🛡️ ${botName} est en ligne !`);
            console.log(`📡 Numéro administrateur : ${ownerNumber}`);
        }
    });

    conn.ev.on('messages.upsert', async chatUpdate => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message) return;
            const msgType = Object.keys(m.message)[0];
            const remoteJid = m.key.remoteJid;
            
            // 1. Détection ViewOnce (Appelle viewonce.js si vous l'avez créé)
            if (m.message[msgType]?.viewOnce) {
                try {
                    const { viewOnceHandler } = require('./viewonce.js');
                    await viewOnceHandler(conn, m, ownerNumber);
                } catch (e) { /* Ne fait rien si le fichier n'existe pas */ }
            }

            // Extraction du texte du message
            const body = (msgType === 'conversation') ? m.message.conversation : 
                         (msgType === 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                         (msgType === 'imageMessage') ? m.message.imageMessage.caption : 
                         (msgType === 'videoMessage') ? m.message.videoMessage.caption : '';
            
            const prefix = '.';
            if (!body.startsWith(prefix)) return;

            const args = body.trim().split(/ +/).slice(1);
            const commandName = body.trim().split(/ +/)[0].toLowerCase().slice(prefix.length);
            const isCreator = remoteJid.includes('237650554606');

            // 2. Exécution de la commande (ex: .shadow ou .freeze)
            if (commands.has(commandName)) {
                try {
                    const cmd = commands.get(commandName);
                    // On gère les différents formats d'exportation de commandes
                    if (typeof cmd.freezeCommand === 'function') {
                        await cmd.freezeCommand(conn, m, args, isCreator);
                    } else if (typeof cmd === 'function') {
                        await cmd(conn, m, args, isCreator);
                    } else if (cmd.execute) {
                        await cmd.execute(conn, m, args, isCreator);
                    }
                } catch (error) {
                    console.error(`Erreur exécution ${commandName}:`, error);
                }
            }

        } catch (err) {
            console.error("Erreur générale messages.upsert:", err);
        }
    });
}

// Lancement du bot
startBot().catch(err => console.error("Erreur critique au démarrage:", err));
