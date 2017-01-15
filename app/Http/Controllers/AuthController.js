'use strict'

const User = use('App/Model/User')
const Hash = use('Hash')
const Validator = use('Validator')

class AuthController {

  * index(request, response) {
    yield response.sendView('login');
  }

  * login(request, response) {

    const email = request.input('email')
    const password = request.input('password')

    try {
      yield request.auth.attempt(email, password)
    } catch (e) {
      yield request
        .withOnly('email')
        .andWith({errors: [{message: "Autentifikācija bija neveiksmīga!"}]})
        .flash()
      return response.route('/login')
    }

    yield request
      .with({successes: [{message: "Veiksmīgi ieiets lietotājā " + email}]})
      .flash()
    response.redirect('back')
  }

  * logout(request, response) {
    yield request.auth.logout()
    response.route('/')
  }
}

module.exports = AuthController
