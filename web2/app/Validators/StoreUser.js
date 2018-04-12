'use strict'

const Antl = use('Antl')

class StoreUser {
  get messages() {
    return {
      'required': Antl.formatMessage('main.val_required'),
      'email': Antl.formatMessage('main.val_email'),
      'unique': Antl.formatMessage('main.val_unique'),
      'max': Antl.formatMessage('main.val_max'),
      'required_if': Antl.formatMessage('main.val_required_if'),
      'same': Antl.formatMessage('main.val_same'),
    }
  }

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
