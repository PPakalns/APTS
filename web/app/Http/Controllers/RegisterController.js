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

const WAIT_TIME = 30 * 60 * 1000;

class RegisterController {

    * index(req, res) {
        yield res.sendView('register');
    }

    * register(req, res) {
        const userData = req.only('email', 'email_confirm')

        // normalize email addresses
        userData.email = Validator.sanitizor.normalizeEmail(userData.email || "", ['!rd'])
        userData.email_confirm = Validator.sanitizor.normalizeEmail(userData.email_confirm || "", ['!rd'])

        const validation = yield Validator.validate(userData, User.registration_rules(), User.registration_messages)

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

        let user = yield RegisterController.new_user(userData.email)

        let message = {msg: Antl.formatMessage('messages.registration_successfull', {email: user.email})}
        yield req.with({successes:[message]}).flash()
        res.route('home')
    }


    // Password reset email request form
    * resend_password(req, res)
    {
        yield res.sendView('user/request_email',
            {
                action: "RegisterController.resend_password_post",
                header: "Pieteikt aizmirstu paroli",
                lead: "Uz epastu tiks nosūtīta saite ar paroles nomaiņas formu."
            }
        );
    }

    * resend_password_post(req, res)
    {
        let errors = []
        let user = null
        const userData = req.only('email', 'email_confirm')

        const validation = yield Validator.validate(userData, User.registration_rules(false), User.registration_messages)
        if (validation.fails())
        {
            errors = errors.concat(validation.messages())
        }

        yield validate_reCAPTCHA(errors, req.input('g-recaptcha-response'))

        if (errors.length == 0)
        {
            user = yield User.findBy('email', userData.email)
            if (!user || !user.activated)
            {
                errors.push({msg:"Lietotājs nav reģistrējies sistēmā!"})
            }
            else
            {
                if (user.password_reset_time)
                {
                    let diff = (new Date()) - Date.parse(user.password_reset_time);
                    if ( diff < WAIT_TIME )
                    {
                        diff = WAIT_TIME - diff;
                        errors.push({msg: "Paroles maiņas epastu varēs izsūtīt atkārtoti tikai pēc "+Math.ceil(diff/60000.0)+" minūtēm." })
                    }
                }
            }
        }

        if (errors.length > 0)
        {
            yield req.withOnly('email').andWith({errors:errors}).flash()
            res.redirect('back')
            return
        }

        let key = String(Token(LEN_KEY))

        user.password_reset_hash = yield Hash.make(key, 5)
        user.password_reset_time = (new Date()).toISOString()
        yield user.save()

        console.log("Passowrd reset email sent to ", user.email)
        yield Mail.send('emails.passwordReset', {base: BASE, email: user.email, token: user.token, key: key}, message => {
            message.from(FROM_EMAIL, FROM_NAME)
            message.to(user.email)
            message.subject(Antl.formatMessage('messages.password_reset_subject'))
        })

        let message = {msg: Antl.formatMessage('messages.password_reset_successful', {email: userData.email})}
        yield req.with({successes:[message]}).flash()
        res.route('home')

    }


    * reset_password(req, res)
    {
        const key = req.param('key')
        const token = req.param('token')
        const user = yield User.findBy('token', token)
        if (!user)
        {
            yield req.with({errors: [{msg: "Diemžēl atvērtā saite bija kļūdaina, pārbaudiet vai saiti atvērāt pareizi."}]}).flash()
            res.route('home')
            return
        }
        yield res.sendView('user/respond_email', {
            email: user.email, key: key, token: token,
            header: "Paroles maiņa",
            action: "RegisterController.reset_password_post",
            submit_button: "Nomainīt paroli"
        });
    }


    * reset_password_post(req, res)
    {
        const userData = req.only('pass', 'pass_confirm', 'key', 'token')

        let errors = []
        let user = null

        const validation = yield Validator.validate(userData, User.activation_rules, User.activation_messages)
        if (validation.fails())
        {
            errors = errors.concat(validation.messages())
        }

        yield validate_reCAPTCHA(errors, req.input('g-recaptcha-response'))

        // PAPILDUS VALIDĀCIJAS SOĻI
        if (errors.length == 0)
        {
            user = yield User.findBy('token', userData.token)
            if (user == null || user.activated==false || !user.password_reset_hash)
            {
                errors.push({msg: "Atvērtā saite ir kļūdaina vai novecojusi, mēģiniet vēlreiz."})
            }
            else if (!(yield Hash.verify(userData.key || "", user.password_reset_hash)))
            {
                errors.push({msg: "Kļūda, aktivizācijas saite nav pareiza. Pārbaudiet vai atvērāt jaunāko saiti pareizi."})
            }
            else if (user.password_reset_time)
            {
                let diff = (new Date()) - Date.parse(user.password_reset_time);
                if ( diff > 2*WAIT_TIME )
                {
                    errors.push({msg: "Paroles maiņas saite ir novecojusi. Lūdzu piesakiet aizmirstu paroli vēlreiz." })
                }
            }
        }

        if (errors.length > 0)
        {
            yield req.with({errors: errors}).flash()
            res.redirect('back')
            return
        }

        user.password = yield Hash.make(userData.pass)
        user.password_reset_hash = null
        // user.password_reset_time = null // Because potentially user could spam multiple times with password reset
        yield user.save()

        let message = {msg: Antl.formatMessage('messages.password_changed_successfully', {email: user.email})}
        yield req.with({successes:[message]}).flash()
        res.route('login')
    }


