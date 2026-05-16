import readline from 'readline'

export default async function deployAsPremium() {
    const key = "D07895461fdgdrq3ez8aaeqQ"

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    return new Promise((resolve) => {
        rl.question(' Do you have password for an admin Purchase? y/n ?', (response) => {
            response = response.toLowerCase()
            rl.close()

            if (response === 'y') {
                const rl2 = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout,
                })
                rl2.question('Please type the password here: ', (password) => {
                    rl2.close()
                    if (password === key) {
                        console.log('✅ Success')
                        resolve(true)
                    } else {
                        console.log('❌ Wrong password')
                        resolve(false)
                    }
                })
            } else if (response === 'n') {
                rl.close()
                resolve(false)
            } else {
                console.log('⚠️ You will log without any privileges. Restart if you have a premium passkey.')
                resolve(false)
            }
        })
    })
}
