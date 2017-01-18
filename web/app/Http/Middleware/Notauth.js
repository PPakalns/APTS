'use strict'

class Notauth {

  * handle (req, res, next) {

    const isLoggedIn = yield req.auth.check()
    if (isLoggedIn) {
      return res.redirect('/')
    }

    yield next
  }

}

module.exports = Notauth
