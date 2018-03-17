'use strict'

class StoreGroup {
  get rules () {
    return {
      name: 'required|max:524'
    }
  }
}

module.exports = StoreGroup
