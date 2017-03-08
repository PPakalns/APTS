'use strict'

const Lucid = use('Lucid')
const Hash = use('Hash')

class User extends Lucid {

  static get rules () {
    return {
      email: 'required|email|unique:users',
      password: 'required|min:8|max:30'
    }
  }

  static boot () {
    super.boot()

    /**
     * Hashing password before storing to the
     * database.
     */
    this.addHook('beforeCreate', function * (next) {
      this.password = yield Hash.make(this.password)
      yield next
    })
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
