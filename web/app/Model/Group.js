'use strict'

const Lucid = use('Lucid')

class Group extends Lucid {

  static get rules () {
    return {
      name: 'required|max:524'
    }
  }

  users () {
    return this.belongsToMany('App/Model/User', 'user_group')
  }

  assignments() {
    return this.hasMany('App/Model/Assignment', 'id', 'group_id')
  }
}

module.exports = Group
