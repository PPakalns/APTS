'use strict'

class GroupStore {
  get rules () {
    return {
      name: 'required|max:524'
    }
  }
}

module.exports = GroupStore
