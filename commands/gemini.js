import axios from 'axios';
import stylizedChar from '../utils/fancy.js';

// ══════════════════════════════════════════════
//   🔑 CLÉ API GEMINI — PRINCE K
// ══════════════════════════════════════════════
const GEMINI_API_KEY = 'AIzaSyDv3yy2fa-B7de3gDkSOH6Vjt6fmO1YDHE';

const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
];

// ══════════════════════════════════════════════
//   🚀 FONCTION PRINCIPALE — APPEL API GEMINI
// ══════════════════════════════════════════════
async function callGemini(prompt, modelIndex = 0) {
    if (modelIndex >= GEMINI_MODELS.length) {
        throw new Error('Tous les modèles Gemini sont indisponibles.');
    }

    const model = GEMINI_MODELS[modelIndex];

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] },
            { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
        );

        const text = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Réponse vide');

        return { text, model };

    } catch (error) {
        const status = error?.response?.status;

        // Quota dépassé ou modèle indisponible → essayer le suivant
        if (status === 404 || status === 429 || status === 503) {
            console.log(`[GEMINI] ${model} indisponible (${status}), essai du suivant...`);
            return callGemini(prompt, modelIndex + 1);
        }

        throw error;
    }
}

// ══════════════════════════════════════════════
//   🤖 COMMANDE: .gemini — IA Générale
// ══════════════════════════════════════════════
export async function geminiCommand(client, message) {
    const remoteJid = message.key?.remoteJid;
    const text = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
    const args = text.split(' ').slice(1).join(' ').trim();

    if (!args) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Exemple: .gemini Explique moi les trous noirs')
        }, { quoted: message });
    }

    await client.sendMessage(remoteJid, {
        react: { text: '🧠', key: message.key }
    });

    try {
        await client.sendMessage(remoteJid, {
            text: stylizedChar('⏳ Gemini réfléchit...')
        });

        const prompt = `Réponds en français uniquement, de façon claire et structurée. Question : ${args}`;
        const { text: reply, model } = await callGemini(prompt);

        await client.sendMessage(remoteJid, {
            text: stylizedChar(`🧠 *Gemini (${model}) :*\n\n${reply}`)
        }, { quoted: message });

    } catch (error) {
        console.error('[GEMINI] Erreur:', error.message);
        await _handleGeminiError(client, remoteJid, message, error);
    }
}

// ══════════════════════════════════════════════
//   ✍️ COMMANDE: .redige — Rédaction IA
// ══════════════════════════════════════════════
export async function redigeCommand(client, message) {
    const remoteJid = message.key?.remoteJid;
    const text = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
    const args = text.split(' ').slice(1).join(' ').trim();

    if (!args) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Exemple: .redige un email professionnel pour demander un congé')
        }, { quoted: message });
    }

    await client.sendMessage(remoteJid, {
        react: { text: '✍️', key: message.key }
    });

    try {
        const prompt = `Tu es un expert en rédaction. Rédige en français: ${args}\n\nFournis un texte professionnel, bien structuré et complet.`;
        const { text: reply, model } = await callGemini(prompt);

        await client.sendMessage(remoteJid, {
            text: stylizedChar(`✍️ *Rédaction IA :*\n\n${reply}`)
        }, { quoted: message });

    } catch (error) {
        await _handleGeminiError(client, remoteJid, message, error);
    }
}

// ══════════════════════════════════════════════
//   💻 COMMANDE: .code — Génération de code
// ══════════════════════════════════════════════
export async function codeCommand(client, message) {
    const remoteJid = message.key?.remoteJid;
    const text = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
    const args = text.split(' ').slice(1).join(' ').trim();

    if (!args) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Exemple: .code crée une fonction JavaScript pour trier un tableau')
        }, { quoted: message });
    }

    await client.sendMessage(remoteJid, {
        react: { text: '💻', key: message.key }
    });

    try {
        const prompt = `Tu es un développeur expert. Génère du code propre et commenté pour: ${args}\n\nFournis le code avec des explications en français. Utilise des blocs de code bien formatés.`;
        const { text: reply, model } = await callGemini(prompt);

        await client.sendMessage(remoteJid, {
            text: stylizedChar(`💻 *Code généré par IA :*\n\n${reply}`)
        }, { quoted: message });

    } catch (error) {
        await _handleGeminiError(client, remoteJid, message, error);
    }
}

