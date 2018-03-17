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
    this.addHook('beforeCreate', 'User.createToken')
  }

  static get hidden () {
    return ['password']
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
}

module.exports = User
