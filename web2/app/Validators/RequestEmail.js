'use strict'

const Antl = use('Antl')

class RequestEmail {
  get messages() {
    return {
      'required': Antl.formatMessage('main.val_required'),
      'email': Antl.formatMessage('main.val_email'),
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
      email: 'required|email|max:250',
      email_confirmation: 'required_if:email|same:email',
    }
  }
}

module.exports = RequestEmail
