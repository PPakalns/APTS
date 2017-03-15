'use strict'

const ServiceProvider = require('adonis-fold').ServiceProvider
const reCAPTCHA = require('recaptcha2')

let recaptcha = null

class Recaptcha2Provider extends ServiceProvider {

    * register () {
        this.app.bind('Adonis/reCAPTCHA', function (app) {
            recaptcha = new reCAPTCHA({
                siteKey: process.env.reCAPTCHA_SITE_KEY,
                secretKey: process.env.reCAPTCHA_SECRET_KEY,
                ssl: true
            })
            return recaptcha
        })
    }
}
module.exports = Recaptcha2Provider
