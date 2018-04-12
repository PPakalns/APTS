'use strict'

const Antl = use('Antl')
const { rule } = require('indicative')

class ExportTill {
  get messages() {
    return {
      'dateFormat': Antl.formatMessage('main.val_dateFormat'),
    }
  }

  get rules () {
    return {
      till: [
        rule('dateFormat', 'YYYY-MM-DD HH:mm:ss')
      ]
    }
  }
}

module.exports = ExportTill
