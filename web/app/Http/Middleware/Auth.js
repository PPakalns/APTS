'use strict'

class Auth {

  * handle (req, res, next) {
    const isLoggedIn = yield req.auth.check()
    if (isLoggedIn) {
      yield next
    }
    else
    {
      yield req
        .with({errors: [{message:"Lai skatītu pieprasīto lapu, Jums nav nepieciešamās atļaujas."}]})
        .flash()
      return res.route('home')
    }
  }

}

module.exports = Auth
