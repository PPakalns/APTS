'use strict'

class ActivateUser {
  get rules () {
    return {
      password: 'required',
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
