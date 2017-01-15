'use strict'

const Lucid = use('Lucid')

class Submission extends Lucid {
  user () {
    return this.belongsTo('App/Model/User')
  }

  assignment () {
    return this.belongsTo('App/Model/Assignment')
  }
}

module.exports = Submission
