'use strict'

const User = use('App/Model/User')
const Hash = use('Hash')

class AuthController {

  * index(request, response) {
    yield response.sendView('login');
  }

  * login(request, response) {

    const email = request.input('email')
    const password = request.input('password')

    try {
      request.auth.attempt(email, password)
    } catch (e) {
      yield request.withAll().andWith({error: [e]}).flash()
      return response.redirect('login')
    }

    yield response.sendView('login')
  }

  * logout(request, response) {

    yield request.auth.logout()
    yield response.redirect('/')
  }
}

module.exports = AuthController
