'use strict'

const Database = use('Database')
const User = use('App/Model/User')

class UserController {

  * index(req, res) {
    const users = yield User.all()
    res.json(users)
  }

  // Returns list of emails which have search as substring
  * shortlist(req, res) {
    const search = ''+req.input('search')

    const users = yield Database
      .table('users')
      .select('email')
      .whereRaw("INSTR(email,?) > 0",[search])
      .limit(10)

    res.json(users)
  }
}

module.exports = UserController
