'use strict'

const { rule } = require('indicative')

class ExportTill {
  get rules () {
    return {
      till: [
        rule('dateFormat', 'YYYY-MM-DD HH:mm:ss')
      ]
    }
  }
}

module.exports = ExportTill
