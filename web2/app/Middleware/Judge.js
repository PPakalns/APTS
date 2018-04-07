'use strict'

const Judge = use('App/Models/Judge')
const Hash = use('Hash')
const basic_auth = require('basic-auth')

class Judge {
  async handle ({ request, response }, next) {

    // Login judge with basec auth
    let judge = null

    let user_data = basic_auth(request.request)
    if (user_data) {
      let test_judge = await Judge.findBy('name', user_data.name)
      if (test_judge && test_judge.disabled == false) {
        if (await Hash.verify(user_data.pass, test_judge.pass)) {
          judge = test_judge
        }
      }
    }

    if (judge) {
      request.judge = judge
      await next()
    } else {
      response.json({status: "unauthorized"})
      return
    }
  }
}

module.exports = Judge
