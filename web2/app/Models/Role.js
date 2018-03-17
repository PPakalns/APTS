'use strict'

const Model = use('Model')

class Role extends Model {
  user () {
    return this.belongsTo('App/Model/User', 'id', 'user_id')
  }
}

module.exports = Role
