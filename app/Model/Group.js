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

}

module.exports = Group
