'use strict'

class SubmissionStore {
  get rules () {
    return {
        type: 'required|in:cpp,cpp11,c,c11,fpc'
    }
  }
}

module.exports = SubmissionStore
