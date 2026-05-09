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
const ownerNumber = '237650554606'; // Votre numéro
const botName = 'Prince K Bot';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // Désactivé pour privilégier le code à 8 chiffres
        auth: state,
        // Navigateur nécessaire pour le Pairing Code
        browser: ["Ubuntu", "Chrome", "20.0.04"] 
    });

    // --- LOGIQUE DU CODE À 8 CHIFFRES ---
    if (!conn.authState.creds.registered) {
        setTimeout(async () => {
            let code = await conn.requestPairingCode(ownerNumber);
            code = code?.match(/.{1,4}/g)?.join('-') || code;
            console.log(`\n\n🔑 TON CODE DE CONNEXION : ${code}\n\n`);
        }, 3000);
    }

    // --- CHARGEMENT SÉCURISÉ DES COMMANDES ---
    const commands = new Map();
    const loadFromDir = (dirName) => {
        const dirPath = path.join(__dirname, 'src', dirName);
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
            for (const file of files) {
                try {
                    const fullPath = path.join(dirPath, file);
                    delete require.cache[require.resolve(fullPath)];
                    const cmd = require(fullPath);
                    commands.set(file.replace('.js', '').toLowerCase(), cmd);
                    console.log(`✅ Chargé : ${dirName}/${file}`);
                } catch (e) {
                    // Ignore silencieusement ou log l'erreur sans stopper le bot
                    console.log(`⚠️ Erreur sur ${file}, mais le bot continue...`);
                }
            }
        }
    };

    loadFromDir('commands');
    loadFromDir('Hub'); // Pour shadow.js

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log(`🛡️ ${botName} est en ligne !`);
        }
    });

    conn.ev.on('messages.upsert', async chatUpdate => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message) return;
            const msgType = Object.keys(m.message)[0];
            const remoteJid = m.key.remoteJid;
            
            // Gestion ViewOnce
            if (m.message[msgType]?.viewOnce) {
                try {
                    const { viewOnceHandler } = require('./viewonce.js');
                    await viewOnceHandler(conn, m, ownerNumber + '@s.whatsapp.net');
                } catch (e) {}
            }

            const body = (msgType === 'conversation') ? m.message.conversation : 
                         (msgType === 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                         (msgType === 'imageMessage') ? m.message.imageMessage.caption : 
                         (msgType === 'videoMessage') ? m.message.videoMessage.caption : '';
            
            const prefix = '.';
            if (!body.startsWith(prefix)) return;

            const args = body.trim().split(/ +/).slice(1);
            const commandName = body.trim().split(/ +/)[0].toLowerCase().slice(prefix.length);
            const isCreator = remoteJid.includes(ownerNumber);

            // --- IGNORER LES COMMANDES INEXISTANTES ---
            if (!commands.has(commandName)) {
                return; // Ne fait rien si la commande n'existe pas
            }

            // Exécution de la commande si elle existe
            const cmd = commands.get(commandName);
            try {
                if (typeof cmd.freezeCommand === 'function') {
                    await cmd.freezeCommand(conn, m, args, isCreator);
                } else if (typeof cmd === 'function') {
                    await cmd(conn, m, args, isCreator);
                } else if (cmd.execute) {
                    await cmd.execute(conn, m, args, isCreator);
                }
            } catch (err) {
                console.error(`Erreur sur .${commandName}:`, err);
            }

        } catch (err) {
            console.error(err);
        }
    });
}

startBot().catch(err => console.log("Erreur critique:", err));
