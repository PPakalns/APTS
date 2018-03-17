'use strict'

class StoreUser {
  get rules () {
    return {
      email: 'required|email|unique:users|max:250',
      email_confirmation: 'required_if:email|same:email',
    }
  }
}

module.exports = StoreUser
