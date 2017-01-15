'use strict'

class RouteForAdmin {

  * handle (request, response, next) {

    if (req.cUser.admin)
    {
      yield next
    }
    else
    {
      return res.location('back')
    }
  }

}

module.exports = RouteForAdmin
