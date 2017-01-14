'use strict'

const Lucid = use('Lucid')

class Problem extends Lucid {

  static get rules () {
    return {
      name: 'required|max:524'
    }
  }

  creator() {
    return this.belongsTo('App/Model/User', 'id', 'author')
  }

  tests() {
    return this.hasMany('App/Model/Test')
  }

}

module.exports = Problem
