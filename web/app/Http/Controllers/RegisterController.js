'use strict'

const Validator = use('Validator')
const User = use('App/Model/User')
const reCAPTCHA = use('reCAPTCHA')
const Antl = use('Antl')
const Hash = use('Hash')
const Env = use('Env')
const Mail = use('Mail')

const BASE = Env.get('BASE')
const FROM_EMAIL = Env.get('FROM_EMAIL')
const FROM_NAME = Env.get('FROM_NAME')

// Generate tokens for email addresses
const Token = require('rand-token').generate;
const LEN_TOKEN = 24;
const LEN_KEY = 48;

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
            yield reCAPTCHA.validate(recaptcha_key)
        }catch(err){
            console.log(reCAPTCHA.translateErrors(err));
            yield req.withOnly('email').andWith({errors:[{msg:"Nepareizi aizpildīts reCAPTCHA tests. Mēģiniet vēlreiz."}]}).flash()
            res.redirect('back')
            return
        }

        let token = String(Token(LEN_TOKEN))
        let key = String(Token(LEN_KEY))

        let user = new User()
        user.email = userData.email
        user.token = token
        user.activated = false
        user.email_change_hash = yield Hash.make(key, 5)
        user.email_change_time = new Date()
        yield user.save()

        yield Mail.send('emails.registration', {base: BASE, email: userData.email, token: token, key: key}, message => {
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
        const key = req.param('key')
        const token = req.param('token')
        const user = yield User.findBy('token', token)
        console.log(key, token, user)
        if (!user || user.activated==true)
        {
            yield req.with({errors: [{msg: "Lietotāju nevar aktivizēt."}]}).flash()
            res.route('home')
            return
        }
        yield res.sendView('user/activate', {email: user.email, key: key, token: token});
    }


    * activate_post(req, res)
    {
        const userData = req.only('pass', 'pass_confirm', 'key', 'token')

        let errors = []
        let user = null

        const validation = yield Validator.validate(userData, User.activation_rules, User.activation_messages)
        if (validation.fails())
        {
            errors = errors.concat(validation.messages())
        }

        const recaptcha_key = req.input('g-recaptcha-response');

        try{
            yield reCAPTCHA.validate(recaptcha_key)
        }catch(err){
            console.log(reCAPTCHA.translateErrors(err));
            errors.push({msg:"Nepareizi aizpildīts reCAPTCHA tests. Mēģiniet vēlreiz."})
        }

        // PAPILDUS VALIDĀCIJAS SOĻI
        if (errors.length == 0)
        {
            user = yield User.findBy('token', userData.token)
            if (user == null)
            {
                errors.push({msg: "Lietotājs ar norādīto epasta adresi nav atrasts"})
            }
            else if (user.activated == true)
            {
                errors.push({msg: "Lietotājs jau ir pabeidzis reģistrāciju"})
            }
            else if (!(yield Hash.verify(userData.key || "", user.email_change_hash)))
            {
                errors.push({msg: "Kļūda, pārbaudiet vai lietotāja aktivizācijas linku atvērāt pareizi."})
            }
        }

        if (errors.length > 0)
        {
            yield req.with({errors: errors}).flash()
            res.redirect('back')
            return
        }

        user.password = yield Hash.make(userData.pass)
        user.activated = true
        user.email_change_hash = null
        user.email_change_time = null
        yield user.save()

        let message = {msg: Antl.formatMessage('messages.activation_successfull', {email: user.email})}
        yield req.with({successes:[message]}).flash()
        res.route('login')
    }
}

module.exports = RegisterController
