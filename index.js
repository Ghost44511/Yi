import connectToWhatsapp from './Hub/shadow.js'
import handleIncomingMessage from './events/messageHandler.js'

(async () => {
  try {
    await connectToWhatsapp(handleIncomingMessage)
    console.log('✅ Bot established!')
  } catch (err) {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  }
})()
