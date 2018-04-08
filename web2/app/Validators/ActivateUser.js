'use strict'

const Antl = use('Antl')

class ActivateUser {
  get messages() {
    return {
      'password.min': Antl.formatMessage('main.password_min_length', {length: 6}),
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
