'use strict'

const Model = use('Model')

class User extends Model {
  static boot () {
    super.boot()

    /**
     * A hook to hash the user password before saving
     * it to the database.
     **/
    this.addHook('beforeCreate', 'User.hashPassword')
  }

  tokens () {
    return this.hasMany('App/Models/Token')
  }
}

module.exports = User
