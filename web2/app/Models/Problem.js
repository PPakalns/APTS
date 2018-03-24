'use strict'

const Model = use('Model')

class Problem extends Model {

  creator() {
    return this.belongsTo('App/Models/User', 'id', 'author')
  }

  testset() {
    return this.belongsTo('App/Models/Testset', 'id', 'testset_id')
  }

  testsets() {
    return this.hasMany('App/Models/Testset', 'id', 'problem_id')
  }

  assignments() {
    return this.hasMany('App/Models/Assignment', 'id', 'problem_id')
  }

}

module.exports = Problem
