import axios from 'axios';
import stylizedChar from '../utils/fancy.js';

// 🔑 Clé API depuis .env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function gptCommand(client, message) {
    const remoteJid = message.key?.remoteJid;
    const messageBody = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
    const args = messageBody.slice(5).trim(); // ".gpt " = 5 caractères

    if (!args) {
        await client.sendMessage(remoteJid, {
            text: stylizedChar(" ❌ Pose-moi une question ! Exemple : .gpt Quelle est la capitale de la France ?")
        });
        return;
    }

    try {
        await client.sendMessage(remoteJid, {
            text: stylizedChar(" ⏳ GPT réfléchit à ta question...")
        });

        const prompt = `Réponds en français uniquement. Question : ${args}`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] },
            { headers: { 'Content-Type': 'application/json' } }
        );

        const reply = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (reply) {
            await client.sendMessage(remoteJid, {
                text: stylizedChar(` 🤖 *GPT répond :*\n\n${reply}`)
            });
        } else {
            throw new Error('Pas de réponse valide du modèle principal');
        }

    } catch (error) {
        console.error('Erreur GPT:', error);

        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            if (status === 404) {
                // Essayer plusieurs modèles si le premier échoue
                const modelsToTry = [
                    'gemini-2.5-flash',
                    'gemini-2.5-pro',
                    'gemini-2.0-flash',
                    'gemini-1.5-flash',
                    'gemini-1.5-pro'
                ];

                let success = false;

                for (const model of modelsToTry) {
                    try {
                        const retryResponse = await axios.post(
                            `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
                            { contents: [{ parts: [{ text: `Réponds en français uniquement. Question : ${args}` }] }] },
                            { headers: { 'Content-Type': 'application/json' } }
                        );

                        const retryReply = retryResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text;

                        if (retryReply) {
                            await client.sendMessage(remoteJid, {
                                text: stylizedChar(` 🤖 *GPT (${model}) répond :*\n\n${retryReply}`)
                            });
                            success = true;
                            break;
                        }
                    } catch {
                        console.log(`Modèle ${model} échec, on essaie le suivant...`);
                    }
                }

                if (!success) {
                    await client.sendMessage(remoteJid, {
                        text: stylizedChar(" ❌ Aucun modèle Gemini disponible pour le moment. Réessaie plus tard.")
                    });
                }

            } else if (status === 403) {
                await client.sendMessage(remoteJid, {
                    text: stylizedChar(" ❌ Clé API invalide ou expirée ! Vérifie ta clé.")
                });
            } else if (status === 429) {
                await client.sendMessage(remoteJid, {
                    text: stylizedChar(" ⏳ Trop de requêtes ! Attends 1 minute (limite gratuite).")
                });
            } else {
                await client.sendMessage(remoteJid, {
                    text: stylizedChar(` ❌ Erreur ${status}: ${data?.error?.message || 'Erreur inconnue'}`)
                });
            }

        } else {
            await client.sendMessage(remoteJid, {
                text: stylizedChar(` ❌ Erreur réseau: ${error.message}`)
            });
        }
    }
}

export default gptCommand;