const fs = require('fs');
const path = require('path');

async function loadCommands(conn) {
    // On définit le chemin vers ton dossier de commandes
    const commandsPath = path.join(__dirname, 'src', 'commands');

    // On vérifie si le dossier existe pour éviter un crash immédiat
    if (!fs.existsSync(commandsPath)) {
        console.log("⚠️ Le dossier src/commands est introuvable. Création d'un dossier vide...");
        fs.mkdirSync(commandsPath, { recursive: true });
        return;
    }

    // On lit tous les fichiers du dossier
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            // Tentative de chargement du fichier
            const command = require(`./src/commands/${file}`);
            console.log(`✅ Commande chargée : ${file}`);
            
            // Ici tu peux ajouter la logique pour enregistrer la commande dans ton bot
            // Exemple : conn.commands.set(command.name, command);

        } catch (error) {
            // SI LE FICHIER MANQUE OU A UNE ERREUR :
            // Le bot affiche l'erreur dans la console mais NE S'ARRÊTE PAS.
            console.log(`❌ Impossible de charger ${file} : Fichier manquant ou erreur interne.`);
            console.error(error.message); 
            continue; // Passe au fichier suivant
        }
    }
}

// Appelle cette fonction au démarrage de ton bot
// loadCommands(conn);
