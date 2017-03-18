'use strict'

const Database = use('Database')
const User = use('App/Model/User')
const Group = use('App/Model/Group')
const Validator = use('Validator')
const reCAPTCHA = use('reCAPTCHA')
const Hash = use('Hash')

class UserController {

    * index(req, res) {
        const users = yield User.all()
        res.json(users)
    }

    * show(req, res) {
        // If user is not an admin - show only users own page
        let id = req.cUser.ruser.id
        if (req.cUser.admin){
            id = req.param('user_id', id)
        }
        let user = yield User.findOrFail(id)
        let data = {}
        const sub_cnt = yield Database.table('submissions').where('user_id', id).count()
        data.submissions = sub_cnt[ 0 ]['count(*)']

        yield res.sendView('user/show', {user: user.toJSON(), data: data})
    }

    * change_password(req, res) {
        // If user is not an admin - show only users own page
        let id = req.cUser.ruser.id
        if (req.cUser.admin){
            id = req.param('user_id', id)
        }
        let user = yield User.findOrFail(id)

        const userData = req.only('pass', 'pass_confirm', 'old_pass')

        let errors = []

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

        if (errors.length == 0)
        {
            if (!(yield Hash.verify(userData.old_pass || "", user.password)))
            {
                errors.push({msg: "Nepareizi norādīta pašreizējā parole!"})
            }
        }

        if (errors.length > 0)
        {
            yield req.with({errors: errors}).flash()
            res.redirect('back')
            return
        }

        user.password = yield Hash.make(userData.pass)
        yield user.save()

        let message = {msg: "Lietotāja parole nomainīta veiksmīgi!"}
        yield req.with({successes:[message]}).flash()
        res.redirect('back')
    }

    // Returns list of emails which have search as substring
    * shortlist(req, res) {
        const search = ''+req.input('search')
        const notGroupId = req.param("not_group_id")

        let query = Database
            .select('email', 'id')
            .from('users')
            .whereRaw("INSTR(email,?) > 0",[search])
            .limit(10)

        if (notGroupId)
        {
            const group = yield Group.findOrFail(notGroupId)

            const subquery = Database
                .select('user_id')
                .from('user_group')
                .where('group_id', group.id)

            query = query.whereNotIn('id', subquery)
        }

        const users = yield query;

        res.json(users)
    }
}

module.exports = UserController
