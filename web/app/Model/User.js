'use strict'

const Lucid = use('Lucid')
const Hash = use('Hash')

class User extends Lucid {

    static get activation_messages () {
        return {
            'pass.required': 'Lūdzu norādiet paroli!',
            'pass.min': 'Parolei jābūt vismaz 8 zīmes garai!',
            'pass.max': 'Paroles garums nedrīkst pārsniegt 40 zīmes.',
            'pass_confirm.same': 'Ievadītajām parolēm jāsakrīt!'
        }
    }

    static get activation_rules () {
        return {
            pass: 'required|min:8|max:40',
            pass_confirm: 'same:pass'
        }
    }

    static get registration_messages () {
        return {
            'email.required': 'Nepieciešams norādīt epasta adresi.',
            'email.email': 'Epasta adrese neatbilst epasta formātam.',
            'email.unique': 'Lietotājs ar šādu epasta adresi jau eksistē.',
            'email_confirm.same': 'Norādītās epasta adreses nesakrīt.'
        }
    }

    static get registration_rules () {
        return {
            email: 'required|email|unique:users|max:250',
            email_confirm: 'same:email'
        }
    }

    static get hidden () {
        return ['password']
    }

    apiTokens () {
        return this.hasMany('App/Model/Token')
    }

    submissions () {
        return this.hasMany('App/Model/Submission', 'id', 'user_id')
    }

    judged () {
        return this.hasMany('App/Model/Submission', 'id', 'judge_id')
    }

    problems () {
        return this.hasMany('App/Model/Problem')
    }

    roles() {
        return this.hasMany('App/Model/Role', 'id', 'user_id')
    }

    groups () {
        return this.belongsToMany('App/Model/Group', 'user_group')
    }
}

module.exports = User
