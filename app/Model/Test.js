'use strict'

const Lucid = use('Lucid')

class Test extends Lucid {

  problem () {
    return this.belongsTo('App/Model/Problem')
  }

}

module.exports = Test
