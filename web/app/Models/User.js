'use strict'

const Model = use('Model')
const Event = use('Event')
const Hash = use('Hash')
const Token = require('rand-token').generate;
const Validator = use('Validator')

class User extends Model {
  static boot () {
    super.boot()
    /**
     * A hook to hash the user password before saving
     * it to the database.
     **/
    this.addHook('beforeCreate', 'User.hashPassword')
    this.addHook('beforeCreate', 'User.createToken')
  }

  static get hidden () {
    return ['password']
  }

  static getToken() {
    const LEN_KEY = 48
    return String(Token(LEN_KEY));
  }

  // In database we store hashed values
  static async Hash(plain) {
    return await Hash.make(plain, 10)
  }

  static async validateHash(plain, hashed) {
    return await Hash.verify(plain, hashed)
  }

  static async newUser(email) {
    let user = new User()
    user.email = Validator.sanitizor.normalizeEmail(email)
    user.activated = false
    let key = User.getToken()
    user.email_change_hash = await User.Hash(key)
    user.email_change_time = new Date()
    await user.save()

    // Fire event for registration email etc
    Event.fire('mail:registration', {user, key})
    return user
  }

  tokens () {
    return this.hasMany('App/Models/Token')
  }

  /* A user which imported this user */
  creator () {
    return this.belongsTo('App/Models/User', 'id', 'created_by_id')
  }

  /* List of users that was created by this user */
  createdUsers () {
      return this.hasMany('App/Models/User', 'id', 'user_id')
  }

  /* User permission roles */
  roles() {
      return this.hasMany('App/Models/Role', 'id', 'user_id')
  }

  /* Participates in following groups */
  groups () {
      return this.belongsToMany(
        'App/Models/Group',
        'user_id',
        'group_id',
        'id',
        'id'
      ).pivotTable('user_group')
  }

  submissions () {
      return this.hasMany('App/Models/Submission', 'id', 'user_id')
  }
}

module.exports = User
