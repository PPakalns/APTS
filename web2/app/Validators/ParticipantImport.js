'use strict'

const Antl = use('Antl')

class ParticipantImport {
  get messages() {
    return {
      'required': Antl.formatMessage('main.val_required'),
      'string': Antl.formatMessage('main.val_string'),
    }
  }

  get rules () {
    return {
      email: 'required|string',
      student_id: 'required|string'
    }
  }
}

module.exports = ParticipantImport
