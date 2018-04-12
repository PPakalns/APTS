'use strict'

const Antl = use('Antl')

class SubmissionStore {
  get messages() {
    return {
      'required': Antl.formatMessage('main.val_required'),
    }
  }

  get rules () {
    return {
        type: 'required|in:cpp,cpp11,c,c11,fpc'
    }
  }
}

module.exports = SubmissionStore
