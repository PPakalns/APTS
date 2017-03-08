'use strict'

const Lucid = use('Lucid')

class Submission extends Lucid {
  user () {
    return this.belongsTo('App/Model/User', 'id', 'user_id')
  }

  assignment () {
    return this.belongsTo('App/Model/Assignment')
  }

  testset () {
    return this.belongsTo('App/Model/Testset')
  }

  judge () {
    return this.belongsTo('App/Model/User', 'id', 'judge_id')
  }
}

module.exports = Submission
