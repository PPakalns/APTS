'use strict'

class RouteForAdmin {

  * handle (req, res, next) {

    if (req.cUser.admin)
    {
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

module.exports = RouteForAdmin
