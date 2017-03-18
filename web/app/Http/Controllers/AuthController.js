'use strict'

const User = use('App/Model/User')
const Hash = use('Hash')
const Validator = use('Validator')
const reCAPTCHA = use('reCAPTCHA')

class AuthController {

    * index(request, response) {
        yield response.sendView('login');
    }

    * login(req, res) {

        let errors = []
        let ewith = {}

        const FAILED_LOGINS = 5
        const email = req.input('email')
        const password = req.input('password')

        let user = yield User.findBy('email', email)

        if (!user || !user.activated)
        {
            errors.push({message: "Autentifikācija bija neveiksmīga!"})
        }

        if (user && user.failed_login > FAILED_LOGINS)
        {
            const recaptcha_key = req.input('g-recaptcha-response');

            try{
                yield reCAPTCHA.validate(recaptcha_key)
            }catch(err){
                console.log(reCAPTCHA.translateErrors(err));
                errors.push({msg:"Nepareizi aizpildīts reCAPTCHA tests. Mēģiniet vēlreiz."})
            }
        }

        if (errors.length == 0)
        {
            try {
                yield req.auth.attempt(email, password)
            } catch (e) {
                errors.push({message: "Autentifikācija bija neveiksmīga!"})
            }
        }

        if (errors.length > 0)
        {
            if (user)
            {
                user.failed_login += 1
                if (user.failed_login > FAILED_LOGINS)
                    ewith['need_recaptcha'] = true
                yield user.save()
            }

            ewith['errors'] = errors

            yield req.withOnly('email').andWith(ewith).flash()
            return res.route('/login')
        }

        user.failed_login = 0;
        yield user.save()

        yield req
            .with({successes: [{message: "Veiksmīgi ieiets lietotājā " + email}]})
            .flash()
        res.redirect('back')
    }

    * logout(request, response) {
        yield request.auth.logout()
        response.route('/')
    }
}

module.exports = AuthController