// ══════════════════════════════════════════════
//   🌍 COMMANDE: .traduis — Traduction IA
// ══════════════════════════════════════════════
export async function traduisCommand(client, message) {
    const remoteJid = message.key?.remoteJid;
    const text = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
    const args = text.split(' ').slice(1).join(' ').trim();

    if (!args) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Exemple: .traduis en anglais : Bonjour, comment allez-vous ?')
        }, { quoted: message });
    }

    await client.sendMessage(remoteJid, {
        react: { text: '🌍', key: message.key }
    });

    try {
        const prompt = `Tu es un traducteur expert. Traduis le texte suivant en respectant le sens, le ton et le contexte. Si la langue cible n'est pas précisée, traduis en anglais. Texte : ${args}\n\nFournis uniquement la traduction avec la langue source et la langue cible précisées.`;
        const { text: reply } = await callGemini(prompt);

        await client.sendMessage(remoteJid, {
            text: stylizedChar(`🌍 *Traduction IA :*\n\n${reply}`)
        }, { quoted: message });

    } catch (error) {
        await _handleGeminiError(client, remoteJid, message, error);
    }
}

// ══════════════════════════════════════════════
//   📚 COMMANDE: .resume — Résumé de texte
// ══════════════════════════════════════════════
export async function resumeCommand(client, message) {
    const remoteJid = message.key?.remoteJid;
    const text = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
    const args = text.split(' ').slice(1).join(' ').trim();

    if (!args) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Exemple: .resume [colle ton texte ici]')
        }, { quoted: message });
    }

    await client.sendMessage(remoteJid, {
        react: { text: '📚', key: message.key }
    });

    try {
        const prompt = `Résume le texte suivant en français de façon claire, concise et en conservant les points essentiels. Texte : ${args}`;
        const { text: reply } = await callGemini(prompt);

        await client.sendMessage(remoteJid, {
            text: stylizedChar(`📚 *Résumé IA :*\n\n${reply}`)
        }, { quoted: message });

    } catch (error) {
        await _handleGeminiError(client, remoteJid, message, error);
    }
}

// ══════════════════════════════════════════════
//   🎭 COMMANDE: .histoire — Génération histoire
// ══════════════════════════════════════════════
export async function histoireCommand(client, message) {
    const remoteJid = message.key?.remoteJid;
    const text = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
    const args = text.split(' ').slice(1).join(' ').trim();

    if (!args) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Exemple: .histoire un héros africain qui sauve son village')
        }, { quoted: message });
    }

    await client.sendMessage(remoteJid, {
        react: { text: '🎭', key: message.key }
    });

    try {
        await client.sendMessage(remoteJid, {
            text: stylizedChar('✍️ Création de l\'histoire en cours...')
        });

        const prompt = `Tu es un écrivain créatif. Écris une histoire captivante, imaginative et bien structurée en français sur le thème suivant : ${args}\n\nL'histoire doit avoir un début, un développement et une fin. Utilise un style narratif engageant.`;
        const { text: reply } = await callGemini(prompt);

        await client.sendMessage(remoteJid, {
            text: stylizedChar(`🎭 *Histoire IA :*\n\n${reply}`)
        }, { quoted: message });

    } catch (error) {
        await _handleGeminiError(client, remoteJid, message, error);
    }
}

// ══════════════════════════════════════════════
//   💡 COMMANDE: .idee — Génération d'idées
// ══════════════════════════════════════════════
export async function ideeCommand(client, message) {
    const remoteJid = message.key?.remoteJid;
    const text = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
    const args = text.split(' ').slice(1).join(' ').trim();

    if (!args) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Exemple: .idee business en Afrique avec peu de capital')
        }, { quoted: message });
    }

    await client.sendMessage(remoteJid, {
        react: { text: '💡', key: message.key }
    });

    try {
        const prompt = `Tu es un expert en créativité et brainstorming. Génère 10 idées innovantes et réalistes en français sur : ${args}\n\nPour chaque idée, donne un titre court et une explication de 2-3 lignes. Numérote chaque idée.`;
        const { text: reply } = await callGemini(prompt);

        await client.sendMessage(remoteJid, {
            text: stylizedChar(`💡 *Idées générées :*\n\n${reply}`)
        }, { quoted: message });

    } catch (error) {
        await _handleGeminiError(client, remoteJid, message, error);
    }
}

