'use strict'

class ParticipantImport {
  get rules () {
    return {
      email: 'required|string',
      student_id: 'required|string'
    }
  }
}

module.exports = ParticipantImport
