'use strict'

const Model = use('Model')

class Problem extends Model {

  creator() {
    return this.belongsTo('App/Models/User', 'author', 'id')
  }

  testset() {
    return this.belongsTo('App/Models/Testset', 'testset_id', 'id')
  }

  testsets() {
    return this.hasMany('App/Models/Testset', 'problem_id', 'id')
  }

  assignments() {
    return this.hasMany('App/Models/Assignment', 'problem_id', 'id')
  }

}

module.exports = Problem