// ══════════════════════════════════════════════
//   🔍 COMMANDE: .analyse — Analyse de texte
// ══════════════════════════════════════════════
export async function analyseCommand(client, message) {
    const remoteJid = message.key?.remoteJid;
    const text = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
    const args = text.split(' ').slice(1).join(' ').trim();

    if (!args) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Exemple: .analyse [colle un texte ou une situation à analyser]')
        }, { quoted: message });
    }

    await client.sendMessage(remoteJid, {
        react: { text: '🔍', key: message.key }
    });

    try {
        const prompt = `Tu es un expert en analyse. Analyse en profondeur ce qui suit en français, en identifiant les points clés, les forces, les faiblesses et les opportunités : ${args}\n\nStructure ton analyse avec des sections claires.`;
        const { text: reply } = await callGemini(prompt);

        await client.sendMessage(remoteJid, {
            text: stylizedChar(`🔍 *Analyse IA :*\n\n${reply}`)
        }, { quoted: message });

    } catch (error) {
        await _handleGeminiError(client, remoteJid, message, error);
    }
}

// ══════════════════════════════════════════════
//   🧮 COMMANDE: .calcul — Résolution de maths
// ══════════════════════════════════════════════
export async function calculCommand(client, message) {
    const remoteJid = message.key?.remoteJid;
    const text = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
    const args = text.split(' ').slice(1).join(' ').trim();

    if (!args) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Exemple: .calcul Résous : 2x² + 5x - 3 = 0')
        }, { quoted: message });
    }

    await client.sendMessage(remoteJid, {
        react: { text: '🧮', key: message.key }
    });

    try {
        const prompt = `Tu es un expert en mathématiques. Résous et explique étape par étape en français : ${args}\n\nMontre toutes les étapes clairement avec le raisonnement.`;
        const { text: reply } = await callGemini(prompt);

        await client.sendMessage(remoteJid, {
            text: stylizedChar(`🧮 *Solution IA :*\n\n${reply}`)
        }, { quoted: message });

    } catch (error) {
        await _handleGeminiError(client, remoteJid, message, error);
    }
}

// ══════════════════════════════════════════════
//   🎤 COMMANDE: .lyrics — Écriture de paroles
// ══════════════════════════════════════════════
export async function lyricsAICommand(client, message) {
    const remoteJid = message.key?.remoteJid;
    const text = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
    const args = text.split(' ').slice(1).join(' ').trim();

    if (!args) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Exemple: .lyricsai amour et trahison style afrobeat')
        }, { quoted: message });
    }

    await client.sendMessage(remoteJid, {
        react: { text: '🎤', key: message.key }
    });

    try {
        const prompt = `Tu es un auteur-compositeur professionnel. Écris des paroles de chanson créatives et percutantes en français sur : ${args}\n\nStructure avec: [Intro], [Couplet 1], [Refrain], [Couplet 2], [Refrain], [Outro]. Utilise des rimes et un flow rythmique.`;
        const { text: reply } = await callGemini(prompt);

        await client.sendMessage(remoteJid, {
            text: stylizedChar(`🎤 *Paroles IA :*\n\n${reply}`)
        }, { quoted: message });

    } catch (error) {
        await _handleGeminiError(client, remoteJid, message, error);
    }
}

