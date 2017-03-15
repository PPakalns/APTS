'use strict'

const Validator = use('Validator')
const User = use('App/Model/User')
const reCAPTCHA = use('reCAPTCHA')
const Antl = use('Antl')
const Hash = use('Hash')
const Env = use('Env')
const Mail = use('Mail')

const FROM_EMAIL = Env.get('FROM_EMAIL')
const FROM_NAME = Env.get('FROM_NAME')

// Generate tokens for email addresses
const Token = require('rand-token').generate;
const LEN_UID = 48;

class RegisterController {

    * index(req, res) {
        yield res.sendView('register');
    }

    * register(req, res) {
        const userData = req.only('email', 'email_confirm')

        const validation = yield Validator.validate(userData, User.registration_rules, User.registration_messages)

        if (validation.fails())
        {
            yield req.withOnly('email').andWith({errors: validation.messages() }).flash()
            res.redirect('back')
            return
        }

        const recaptcha_key = req.input('g-recaptcha-response');

        try{
            // yield reCAPTCHA.validate(recaptcha_key)
        }catch(err){
            console.log(reCAPTCHA.translateErrors(err));
            yield req.with({errors:[{msg:"Nepareizi aizpildīts reCAPTCHA tests. Mēģiniet vēlreiz."}]}).flash()
            res.redirect('back')
            return
        }

        let token = String(Token(LEN_UID))
        console.log(token)

        let user = new User()
        user.email = userData.email
        user.activated = false
        user.email_change_hash = yield Hash.make(token, 5)
        yield user.save()

        yield Mail.send('emails.registration', {email: userData.email, token: token}, message => {
            message.from(FROM_EMAIL, FROM_NAME)
            message.to(userData.email)
            message.subject(Antl.formatMessage('messages.registration_email_subject'))
        })

        let message = {msg: Antl.formatMessage('messages.registration_successfull', {email: userData.email})}
        yield req.with({successes:[message]}).flash()
        res.route('home')
    }

    * activate(req, res)
    {
        console.log(req.all())
        console.log("====")
        console.log(req.get())
        yield res.sendView('register');
    }
}

module.exports = RegisterController
