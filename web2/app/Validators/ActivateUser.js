'use strict'

const Antl = use('Antl')

class ActivateUser {
  get messages() {
    return {
      'min': Antl.formatMessage('main.val_min'),
      'required': Antl.formatMessage('main.val_required'),
      'required_if': Antl.formatMessage('main.val_required_if'),
      'same': Antl.formatMessage('main.val_same'),
    }
  }

  get rules () {
    return {
      password: 'required|min:6',
      password_confirmation: 'required_if:password|same:password',
    }
  }

  async fails (errorMessages) {
    this.ctx.session
      .withErrors(errorMessages)
      .flashOnly([])
    return this.ctx.response.redirect('back')
  }
}

module.exports = ActivateUser
