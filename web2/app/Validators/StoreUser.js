'use strict'

class StoreUser {
  get sanitizationRules () {
    return {
      email: 'normalize_email',
    }
  }
  get rules () {
    return {
      email: 'required|email|unique:users|max:250',
      email_confirmation: 'required_if:email|same:email',
    }
  }
}

module.exports = StoreUser
