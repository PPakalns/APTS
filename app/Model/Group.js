'use strict'

const Lucid = use('Lucid')

class Group extends Lucid {

  users () {
    return this.belongsToMany('App/Model/User', 'user_group')
  }

}

module.exports = Group
