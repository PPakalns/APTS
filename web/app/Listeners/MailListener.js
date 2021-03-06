'use strict'

const Event = use('Event')
const Mail = use('Mail')
const Env = use('Env')
const antl = use('Antl')

const FROM_EMAIL = Env.get('FROM_EMAIL')
const DOMAIN = Env.get('DOMAIN')

class MailListener {
  async newUser ({ user, key }) {
    console.log("Sending a signup email to ", user.email)
    await Mail.send('email.signup', {DOMAIN, user: user.toJSON(), key, antl}, (message) => {
      message
        .from(FROM_EMAIL)
        .to(user.email)
        .subject(antl.formatMessage('main.activation_email_subject'))
    })
  }

  async resetPassword ({ user, key }) {
    console.log("Sending a password reset email to ", user.email)
    await Mail.send('email.change_password', {DOMAIN, user: user.toJSON(), key, antl}, (message) => {
      message
        .from(FROM_EMAIL)
        .to(user.email)
        .subject(antl.formatMessage('main.change_password_email_subject'))
    })
  }
}

module.exports = MailListener
