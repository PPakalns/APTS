'use strict'

class AssignmentStore {
  get sanitizationRules () {
    return {
      score_visibility: 'to_int',
    }
  }
  get rules () {
    return {
      score_visibility: 'required|integer',
    }
  }
}

module.exports = AssignmentStore
