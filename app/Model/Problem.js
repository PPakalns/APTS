'use strict'

const Lucid = use('Lucid')

class Problem extends Lucid {

  creator() {
    return this.belongsTo('App/Model/User', 'id', 'author')
  }

}

module.exports = Problem
