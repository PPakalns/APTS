'use strict'

const Database = use('Database')
const User = use('App/Model/User')
const Group = use('App/Model/Group')

class UserController {

  * index(req, res) {
    const users = yield User.all()
    res.json(users)
  }

  // Returns list of emails which have search as substring
  * shortlist(req, res) {
    const search = ''+req.input('search')
    const notGroupId = req.param("not_group_id")

    let query = Database
      .select('email', 'id')
      .from('users')
      .whereRaw("INSTR(email,?) > 0",[search])
      .limit(10)

    if (notGroupId)
    {
      const group = yield Group.findOrFail(notGroupId)

      const subquery = Database
        .select('user_id')
        .from('user_group')
        .where('group_id', group.id)

      query = query.whereNotIn('id', subquery)
    }

    const users = yield query.debug();

    res.json(users)
  }
}

module.exports = UserController
