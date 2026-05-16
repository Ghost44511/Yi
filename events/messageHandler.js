import configmanager from "../utils/configmanager.js"
import fs from 'fs/promises'
import group from '../commands/group.js'
import block from '../commands/block.js'
import viewonce from '../commands/viewonce.js'
import tiktok from '../commands/tiktok.js'
import play from '../commands/play.js'
import sudo from '../commands/sudo.js'
import tag from '../commands/tag.js'
import take from '../commands/take.js'
import sticker from '../commands/sticker.js'
import img from '../commands/img.js'
import url from '../commands/url.js'
import sender from '../commands/sender.js'
import fuck from '../commands/fuck.js'
import bug from '../commands/bug.js'
import dlt from '../commands/dlt.js'
import save from '../commands/save.js'
import pp from '../commands/pp.js'
import premiums from '../commands/premiums.js'
import reactions from '../commands/reactions.js'
import media from '../commands/media.js'
import set from '../commands/set.js'
import fancy from '../commands/fancy.js'
import react from "../utils/react.js"
import info from "../commands/menu.js"
import { pingTest } from "../commands/ping.js"
import auto from '../commands/auto.js'
import uptime from '../commands/uptime.js'
import ai from '../commands/ai.js'
import gpt from '../commands/gpt.js'
import insult from '../commands/insult.js'
import chr from '../commands/chr.js'
import mute2 from '../commands/mute2.js'
import unmute2 from '../commands/unmute2.js'
import owner from '../commands/owner.js'
import save2 from '../commands/save2.js'
import weather from '../commands/weather.js'
import gpt2 from '../commands/gpt2.js'
import welcome2 from '../commands/welcome2.js'
import poll from '../commands/poll.js'
import quote from '../commands/quote.js'
import google from '../commands/google.js'
import gemini, {
    geminiCommand,
    redigeCommand,
    codeCommand,
    traduisCommand,
    resumeCommand,
    histoireCommand,
    ideeCommand,
    analyseCommand,
    calculCommand,
    lyricsAICommand,
    santeCommand,
    recetteCommand,
    debatCommand
} from '../commands/gemini.js'
import kick2 from '../commands/kick2.js'
import checkban, { banFilter, ban, unban, tempban, banlist, baninfo } from '../commands/checkban.js'
import groupstatut from '../commands/groupstatut.js'
// ✅ NOUVEAUX IMPORTS — Anti-Spam + Signalement
import antispam, { antiSpamMiddleware } from '../commands/antispam.js'
import signaler from '../commands/signaler.js'

