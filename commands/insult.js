import stylizedChar from '../utils/fancy.js';

const insults = [

    "T'es comme un nuage. Quand tu disparais, c'est une belle journée !",

    "Tu apportes tellement de joie aux gens... quand tu quittes la pièce !",

    "Je serais d'accord avec toi, mais après on aurait tous les deux tort.",

    "T'es pas bête, t'as juste de la malchance quand tu réfléchis.",

    "Tes secrets sont toujours en sécurité avec moi. Je ne les écoute même jamais.",

    "T'es la preuve que même l'évolution prend des pauses parfois.",

    "T'as un truc sur le menton... non, le troisième en bas.",

    "T'es comme une mise à jour logicielle. Dès que je te vois, je me dis 'J'ai vraiment besoin de ça maintenant ?'",

    "Tu rends tout le monde heureux... tu sais, quand tu t'en vas.",

    "T'es comme une pièce de monnaie—deux faces et pas beaucoup de valeur.",

    "T'as quelque chose en tête... oh attends, never mind.",

    "T'es la raison pour laquelle ils mettent des modes d'emploi sur les bouteilles de shampooing.",

    "T'es comme un nuage. Toujours à flotter sans vrai but.",

    "Tes blagues sont comme du lait périmé—aigres et difficiles à digérer.",

    "T'es comme une bougie dans le vent... inutile quand les choses deviennent difficiles.",

    "T'as quelque chose d'unique—ta capacité à énerver tout le monde également.",

    "T'es comme un signal Wi-Fi—toujours faible quand on a le plus besoin.",

    "T'es la preuve que tout le monde n'a pas besoin d'un filtre pour être désagréable.",

    "Ton énergie est comme un trou noir—elle aspire juste la vie de la pièce.",

    "T'as le visage parfait pour la radio.",

    "T'es comme un embouteillage—personne ne te veut, mais te voilà.",

    "T'es comme un crayon cassé—sans intérêt.",

    "Tes idées sont tellement originales, je suis sûr de les avoir déjà toutes entendues.",

    "T'es la preuve vivante que même les erreurs peuvent être productives.",

    "T'es pas paresseux, t'es juste très motivé à ne rien faire.",

    "Ton cerveau tourne sous Windows 95—lent et dépassé.",

    "T'es comme un ralentisseur—personne ne t'aime, mais tout le monde doit te supporter.",

    "T'es comme un nuage de moustiques—juste irritant.",

    "Tu rassembles les gens... pour parler de à quel point t'es énervant."

];

async function insultCommand(client, message) {

    try {

        const remoteJid = message.key?.remoteJid;

        

        if (!message || !remoteJid) {

            console.log('Invalid message or remoteJid:', { message, remoteJid });

            return;

        }

        let userToInsult;

        

        // Check for mentioned users

        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {

            userToInsult = message.message.extendedTextMessage.contextInfo.mentionedJid[0];

        }

        // Check for replied message

        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {

            userToInsult = message.message.extendedTextMessage.contextInfo.participant;

        }

        

        if (!userToInsult) {

            await client.sendMessage(remoteJid, { 

                text: stylizedChar('Please mention someone or reply to their message to insult them!')

            });

            return;

        }

        const insult = insults[Math.floor(Math.random() * insults.length)];

        // Add delay to avoid rate limiting

        await new Promise(resolve => setTimeout(resolve, 1000));

        await client.sendMessage(remoteJid, { 

            text: `Hey @${userToInsult.split('@')[0]}, ${insult}`,

            mentions: [userToInsult]

        });

        

    } catch (error) {

        console.error('Error in insult command:', error);

        

        const remoteJid = message.key?.remoteJid;

        if (!remoteJid) return;

        

        if (error.data === 429) {

            await new Promise(resolve => setTimeout(resolve, 2000));

            try {

                await client.sendMessage(remoteJid, { 

                    text: stylizedChar('Please try again in a few seconds.')

                });

            } catch (retryError) {

                console.error('Error sending retry message:', retryError);

            }

        } else {

            try {

                await client.sendMessage(remoteJid, { 

                    text: stylizedChar('An error occurred while sending the insult.')

                });

            } catch (sendError) {

                console.error('Error sending error message:', sendError);

            }

        }

    }

}

export default insultCommand;