'use strict'

const User = use('App/Model/User')

class UserController {

  * index(req, res) {
    const users = yield User.all()
    res.json(users)
  }

}

module.exports = UserController
