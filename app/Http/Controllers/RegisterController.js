'use strict'

class RegisterController {

  * index(request, response) {
    yield response.sendView('register');
  }

  * register(request, response) {

    const user = new User()

    user.email = request.input('email')
    user.password = request.input('password')

    yield user.save()

    var registerMessage = {
      success: 'Reģistrācija bija veiksmīga. Varat ieiet sistēmā.'
    }

    yield response.sendView('register', { registerMessage: Register } );
  }
}

module.exports = RegisterController
