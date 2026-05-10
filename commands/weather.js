import axios from 'axios'
import stylizedChar from '../utils/fancy.js'

export default async function weather2(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const city = text.split(' ').slice(1).join(' ')

    if (!city) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Exemple: .weather2 Paris')
        }, { quoted: message })
    }

    try {
        // API OpenWeatherMap (gratuite)
        const apiKey = 'VOTRE_API_KEY' // Remplace avec ta clé
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`
        )

        const data = response.data
        const weather = data.weather[0]
        
        const messageText = `🌍 *Météo à ${data.name}, ${data.sys.country}*

🌡️ Température: ${data.main.temp}°C
🤒 Ressenti: ${data.main.feels_like}°C
☁️ Condition: ${weather.description}
💧 Humidité: ${data.main.humidity}%
🌬️ Vent: ${data.wind.speed} m/s
📊 Pression: ${data.main.pressure} hPa
👁️ Visibilité: ${data.visibility / 1000} km

📍 Coordonnées: ${data.coord.lat}, ${data.coord.lon}`

        await client.sendMessage(remoteJid, {
            text: stylizedChar(messageText)
        }, { quoted: message })

    } catch (error) {
        if (error.response?.status === 404) {
            await client.sendMessage(remoteJid, {
                text: stylizedChar('❌ Ville non trouvée')
            }, { quoted: message })
        } else {
            console.error('Weather error:', error)
            await client.sendMessage(remoteJid, {
                text: stylizedChar('❌ Erreur météo')
            }, { quoted: message })
        }
    }
}