    * resend_registration(req, res)
    {
        yield res.sendView('user/request_email',
            {
                action: "RegisterController.resend_registration_post",
                header: "Ŗeģistrācijas epasta atkārtota izsūtīšana",
                lead: "Reģistrācijas epastu lietotājam var izsūtīt maksimums vienu reizi 30 minūtēs."            }
        );
    }

    * resend_registration_post(req, res)
    {
        let errors = []
        let user = null
        const userData = req.only('email', 'email_confirm')

        const validation = yield Validator.validate(userData, User.registration_rules(false), User.registration_messages)
        if (validation.fails())
        {
            errors = errors.concat(validation.messages())
        }

        yield validate_reCAPTCHA(errors, req.input('g-recaptcha-response'))

        if (errors.length == 0)
        {
            user = yield User.findBy('email', userData.email)
            if (!user || user.activated)
            {
                errors.push({msg:"Lietotājs jau ir apstiprinājis reģistrācijas epastu vai nav reģistrējies sistēmā!"})
            }
            else
            {
                let diff = (new Date()) - Date.parse(user.email_change_time);
                if ( diff < WAIT_TIME )
                {
                    diff = WAIT_TIME - diff;
                    errors.push({msg: "Reģistrācijas epastu varēs izsūtīt atkārtoti pēc "+Math.ceil(diff/60000.0)+" minūtēm." })
                }
            }
        }

        if (errors.length > 0)
        {
            yield req.withOnly('email').andWith({errors:errors}).flash()
            res.redirect('back')
            return
        }

        let key = String(Token(LEN_KEY))

        user.email_change_hash = yield Hash.make(key, 5)
        user.email_change_time = (new Date()).toISOString()
        yield user.save()

        console.log("Registration email resended to ", user.email)
        yield Mail.send('emails.registration', {base: BASE, email: user.email, token: user.token, key: key}, message => {
            message.from(FROM_EMAIL, FROM_NAME)
            message.to(user.email)
            message.subject(Antl.formatMessage('messages.registration_email_subject'))
        })

        let message = {msg: Antl.formatMessage('messages.resend_successfull', {email: userData.email})}
        yield req.with({successes:[message]}).flash()
        res.route('home')
    }

    * activate(req, res)
    {
        const key = req.param('key')
        const token = req.param('token')
        const user = yield User.findBy('token', token)
        if (!user || user.activated==true)
        {
            yield req.with({errors: [{msg: "Lietotāju nevar aktivizēt."}]}).flash()
            res.route('home')
            return
        }
        yield res.sendView('user/respond_email', {
            email: user.email, key: key, token: token,
            header: "Lietotāja reģistrācija",
            action: "RegisterController.activate_post",
            submit_button: "Pabeigt reģistrāciju"
        });
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

        yield validate_reCAPTCHA(errors, req.input('g-recaptcha-response'))

        // PAPILDUS VALIDĀCIJAS SOĻI
        if (errors.length == 0)
        {
            user = yield User.findBy('token', userData.token)
            if (user == null)
            {
                errors.push({msg: "Atvērtā saite ir kļūdaina vai novecojusi, mēģiniet vēlreiz."})
            }
            else if (user.activated == true)
            {
                errors.push({msg: "Lietotājs jau ir pabeidzis reģistrāciju"})
            }
            else if (!(yield Hash.verify(userData.key || "", user.email_change_hash)))
            {
                errors.push({msg: "Kļūda, aktivizācijas saite nav pareiza. Pārbaudiet vai atvērāt jaunāko saiti pareizi."})
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



    // Helper functions

    static * new_user(email){
        let token = String(Token(LEN_TOKEN))
        let key = String(Token(LEN_KEY))

        let user = new User()
        user.email = email.trim()
        user.token = token
        user.activated = false
        user.email_change_hash = yield Hash.make(key, 5)
        user.email_change_time = (new Date()).toISOString()
        yield user.save()

        yield Mail.send('emails.registration', {base: BASE, email: user.email, token: token, key: key}, message => {
            message.from(FROM_EMAIL, FROM_NAME)
            message.to(user.email)
            message.subject(Antl.formatMessage('messages.registration_email_subject'))
        })

        return user
    }
}

function * validate_reCAPTCHA(errors, recaptcha_key)
{
    try{
        yield reCAPTCHA.validate(recaptcha_key)
    }catch(err){
        console.log(reCAPTCHA.translateErrors(err));
        errors.push({msg:"Nepareizi aizpildīts reCAPTCHA tests. Mēģiniet vēlreiz."})
    }
}

module.exports = RegisterController
