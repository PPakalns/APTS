'use strict'

const Lucid = use('Lucid')

class Test extends Lucid {

  problem () {
    return this.belongsTo('App/Model/Problem', 'id', 'problem_id')
  }

}

module.exports = Test
