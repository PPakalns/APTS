'use strict'

const Model = use('Model')

class Test extends Model {
  testset () {
    return this.belongsTo('App/Models/Testset', 'testset_id', 'id')
  }
}

module.exports = Test
