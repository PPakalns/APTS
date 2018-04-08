'use strict'

class RequestEmail {
  get sanitizationRules () {
    return {
      email: 'normalize_email',
    }
  }
  get rules () {
    return {
      email: 'required|email|max:250',
      email_confirmation: 'required_if:email|same:email',
    }
  }
}

module.exports = RequestEmail
