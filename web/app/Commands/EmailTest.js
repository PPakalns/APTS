'use strict'

const Command = use('Command')
const Mail = use('Mail')

class EmailTest extends Command {

    get signature () {
        return 'emailtest {to} {from} {message}'
    }

    get description () {
        return 'Function to send test email'
    }

    * handle (args, options) {
        yield Mail.send('emails.test', args, message => {
            message.from(args.from, 'APTS')
            message.to(args.to, 'USER')
            message.subject('APTS test')
        })
        return
    }

}

module.exports = EmailTest
