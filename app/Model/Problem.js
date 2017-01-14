'use strict'

const Lucid = use('Lucid')

class Problem extends Lucid {

  static get rules () {
    return {
      name: 'required|max:524',
      timelimit: 'required',
      memory: 'required|integer|min:1|max:1024'
    }
  }

  creator() {
    return this.belongsTo('App/Model/User', 'id', 'author')
  }

  tests() {
    return this.hasMany('App/Model/Test', 'id', 'problem_id')
  }

  assignments() {
    return this.hasMany('App/Model/Assignment', 'id', 'problem_id')
  }

}

module.exports = Problem
