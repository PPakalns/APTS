'use strict'

class Authbasic {
    * handle (request, response, next) {
        const basicAuth = req.auth.authenticator('basic')
        if (yield basicAuth.check()) {
            yield next
        }
        else
        {
            yield req
                .with({errors: [{message:"Lai skatītu pieprasīto lapu, Jums nav nepieciešamās atļaujas."}]})
                .flash()
            return res.route('home')
        }
        yield next
    }
}

module.exports = Authbasic
