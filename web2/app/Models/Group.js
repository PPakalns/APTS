'use strict'

const Model = use('Model')

class Group extends Model {
    users () {
      return this.belongsToMany(
        'App/Models/User',
        'group_id',
        'user_id',
        'id',
        'id'
      ).pivotTable('user_group')
    }

    assignments() {
        return this.hasMany('App/Models/Assignment', 'id', 'group_id')
    }
}

module.exports = Group
