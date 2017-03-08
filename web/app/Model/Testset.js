'use strict'

const Lucid = use('Lucid')

class Testset extends Lucid {
  tests () {
    return this.hasMany('App/Model/Test')
  }

  problem () {
    return this.belongsTo('App/Model/Problem')
  }

  submissions () {
    return this.hasMany('App/Model/Submission')
  }

  zip () {
    return this.belongsTo('App/Model/File', 'id', 'zip_id')
  }

  checker () {
    return this.belongsTo('App/Model/File', 'id', 'checker_id')
  }
}

module.exports = Testset
