'use strict'

const Lucid = use('Lucid')

class Assignment extends Lucid {
  problem() {
    return this.belongsTo('App/Model/Problem', 'id', 'problem_id')
  }

  group() {
    return this.belongsTo('App/Model/Group', 'id', 'group_id')
  }
}

module.exports = Assignment