async function handleIncomingMessage(client, event) {
    let lid = client?.user?.lid?.split(':')[0] + '@lid'
    const number = client.user.id.split(':')[0]
    const messages = event.messages
    const publicMode = configmanager.config.users[number]?.publicMode
    const prefix = configmanager.config.users[number]?.prefix || '.'

    // Récupérer la liste premium
    const premium = Object.keys(configmanager.premiums?.premiumUser || {})

    for (const message of messages) {
      try {
        // ── Sécurité clé message ──
        if (!message?.key || !message?.message) continue

        // ── Filtre ban ──
        const isAllowed = await banFilter(client, message)
        if (!isAllowed) continue

        // ── 🛡️ Anti-spam ──
        const isSpam = await antiSpamMiddleware(client, message)
        if (isSpam) continue

        const messageBody = (
            message.message?.extendedTextMessage?.text ||
            message.message?.conversation || ''
        ).toLowerCase()

        const remoteJid = message.key?.remoteJid
        const approvedUsers = configmanager.config.users[number]?.sudoList || []

        if (!messageBody || !remoteJid) continue

        console.log('📨 Message:', messageBody.substring(0, 50))

        auto.autotype(client, message)
        auto.autorecord(client, message)
        tag.respond(client, message)

        reactions.auto(
            client,
            message,
            configmanager.config.users[number]?.autoreact,
            configmanager.config.users[number]?.emoji
        )

        if (
            messageBody.startsWith(prefix) &&
            (
                publicMode ||
                message.key.fromMe ||
                approvedUsers.includes(message.key?.participant || message.key?.remoteJid) ||
                lid.includes(message.key?.participant || message.key?.remoteJid)
            )
        ) {
            const commandAndArgs = messageBody.slice(prefix.length).trim()
            const parts = commandAndArgs.split(/\s+/)
            const command = parts[0]

            switch (command) {

                // ── 🛡️ Anti-Spam ──
                case 'antispam':
                    await react(client, message)
                    await antispam(client, message)
                    break

                // ── 🚨 Signalement ──
                case 'signaler':
                    await react(client, message)
                    await signaler(client, message)
                    break

                case 'uptime':
                    await react(client, message)
                    await uptime(client, message)
                    break

                case 'ai':
                    await react(client, message)
                    await ai(client, message)
                    break

                case 'gpt':
                    await react(client, message)
                    await gpt(client, message)
                    break

                case 'gpt2':
                    await react(client, message)
                    await gpt2(client, message)
                    break

                case 'insult':
                    await react(client, message)
                    await insult(client, message)
                    break

                case 'chr':
                    await react(client, message)
                    await chr(client, message)
                    break

                case 'mute2':
                    await react(client, message)
                    await mute2(client, message)
                    break

                case 'unmute2':
                    await react(client, message)
                    await unmute2(client, message)
                    break

                case 'owner':
                    await react(client, message)
                    await owner(client, message)
                    break

                case 'save2':
                    await save2(client, message)
                    break

                case 'weather':
                    await react(client, message)
                    await weather(client, message)
                    break

                case 'welcome2':
                    await react(client, message)
                    await welcome2(client, message)
                    break

                case 'poll':
                    await react(client, message)
                    await poll(client, message)
                    break

                case 'quote':
                    await react(client, message)
                    await quote(client, message)
                    break

                case 'google':
                    await react(client, message)
                    await google(client, message)
                    break

                // ══════════════════════════════════════
                //   🧠 COMMANDES GEMINI AI — PRINCE K
                // ══════════════════════════════════════
                case 'gemini':
                    await geminiCommand(client, message)
                    break

                case 'redige':
                    await redigeCommand(client, message)
                    break

                case 'code':
                    await codeCommand(client, message)
                    break

                case 'traduis':
                    await traduisCommand(client, message)
                    break

                case 'resume':
                    await resumeCommand(client, message)
                    break

                case 'histoire':
                    await histoireCommand(client, message)
                    break

                case 'idee':
                    await ideeCommand(client, message)
                    break

                case 'analyse':
                    await analyseCommand(client, message)
                    break

                case 'calcul':
                    await calculCommand(client, message)
                    break

                case 'lyricsai':
                    await lyricsAICommand(client, message)
                    break

                case 'sante':
                    await santeCommand(client, message)
                    break

                case 'recette':
                    await recetteCommand(client, message)
                    break

                case 'debat':
                    await debatCommand(client, message)
                    break

                case 'kick2':
                    await react(client, message)
                    await kick2(client, message)
                    break

                case 'checkban':
                    await react(client, message)
                    await checkban(client, message)
                    break

                case 'ban':
                    await react(client, message)
                    await ban(client, message)
                    break

                case 'unban':
                    await react(client, message)
                    await unban(client, message)
                    break

                case 'tempban':
                    await react(client, message)
                    await tempban(client, message)
                    break

                case 'banlist':
                    await react(client, message)
                    await banlist(client, message)
                    break

                case 'baninfo':
                    await react(client, message)
                    await baninfo(client, message)
                    break

                case 'groupstatut':
                    await react(client, message)
                    await groupstatut(client, message)
                    break

                case 'ping':
                    await react(client, message)
                    await pingTest(client, message)
                    break

                case 'menu':
                    await react(client, message)
                    await info(client, message)
                    break

                case 'fancy':
                    await react(client, message)
                    await fancy(client, message)
                    break

                case 'setpp':
                    await react(client, message)
                    await pp.setpp(client, message)
                    break

                case 'getpp':
                    await react(client, message)
                    await pp.getpp(client, message)
                    break

                case 'sudo':
                    await react(client, message)
                    await sudo.sudo(client, message, approvedUsers)
                    configmanager.save()
                    break

                case 'delsudo':
                    await react(client, message)
                    await sudo.delsudo(client, message, approvedUsers)
                    configmanager.save()
                    break

                case 'public':
                    await react(client, message)
                    await set.isPublic(message, client)
                    break

                case 'setprefix':
                    await react(client, message)
                    await set.setprefix(message, client)
                    break

                case 'autotype':
                    await react(client, message)
                    await set.setautotype(message, client)
                    break

                case 'autorecord':
                    await react(client, message)
                    await set.setautorecord(message, client)
                    break

                case 'welcome':
                    await react(client, message)
                    await set.setwelcome(message, client)
                    break

                case 'photo':
                    await react(client, message)
                    await media.photo(client, message)
                    break

                case 'toaudio':
                    await react(client, message)
                    await media.tomp3(client, message)
                    break

                case 'sticker':
                    await react(client, message)
                    await sticker(client, message)
                    break

                case 'play':
                    await react(client, message)
                    await play(message, client)
                    break

                case 'img':
                    await react(client, message)
                    await img(message, client)
                    break

                case 'vv':
                    await react(client, message)
                    await viewonce(client, message)
                    break

                case 'save':
                    await react(client, message)
                    await save(client, message)
                    break

                case 'tiktok':
                    await react(client, message)
                    await tiktok(client, message)
                    break

                case 'url':
                    await react(client, message)
                    await url(client, message)
                    break

                case 'tag':
                    await react(client, message)
                    await tag.tag(client, message)
                    break

                case 'tagall':
                    await react(client, message)
                    await tag.tagall(client, message)
                    break

                case 'tagadmin':
                    await react(client, message)
                    await tag.tagadmin(client, message)
                    break

                case 'kick':
                    await react(client, message)
                    await group.kick(client, message)
                    break

                case 'kickall':
                    await react(client, message)
                    await group.kickall(client, message)
                    break

                case 'kickall2':
                    await react(client, message)
                    await group.kickall2(client, message)
                    break

                case 'promote':
                    await react(client, message)
                    await group.promote(client, message)
                    break

                case 'demote':
                    await react(client, message)
                    await group.demote(client, message)
                    break

                case 'promoteall':
                    await react(client, message)
                    await group.pall(client, message)
                    break

                case 'demoteall':
                    await react(client, message)
                    await group.dall(client, message)
                    break

                case 'mute':
                    await react(client, message)
                    await group.mute(client, message)
                    break

                case 'unmute':
                    await react(client, message)
                    await group.unmute(client, message)
                    break

                case 'gclink':
                    await react(client, message)
                    await group.gclink(client, message)
                    break

                case 'antilink':
                    await react(client, message)
                    await group.antilink(client, message)
                    break

                case 'bye':
                    await react(client, message)
                    await group.bye(client, message)
                    break

                case 'block':
                    await react(client, message)
                    await block.block(client, message)
                    break

                case 'unblock':
                    await react(client, message)
                    await block.unblock(client, message)
                    break

                case 'close':
                    await react(client, message)
                    await bug(client, message, "🚫 Bot closing...", 3)
                    break

                case 'fuck':
                    await react(client, message)
                    await fuck(client, message)
                    break

                case 'addprem':
                    await react(client, message)
                    await premiums.addprem(client, message)
                    configmanager.saveP()
                    break

                case 'delprem':
                    await react(client, message)
                    await premiums.delprem(client, message)
                    configmanager.saveP()
                    break

                case 'test':
                    await react(client, message)
                    break

                case 'join':
                    await react(client, message)
                    await group.setJoin(client, message)
                    break

                case 'auto-promote':
                    await react(client, message)
                    if (premium.includes(number + "@s.whatsapp.net")) {
                        await group.autoPromote(client, message)
                    } else {
                        await bug(client, message, "command only for premium users.", 3)
                    }
                    break

                case 'auto-demote':
                    await react(client, message)
                    if (premium.includes(number + "@s.whatsapp.net")) {
                        await group.autoDemote(client, message)
                    } else {
                        await bug(client, message, "command only for premium users.", 3)
                    }
                    break

                case 'auto-left':
                    await react(client, message)
                    if (premium.includes(number + "@s.whatsapp.net")) {
                        await group.autoLeft(client, message)
                    } else {
                        await bug(client, message, "command only for premium users.", 3)
                    }
                    break
            }
        }

        await group.linkDetection(client, message)

      } catch (msgErr) {
        console.error('❌ [Handler] Erreur message:', msgErr.message)
      }
    }
}

export default handleIncomingMessage
