'use strict'

const Model = use('Model')

class Problem extends Model {

  creator() {
    return this.belongsTo('App/Model/User', 'id', 'author')
  }

  testset() {
    return this.belongsTo('App/Model/Testset', 'id', 'testset_id')
  }

  testsets() {
    return this.hasMany('App/Model/Testset', 'id', 'problem_id')
  }

  assignments() {
    return this.hasMany('App/Model/Assignment', 'id', 'problem_id')
  }

}

module.exports = Problem
