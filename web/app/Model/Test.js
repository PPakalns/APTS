'use strict'

const Lucid = use('Lucid')

class Test extends Lucid {

  testset () {
    return this.belongsTo('App/Model/Testset', 'id', 'testset_id')
  }
}

module.exports = Test
