'use strict'

const Antl = use('Antl')
const { rule } = use('Validator')

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
