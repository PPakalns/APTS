'use strict'

const Lucid = use('Lucid')

class File extends Lucid {

  testset_zips () {
    return this.hasMany('App/Model/Testset', 'id', 'zip_id')
  }

  testset_checker() {
    return this.hasMany('App/Model/Testset', 'id', 'checker_id')
  }

  submissions () {
    return this.hasMany('App/Model/Submission', 'id', 'file_id')
  }
}

module.exports = File
