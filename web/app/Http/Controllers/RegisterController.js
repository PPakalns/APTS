'use strict'

const Validator = use('Validator')
const User = use('App/Model/User')

class RegisterController {

  * index(request, response) {
    yield response.sendView('register');
  }

  * register(request, response) {

    const userData = request.only('email', 'password')

    const validation = yield Validator.validate(userData, User.rules)

    if (validation.fails())
    {
      yield request
        .withOnly('email', 'password')
        .andWith({errors: validation.messages() })
        .flash()

      response.redirect('back')
      return
    }

    const user = new User()

    user.email = request.input('email')
    user.password = request.input('password')

    yield user.save()

    var registerMessage = {
      success: 'Reģistrācija bija veiksmīga. Varat ieiet sistēmā.'
    }

    yield request.with({successes:[{message:registerMessage.success}]}).flash()
    response.redirect('back')
  }
}

module.exports = RegisterController
