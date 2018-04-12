'use strict'

const Antl = use('Antl')

class ProblemStore {
  get messages() {
    return {
      'required': Antl.formatMessage('main.val_required'),
      'max': Antl.formatMessage('main.val_max'),
    }
  }

  get rules () {
    return {
      name: 'required|max:524'
    }
  }
}

module.exports = ProblemStore
