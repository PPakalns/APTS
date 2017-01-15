'use strict'

class AuthenticatedUserPopulate {

  * handle (req, res, next) {

    yield req.currentUser.related('roles').load()
    req.currentUserJSON = req.currentUser.toJSON()

    yield next
  }

}

module.exports = AuthenticatedUserPopulate
