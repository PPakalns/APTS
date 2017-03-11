'use strict'

const Judge = use('App/Model/Judge')

class Authjudge {
    * handle (req, response, next) {
        // Login user with basic auth
        let judge = null

        let user_data = basic_auth(req.request)
        if (user_data)
        {
            let judges = yield Judge.query()
                .where('name', user_data.name)
                .where('pass', user_data.pass)
                .where('disabled', false)
                .fetch()
            if (judges && judges.length > 0)
                judge = judges[ 0 ];
        }

        if (judge) {
            req.judge = judge
            yield next
        }
        else
        {
            res.unauthorized().json({status: "unauthorized"})
            return
        }
        yield next
    }
}

module.exports = Authbasic
