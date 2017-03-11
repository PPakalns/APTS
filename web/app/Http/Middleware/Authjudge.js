'use strict'

const Judge = use('App/Model/Judge')
const Hash = use('Hash')
let basic_auth = require('basic-auth')

class Authjudge {
    * handle (req, res, next) {
        // Login user with basic auth
        let judge = null

        let user_data = basic_auth(req.request)
        if (user_data)
        {
            let test_judge = yield Judge.findBy('name', user_data.name)
            if (test_judge && test_judge.disabled==false)
            {
                if (yield Hash.verify(user_data.pass, test_judge.pass))
                    judge = test_judge
            }
        }

        if (judge) {
            req.judge = judge
            yield next
        }
        else
        {
            res.json({status: "unauthorized"})
            return
        }
        yield next
    }
}

module.exports = Authjudge
