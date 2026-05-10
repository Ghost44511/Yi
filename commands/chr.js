export default async function bb(client, message) {

    const replies = [

        "",

        "> *OUI LOSER 🐸*",

        "> *YO QUOO DE NEUF 🍉*",

        "> *OUI PERVERS 🍒*"

    ];

    const randomReply = replies[Math.floor(Math.random() * replies.length)];

    await client.sendMessage(message.key.remoteJid, {

        text: randomReply

    });

}