import stylizedChar from "../utils/fancy.js";

async function sender(message, client, texts) {

    const remoteJid = message?.key?.remoteJid;

    try {
        await client.sendMessage(remoteJid, {

            text: stylizedChar(`> _*${texts}*_\n\n🔗 Rejoins ma chaîne : https://whatsapp.com/channel/0029VbC8KUk2kNFp2Fb0bF3J`),
    
        });
    } catch (e) {
        console.log(e)
        return;
    }

   
}

//237650554606@s.whatsapp.net

export default sender;