'use strict'

const Model = use('Model')
const Event = use('Event')
const Token = require('rand-token').generate;

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

  static async newUser(email) {
    const LEN_KEY = 48
    let user = new User()
    user.email = email
    user.activated = false
    user.email_change_hash = String(Token(LEN_KEY))
    user.email_change_time = new Date()
    await user.save()

    // Fire event for registration email etc
    Event.fire('new:user', user)
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
