'use strict'

class Notauth {

  * handle (request, response, next) {

    const isLoggedIn = yield request.auth.check()
    if (isLoggedIn) {
      console.log("LOGGED IN")
      return response.redirect('/')
    }

      console.log(" NOT LOGGED IN")
    yield next
  }

}

module.exports = Notauth