// ══════════════════════════════════════════════
//   🩺 COMMANDE: .sante — Conseils santé
// ══════════════════════════════════════════════
export async function santeCommand(client, message) {
    const remoteJid = message.key?.remoteJid;
    const text = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
    const args = text.split(' ').slice(1).join(' ').trim();

    if (!args) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Exemple: .sante maux de tête fréquents et fatigue')
        }, { quoted: message });
    }

    await client.sendMessage(remoteJid, {
        react: { text: '🩺', key: message.key }
    });

    try {
        const prompt = `Tu es un assistant médical (non substitut à un médecin). Donne des informations générales, des causes possibles et des conseils pratiques en français sur : ${args}\n\nAjoute toujours une note recommandant de consulter un médecin pour un diagnostic précis.`;
        const { text: reply } = await callGemini(prompt);

        await client.sendMessage(remoteJid, {
            text: stylizedChar(`🩺 *Conseils santé IA :*\n\n${reply}\n\n⚠️ _Ces informations ne remplacent pas un avis médical professionnel._`)
        }, { quoted: message });

    } catch (error) {
        await _handleGeminiError(client, remoteJid, message, error);
    }
}

// ══════════════════════════════════════════════
//   🍽️ COMMANDE: .recette — Recettes de cuisine
// ══════════════════════════════════════════════
export async function recetteCommand(client, message) {
    const remoteJid = message.key?.remoteJid;
    const text = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
    const args = text.split(' ').slice(1).join(' ').trim();

    if (!args) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Exemple: .recette poulet yassa sénégalais')
        }, { quoted: message });
    }

    await client.sendMessage(remoteJid, {
        react: { text: '🍽️', key: message.key }
    });

    try {
        const prompt = `Tu es un chef cuisinier expert. Donne une recette complète et détaillée en français pour : ${args}\n\nInclus: Ingrédients (avec quantités), Étapes de préparation numérotées, Temps de cuisson, Conseils du chef.`;
        const { text: reply } = await callGemini(prompt);

        await client.sendMessage(remoteJid, {
            text: stylizedChar(`🍽️ *Recette IA :*\n\n${reply}`)
        }, { quoted: message });

    } catch (error) {
        await _handleGeminiError(client, remoteJid, message, error);
    }
}

// ══════════════════════════════════════════════
//   🗣️ COMMANDE: .debat — Débat argumenté
// ══════════════════════════════════════════════
export async function debatCommand(client, message) {
    const remoteJid = message.key?.remoteJid;
    const text = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
    const args = text.split(' ').slice(1).join(' ').trim();

    if (!args) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Exemple: .debat les réseaux sociaux font plus de mal que de bien')
        }, { quoted: message });
    }

    await client.sendMessage(remoteJid, {
        react: { text: '🗣️', key: message.key }
    });

    try {
        const prompt = `Tu es un expert en argumentation. Présente un débat équilibré en français sur : ${args}\n\nStructure:\n✅ Arguments POUR (3 arguments solides)\n❌ Arguments CONTRE (3 arguments solides)\n⚖️ Conclusion nuancée`;
        const { text: reply } = await callGemini(prompt);

        await client.sendMessage(remoteJid, {
            text: stylizedChar(`🗣️ *Débat IA :*\n\n${reply}`)
        }, { quoted: message });

    } catch (error) {
        await _handleGeminiError(client, remoteJid, message, error);
    }
}

// ══════════════════════════════════════════════
//   🔧 GESTION ERREURS CENTRALISÉE
// ══════════════════════════════════════════════
async function _handleGeminiError(client, remoteJid, message, error) {
    console.error('[GEMINI] Erreur:', error.message);

    const status = error?.response?.status;
    let errMsg = '❌ Erreur IA inconnue.';

    if (status === 403) errMsg = '❌ Clé API Gemini invalide ou expirée !';
    else if (status === 429) errMsg = '⏳ Limite de requêtes atteinte. Attends 1 minute.';
    else if (error.message.includes('indisponibles')) errMsg = '❌ Tous les modèles Gemini sont indisponibles. Réessaie plus tard.';
    else if (error.code === 'ECONNABORTED') errMsg = '⏰ Délai dépassé. Réessaie avec une question plus courte.';

    await client.sendMessage(remoteJid, {
        text: stylizedChar(errMsg)
    }, { quoted: message });
}

// ══════════════════════════════════════════════
//   📦 EXPORT PAR DÉFAUT — .gemini commande
// ══════════════════════════════════════════════
export default geminiCommand;
