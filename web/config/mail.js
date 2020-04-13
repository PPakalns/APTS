'use strict'

const Env = use('Env')

module.exports = {
  /*
  |--------------------------------------------------------------------------
  | Connection
  |--------------------------------------------------------------------------
  |
  | Connection to be used for sending emails. Each connection needs to
  | define a driver too.
  |
  */
  connection: Env.get('MAIL_CONNECTION', 'smtp'),

  /*
  |--------------------------------------------------------------------------
  | SMTP
  |--------------------------------------------------------------------------
  |
  | Here we define configuration for sending emails via SMTP.
  |
  */
  smtp: {
    driver: 'smtp',
    pool: true,
    port: Env.get('MAIL_PORT'),
    host: Env.get('MAIL_HOST'),
    secure: Env.get('MAIL_SECURE', "true") === "true",
    auth: null,
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 10,
    name: "apts.lv",
    dkim: {
      domainName: "apts.lv",
      keySelector: "main",
      privateKey: Env.get('DKIM_PRIVATE_KEY'),
    }
  },

  /*
  |--------------------------------------------------------------------------
  | SparkPost
  |--------------------------------------------------------------------------
  |
  | Here we define configuration for spark post. Extra options can be defined
  | inside the `extra` object.
  |
  | https://developer.sparkpost.com/api/transmissions.html#header-options-attributes
  |
  | extras: {
  |   campaign_id: 'sparkpost campaign id',
  |   options: { // sparkpost options }
  | }
  |
  */
  sparkpost: {
    driver: 'sparkpost',
    apiKey: Env.get('SPARKPOST_API_KEY'),
    extras: {}
  },

  /*
  |--------------------------------------------------------------------------
  | Mailgun
  |--------------------------------------------------------------------------
  |
  | Here we define configuration for mailgun. Extra options can be defined
  | inside the `extra` object.
  |
  | https://mailgun-documentation.readthedocs.io/en/latest/api-sending.html#sending
  |
  | extras: {
  |   'o:tag': '',
  |   'o:campaign': '',,
  |   . . .
  | }
  |
  */
  mailgun: {
    driver: 'mailgun',
    domain: Env.get('MAILGUN_DOMAIN'),
    apiKey: Env.get('MAILGUN_API_KEY'),
    extras: {}
  }
}
