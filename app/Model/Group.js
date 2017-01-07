'use strict'

const Lucid = use('Lucid')

class Group extends Lucid {

  static get rules () {
    return {
      name: 'required'
    }
  }

  users () {
    return this.belongsToMany('App/Model/User', 'user_group')
  }

}

module.exports = Group
